/**
 * localData.js
 * Provides a simple in-memory database backed by the local JSON files
 * for local development and demo purposes.
 */

import cctnsDataset from '../../data/imported_cctns_dataset.json';
import aiOutputs from '../../data/computed_ai_outputs.json';
import firDatabase from '../../data/extracted_fir_database.json';

// Merge cases: CCTNS is the primary source, FIR database supplements
const cctnsById = Object.fromEntries((cctnsDataset.cases || []).map(c => [c.id, c]));
const firById = Object.fromEntries((firDatabase.cases || []).map(c => [c.id, c]));
// Merge: FIR data fills in any cases not in CCTNS
const mergedCases = Object.values({ ...firById, ...cctnsById });

export const localDB = {
  cases: mergedCases,
  persons: cctnsDataset.persons || [],
  phones: cctnsDataset.phones || [],
  vehicles: cctnsDataset.vehicles || [],
  accounts: cctnsDataset.accounts || [],
  organizations: cctnsDataset.organizations || [],
  events: cctnsDataset.events || [],
  person_case_roles: cctnsDataset.person_case_roles || [],
  relationships: cctnsDataset.relationships || [],
  mo_fingerprints: cctnsDataset.mo_fingerprints || [],
  mo_similarities: aiOutputs.mosimilarityoutput || cctnsDataset.mo_similarities || [],
  alerts: cctnsDataset.alerts || [],
  findings: cctnsDataset.findings || [],
  communities: cctnsDataset.communities || aiOutputs.communities || [],
  link_predictions: cctnsDataset.link_predictions || aiOutputs.link_predictions || [],
  anomalies: cctnsDataset.anomalies || aiOutputs.anomalies || [],
  evidence: cctnsDataset.evidence || [],
  evidence_links: cctnsDataset.evidence_links || [],
  fir_documents: cctnsDataset.fir_documents || [],
};

/**
 * Simple helper to filter an array with case-insensitive ilike matching
 */
function ilike(str, pattern) {
  if (!str || !pattern) return false;
  const p = pattern.replace(/%/g, '.*').toLowerCase();
  return new RegExp(`^${p}$`).test(String(str).toLowerCase());
}

/**
 * Filter an array by an object of exact-match or ilike filters
 * Supports: { field: value } for exact, { field: '%val%' } for ilike
 */
export function filterRows(rows, filters = {}) {
  return rows.filter(row => {
    for (const [key, val] of Object.entries(filters)) {
      if (val === undefined || val === null || val === 'All' || val === '') continue;
      const cell = row[key];
      if (typeof val === 'string' && val.includes('%')) {
        if (!ilike(cell, val)) return false;
      } else {
        if (String(cell) !== String(val)) return false;
      }
    }
    return true;
  });
}
