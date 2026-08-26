import fs from 'fs';
import path from 'path';

const ai = JSON.parse(fs.readFileSync('data/computed_ai_outputs.json', 'utf8'));
const base = JSON.parse(fs.readFileSync('data/imported_cctns_dataset.json', 'utf8'));

console.log('================================================================================');
console.log('  1. COMMUNITY SIZE DISTRIBUTION');
console.log('================================================================================');
const sizes = ai.networkcommunity.map(c => c.member_count).sort((a, b) => a - b);
const min = sizes[0] || 0;
const max = sizes[sizes.length - 1] || 0;
const median = sizes[Math.floor(sizes.length / 2)] || 0;
const avg = (sizes.reduce((a, b) => a + b, 0) / Math.max(1, sizes.length)).toFixed(2);

console.log(`Total communities detected : ${sizes.length}`);
console.log(`Min members                : ${min}`);
console.log(`Max members                : ${max}`);
console.log(`Median members             : ${median}`);
console.log(`Average members            : ${avg}`);
console.log('Size Breakdown:');
console.log(`  • 3–4 members   : ${sizes.filter(s => s >= 3 && s <= 4).length}`);
console.log(`  • 5–9 members   : ${sizes.filter(s => s >= 5 && s <= 9).length}`);
console.log(`  • 10–19 members : ${sizes.filter(s => s >= 10 && s <= 19).length}`);
console.log(`  • 20+ members   : ${sizes.filter(s => s >= 20).length}`);

console.log('\n================================================================================');
console.log('  2. TOP 10 MO SIMILARITY PAIRS & SOURCE ROW CROSS-CHECK');
console.log('================================================================================');
ai.mosimilarityoutput.slice(0, 10).forEach((m, idx) => {
  console.log(`[${idx + 1}] Similarity: ${m.similarity_score}% | Case A: ${m.case_id_a} <--> Case B: ${m.case_id_b}`);
  console.log(`    Matching Components: ${m.matching_components.join('; ')}`);
});

// Manual cross-check on 3 pairs
console.log('\n--- Deep Inspection of 3 Sample MO Matches ---');
const sampleMatches = ai.mosimilarityoutput.slice(0, 3);
sampleMatches.forEach((m, idx) => {
  const caseA = base.cases.find(c => c.id === m.case_id_a);
  const caseB = base.cases.find(c => c.id === m.case_id_b);
  const moA = base.mo_fingerprints.find(mo => mo.case_id === m.case_id_a);
  const moB = base.mo_fingerprints.find(mo => mo.case_id === m.case_id_b);

  console.log(`\nSample Match #${idx + 1} (Score: ${m.similarity_score}%):`);
  console.log(`  Case A (${m.case_id_a} - ${caseA?.crime_no}):`);
  console.log(`    • Head: ${caseA?.crime_major_head} | Station: ${caseA?.police_station}`);
  console.log(`    • Tools: "${moA?.tools}"`);
  console.log(`    • Entry: "${moA?.entry_method}"`);
  console.log(`    • Transport: "${moA?.transport}"`);
  console.log(`    • Concealment: "${moA?.concealment}"`);
  console.log(`  Case B (${m.case_id_b} - ${caseB?.crime_no}):`);
  console.log(`    • Head: ${caseB?.crime_major_head} | Station: ${caseB?.police_station}`);
  console.log(`    • Tools: "${moB?.tools}"`);
  console.log(`    • Entry: "${moB?.entry_method}"`);
  console.log(`    • Transport: "${moB?.transport}"`);
  console.log(`    • Concealment: "${moB?.concealment}"`);
});

console.log('\n================================================================================');
console.log('  3. ENTITY RESOLUTION MERGE CANDIDATES AUDIT');
console.log('================================================================================');
ai.entityresolutionoutput.forEach((er, idx) => {
  const pA = base.persons.find(p => p.id === er.candidate_person_id_a);
  const pB = base.persons.find(p => p.id === er.candidate_person_id_b);
  console.log(`[Candidate #${idx + 1}] Confidence: ${er.match_confidence}%`);
  console.log(`  Person A: "${pA?.canonical_name}" (ID: ${pA?.id}, Aliases: [${(pA?.aliases || []).join(', ')}], Gender: ${pA?.gender})`);
  console.log(`  Person B: "${pB?.canonical_name}" (ID: ${pB?.id}, Aliases: [${(pB?.aliases || []).join(', ')}], Gender: ${pB?.gender})`);
  console.log(`  Signals: ${er.matching_signals.join(' | ')}\n`);
});

console.log('================================================================================');
console.log('  4. EVIDENCE TRACEABILITY AUDIT FOR CURATED ALERTS');
console.log('================================================================================');
ai.alert.forEach((alrt, idx) => {
  console.log(`[Alert #${idx + 1}] ID: ${alrt.id} | Title: "${alrt.title}"`);
  console.log(`  Target Case: ${alrt.target_id}`);
  console.log(`  Referenced Evidence: [${alrt.evidence_refs.join(', ')}]`);

  alrt.evidence_refs.forEach(ref => {
    // Check evidence table
    const existsEvi = base.evidence?.some(e => e.id === ref || e.source_id === ref);
    const existsMo = base.mo_fingerprints?.some(m => m.id === ref || m.case_id === ref);
    const existsAnom = ai.anomalydetectionoutput?.some(a => a.id === ref);
    const existsLp = ai.linkpredictionoutput?.some(l => l.id === ref);
    const existsComm = ai.networkcommunity?.some(c => c.community_id === ref);
    const existsDoc = base.fir_documents?.some(d => d.id === ref);
    const existsEr = ai.entityresolutionoutput?.some(e => e.id === ref);

    const isFound = existsEvi || existsMo || existsAnom || existsLp || existsComm || existsDoc || existsEr;
    console.log(`    • Ref "${ref}": ${isFound ? '✓ FOUND IN DATASET' : '✗ NOT FOUND'}`);
  });
  console.log('');
});
