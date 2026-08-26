import 'dotenv/config';
import { isSupabaseConfigured, supabase } from '../src/services/supabaseClient.js';

async function checkLiveDatabase() {
  console.log('================================================================================');
  console.log('  MUMBAI POLICE CIU — LIVE SUPABASE DATABASE AUDIT');
  console.log('================================================================================\n');

  console.log(`Supabase Connected: ${isSupabaseConfigured}`);
  console.log(`Supabase URL      : ${process.env.VITE_SUPABASE_URL}\n`);

  const tables = [
    'cases',
    'persons',
    'phones',
    'vehicles',
    'accounts',
    'organizations',
    'locations',
    'events',
    'person_case_roles',
    'relationships',
    'mo_fingerprints',
    'evidence',
    'evidence_links',
    'fir_documents',
    'mo_similarities',
    'alerts',
    'entityresolutionoutput',
    'networkcommunity',
    'linkpredictionoutput',
    'anomalydetectionoutput',
    'rolepredictionoutput',
    'case_canvases',
    'canvas_nodes',
    'canvas_edges',
    'canvas_snapshots'
  ];

  const results = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        results[table] = { status: 'TABLE_MISSING / ERROR', count: 0, error: error.message };
      } else {
        results[table] = { status: 'LIVE_READY', count: count || 0, error: null };
      }
    } catch (err) {
      results[table] = { status: 'EXCEPTION', count: 0, error: err.message };
    }
  }

  console.table(results);
  return results;
}

checkLiveDatabase().catch(console.error);
