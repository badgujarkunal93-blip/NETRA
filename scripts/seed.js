import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Read the old mock data file directly to avoid import issues after we refactor it
const dbPath = path.join(process.cwd(), 'src/services/db.js');
const dbContent = fs.readFileSync(dbPath, 'utf8');

// We use an eval to get SEED_DATA since it's defined in the file
let SEED_DATA = {};
try {
  const match = dbContent.match(/const SEED_DATA = (\{[\s\S]*?\n\};\n)/);
  if (match) {
    const jsonStr = match[1].replace(/;\s*$/, '');
    SEED_DATA = eval(`(${jsonStr})`);
  } else {
    console.log("Could not find SEED_DATA in db.js");
  }
} catch (e) {
  console.error("Error parsing SEED_DATA:", e);
}

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.error("ERROR: No valid VITE_SUPABASE_URL found in .env. Skipping seed.");
    return;
  }

  console.log("Seeding cases...");
  if (SEED_DATA.cases) {
    for (const item of SEED_DATA.cases) {
      const { error } = await supabase.from('cases').upsert(item);
      if (error) console.error("Error seeding case:", error.message);
    }
  }

  console.log("Seeding persons...");
  if (SEED_DATA.persons) {
    for (const item of SEED_DATA.persons) {
      const { error } = await supabase.from('persons').upsert(item);
      if (error) console.error("Error seeding person:", error.message);
    }
  }

  console.log("Seeding phones...");
  if (SEED_DATA.phones) {
    for (const item of SEED_DATA.phones) {
      const { error } = await supabase.from('phones').upsert(item);
      if (error) console.error("Error seeding phone:", error.message);
    }
  }

  console.log("Seeding vehicles...");
  if (SEED_DATA.vehicles) {
    for (const item of SEED_DATA.vehicles) {
      const { error } = await supabase.from('vehicles').upsert(item);
      if (error) console.error("Error seeding vehicle:", error.message);
    }
  }

  console.log("Seeding accounts...");
  if (SEED_DATA.accounts) {
    for (const item of SEED_DATA.accounts) {
      const { error } = await supabase.from('accounts').upsert(item);
      if (error) console.error("Error seeding account:", error.message);
    }
  }

  console.log("Seeding organizations...");
  if (SEED_DATA.organizations) {
    for (const item of SEED_DATA.organizations) {
      const { error } = await supabase.from('organizations').upsert(item);
      if (error) console.error("Error seeding organization:", error.message);
    }
  }

  console.log("Seeding person_case_roles...");
  if (SEED_DATA.person_case_roles) {
    for (const item of SEED_DATA.person_case_roles) {
      const { error } = await supabase.from('person_case_roles').upsert(item);
      if (error) console.error("Error seeding person_case_roles:", error.message);
    }
  }

  console.log("Seeding relationships...");
  if (SEED_DATA.relationships) {
    for (const item of SEED_DATA.relationships) {
      const { error } = await supabase.from('relationships').upsert(item);
      if (error) console.error("Error seeding relationship:", error.message);
    }
  }

  console.log("Seeding events...");
  if (SEED_DATA.events) {
    for (const item of SEED_DATA.events) {
      const { error } = await supabase.from('events').upsert(item);
      if (error) console.error("Error seeding event:", error.message);
    }
  }

  console.log("Seeding mo_fingerprints...");
  if (SEED_DATA.mo_fingerprints) {
    for (const item of SEED_DATA.mo_fingerprints) {
      const { error } = await supabase.from('mo_fingerprints').upsert(item);
      if (error) console.error("Error seeding mo_fingerprint:", error.message);
    }
  }

  console.log("Seeding mo_similarities...");
  if (SEED_DATA.mo_similarities) {
    for (const item of SEED_DATA.mo_similarities) {
      const { error } = await supabase.from('mo_similarities').upsert(item);
      if (error) console.error("Error seeding mo_similarity:", error.message);
    }
  }
  
  console.log("Seeding completed!");
}

seed();
