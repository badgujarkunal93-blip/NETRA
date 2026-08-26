import fs from 'fs';

const ai = JSON.parse(fs.readFileSync('data/computed_ai_outputs.json', 'utf8'));

console.log('================================================================================');
console.log('  1. CURRENT UNIQUE SIMILARITY SCORE VALUES ACROSS ALL 500 PAIRS');
console.log('================================================================================');
const scores = ai.mosimilarityoutput.map(m => m.similarity_score);
const uniqueScores = [...new Set(scores)].sort((a, b) => b - a);

console.log(`Total Pairs Analyzed: ${scores.length}`);
console.log(`Count of Unique Distinct Similarity Score Values: ${uniqueScores.length}`);
console.log(`Distinct Values: ${uniqueScores.join(', ')}%\n`);

// Value frequencies
const freq = {};
scores.forEach(s => freq[s] = (freq[s] || 0) + 1);
console.table(freq);

console.log('\n================================================================================');
console.log('  2. HUB CHECK ON THE 23 SHOWCASE (80–89%) PAIRS');
console.log('================================================================================');
const showcase = ai.mosimilarityoutput.filter(m => m.similarity_score >= 80 && m.similarity_score <= 89);
console.log(`Total Showcase Pairs: ${showcase.length}`);

const caseCounts = {};
showcase.forEach((p, idx) => {
  caseCounts[p.case_id_a] = (caseCounts[p.case_id_a] || 0) + 1;
  caseCounts[p.case_id_b] = (caseCounts[p.case_id_b] || 0) + 1;
  console.log(`[Pair #${idx + 1}] ${p.case_id_a} <--> ${p.case_id_b} | Score: ${p.similarity_score}% | Distance: ${p.spatial_distance_km} km | Time Delta: ${p.temporal_delta_days} days`);
});

const distinctCases = Object.keys(caseCounts);
console.log(`\nTotal Distinct Case IDs Appearing in Showcase Pairs: ${distinctCases.length} / 46 possible`);
console.log('\nCase ID Occurrence Frequencies in Showcase:');
console.table(caseCounts);
