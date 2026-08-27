import fs from 'fs';
import path from 'path';

// Levenshtein distance for fuzzy string comparison
function getLevenshteinDistance(a, b) {
  const s1 = (a || '').toLowerCase();
  const s2 = (b || '').toLowerCase();
  const matrix = Array.from({ length: s1.length + 1 }, () => Array(s2.length + 1).fill(0));
  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[s1.length][s2.length];
}

function getStringSimilarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = getLevenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

// Token Jaccard similarity for multi-word fields
function getTokenJaccard(a, b) {
  if (!a || !b) return 0;
  const tokensA = new Set((a || '').toLowerCase().split(/[\s/,-]+/).filter(t => t.length > 2));
  const tokensB = new Set((b || '').toLowerCase().split(/[\s/,-]+/).filter(t => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);
  return intersection.size / union.size;
}

// Cosine similarity for semantic embeddings
function getCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return Math.max(0, dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))); // Clip to 0-1
}

async function tuneWeights() {
  console.log('================================================================================');
  console.log('  MO WEIGHT TUNING: GRID SEARCH FOR OPTIMAL HYPERPARAMETERS');
  console.log('================================================================================\n');

  const datasetPath = path.join(process.cwd(), 'data', 'imported_cctns_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`[ERROR] Base imported dataset not found: ${datasetPath}`);
    process.exit(1);
  }

  const baseData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  const moList = baseData.mo_fingerprints.slice(0, 100); // Take sample for speed
  const casesMap = new Map(baseData.cases.map(c => [c.id, c]));

  console.log('1. Fetching MO semantic embeddings from local Python API for tuning sample...');
  const moTexts = moList.map(mo => 
    `Target: ${mo.target}. Timing: ${mo.timing}. Entry: ${mo.entry_method}. Tools: ${mo.tools}. Transport: ${mo.transport}. Concealment: ${mo.concealment}. Action Sequence: ${mo.action_sequence}. Victim Interaction: ${mo.victim_interaction}. Exit: ${mo.exit_method}. Group: ${mo.group_behavior}`
  );

  try {
    const embedRes = await fetch('http://localhost:8000/api/mo/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: moTexts })
    });
    if (embedRes.ok) {
      const data = await embedRes.json();
      if (data.embeddings && data.embeddings.length === moList.length) {
        moList.forEach((mo, idx) => {
          mo.mo_embedding = data.embeddings[idx];
        });
        console.log(`   ✓ Loaded semantic embeddings for ${moList.length} MOs.\n`);
      }
    } else {
      console.warn(`   ⚠️ Failed to fetch embeddings: HTTP ${embedRes.status}. Ensure backend is running.`);
      process.exit(1);
    }
  } catch (err) {
    console.warn(`   ⚠️ Embedder API unreachable: ${err.message}. Ensure backend is running.`);
    process.exit(1);
  }

  console.log('2. Constructing synthetic Ground Truth based on exact minor crime head match...');
  const pairs = [];
  for (let i = 0; i < moList.length; i++) {
    for (let j = i + 1; j < moList.length; j++) {
      const moA = moList[i];
      const moB = moList[j];
      const caseA = casesMap.get(moA.case_id);
      const caseB = casesMap.get(moB.case_id);
      
      if (!caseA || !caseB) continue;

      // Pseudo Ground Truth: True if they share the identical minor head (e.g. "Two-Wheeler Theft" AND exact target match)
      const isGroundTruthMatch = (caseA.crime_minor_head === caseB.crime_minor_head) && (moA.target === moB.target);

      const semanticSim = getCosineSimilarity(moA.mo_embedding, moB.mo_embedding);
      const exactHeadScore = (caseA.crime_major_head === caseB.crime_major_head) ? 1.0 : 0.0;
      
      const jaccardFields = [
        getTokenJaccard(moA.target, moB.target),
        getTokenJaccard(moA.timing, moB.timing),
        getTokenJaccard(moA.entry_method, moB.entry_method),
        getTokenJaccard(moA.tools, moB.tools),
        getTokenJaccard(moA.transport, moB.transport),
        getTokenJaccard(moA.action_sequence, moB.action_sequence)
      ];
      const avgJaccard = jaccardFields.reduce((a, b) => a + b, 0) / jaccardFields.length;

      pairs.push({
        isMatch: isGroundTruthMatch,
        semanticSim,
        exactHeadScore,
        avgJaccard
      });
    }
  }

  const matchesCount = pairs.filter(p => p.isMatch).length;
  console.log(`   ✓ Found ${matchesCount} positive matches out of ${pairs.length} pairs.\n`);

  console.log('3. Running Grid Search (Precision@K metric)...');
  
  let bestWeights = null;
  let bestPrecision = -1;

  // Grid search step 0.1
  for (let wS = 0.1; wS <= 0.8; wS += 0.1) {
    for (let wL = 0.1; wL <= 0.8; wL += 0.1) {
      const wJ = 1.0 - wS - wL;
      if (wJ <= 0.0) continue;

      // Score all pairs
      const scoredPairs = pairs.map(p => {
        const score = (p.semanticSim * wS) + (p.exactHeadScore * wL) + (p.avgJaccard * wJ);
        return { isMatch: p.isMatch, score };
      });

      // Sort by score desc
      scoredPairs.sort((a, b) => b.score - a.score);

      // Evaluate Precision at K (where K = number of true matches)
      const K = matchesCount;
      const topK = scoredPairs.slice(0, K);
      const truePositives = topK.filter(p => p.isMatch).length;
      const precisionAtK = truePositives / K;

      if (precisionAtK > bestPrecision) {
        bestPrecision = precisionAtK;
        bestWeights = { semantic: wS, lexical: wL, jaccard: wJ };
      }
    }
  }

  console.log(`================================================================================`);
  console.log(`  OPTIMAL WEIGHTS FOUND:`);
  console.log(`  Semantic : ${bestWeights.semantic.toFixed(2)}`);
  console.log(`  Lexical  : ${bestWeights.lexical.toFixed(2)}`);
  console.log(`  Jaccard  : ${bestWeights.jaccard.toFixed(2)}`);
  console.log(`  Best Precision@K: ${(bestPrecision * 100).toFixed(1)}%`);
  console.log(`================================================================================\n`);
  
  console.log(`Suggested Updates in compute_ai_outputs.js:`);
  console.log(`const WEIGHT_SEMANTIC = ${bestWeights.semantic.toFixed(2)};`);
  console.log(`const WEIGHT_LEXICAL_EXACT = ${bestWeights.lexical.toFixed(2)};`);
  console.log(`const WEIGHT_JACCARD = ${bestWeights.jaccard.toFixed(2)};`);
}

tuneWeights().catch(console.error);
