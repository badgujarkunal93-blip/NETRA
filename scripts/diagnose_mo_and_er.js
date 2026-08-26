import fs from 'fs';

const base = JSON.parse(fs.readFileSync('data/imported_cctns_dataset.json', 'utf8'));
const ai = JSON.parse(fs.readFileSync('data/computed_ai_outputs.json', 'utf8'));

console.log('================================================================================');
console.log('  1. HISTOGRAM OF CURRENT MO SIMILARITY SCORES (500 PAIRS)');
console.log('================================================================================');
const scores = ai.mosimilarityoutput.map(m => m.similarity_score);
const exact100Count = scores.filter(s => s === 100).length;

const histogram = {
  '100% (Exact Matches)' : exact100Count,
  '90–99%'               : scores.filter(s => s >= 90 && s < 100).length,
  '80–89%'               : scores.filter(s => s >= 80 && s < 90).length,
  '70–79%'               : scores.filter(s => s >= 70 && s < 80).length,
  '60–69%'               : scores.filter(s => s >= 60 && s < 70).length,
  '55–59%'               : scores.filter(s => s >= 55 && s < 60).length,
  '< 55%'                : scores.filter(s => s < 55).length
};

console.table(histogram);
console.log(`Total Pairs Analyzed: ${scores.length}`);
console.log(`Pairs with EXACTLY 100% Score: ${exact100Count} (${((exact100Count / scores.length) * 100).toFixed(1)}%)\n`);

console.log('================================================================================');
console.log('  2. CATEGORICAL VOCABULARY SIZE PER CRIME MAJOR HEAD');
console.log('================================================================================');
const heads = [...new Set(base.cases.map(c => c.crime_major_head))].filter(Boolean);

heads.slice(0, 5).forEach(h => {
  const caseIds = new Set(base.cases.filter(c => c.crime_major_head === h).map(c => c.id));
  const mos = base.mo_fingerprints.filter(m => caseIds.has(m.case_id));
  const targets = new Set(mos.map(m => m.target));
  const timings = new Set(mos.map(m => m.timing));
  const entries = new Set(mos.map(m => m.entry_method));
  const tools = new Set(mos.map(m => m.tools));
  const transports = new Set(mos.map(m => m.transport));
  const concealments = new Set(mos.map(m => m.concealment));

  console.log(`[Crime Major Head: "${h}"] — ${mos.length} total cases`);
  console.log(`  • Targets (${targets.size} distinct)      : ${[...targets].join(' | ')}`);
  console.log(`  • Timings (${timings.size} distinct)      : ${[...timings].join(' | ')}`);
  console.log(`  • Entries (${entries.size} distinct)      : ${[...entries].join(' | ')}`);
  console.log(`  • Tools (${tools.size} distinct)        : ${[...tools].join(' | ')}`);
  console.log(`  • Transports (${transports.size} distinct)   : ${[...transports].join(' | ')}`);
  console.log(`  • Concealments (${concealments.size} distinct) : ${[...concealments].join(' | ')}`);
  console.log('');
});
