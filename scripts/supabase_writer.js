import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseLive = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_URL.includes('dummy'));
const supabase = isSupabaseLive ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Local JSON Store Path
const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'extracted_fir_database.json');

function getLocalStore() {
  if (fs.existsSync(LOCAL_STORE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf8'));
    } catch {
      return { cases: [], persons: [], person_case_roles: [], phones: [], vehicles: [], mo_fingerprints: [] };
    }
  }
  return { cases: [], persons: [], person_case_roles: [], phones: [], vehicles: [], mo_fingerprints: [] };
}

function saveLocalStore(data) {
  const dir = path.dirname(LOCAL_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Writes validated structured FIR extraction into Supabase (and local store).
 * Performs entity resolution for persons across multiple FIRs.
 * 
 * @param {object} structuredData - Validated output from LLM/Zod.
 * @returns {Promise<{ caseId: string, personsResolved: number, newPersons: number, phonesAdded: number, vehiclesAdded: number }>}
 */
export async function writeFIRToDatabase(structuredData) {
  const { case: caseInfo, persons, phones, vehicles, mo_fingerprint } = structuredData;
  const localStore = getLocalStore();

  let caseId = `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  let newPersonsCount = 0;
  let resolvedPersonsCount = 0;
  let phonesCount = 0;
  let vehiclesCount = 0;

  // STEP 1: Insert Case
  const caseRecord = {
    id: caseId,
    crime_no: caseInfo.crime_no,
    case_no: caseInfo.case_no,
    crime_category: caseInfo.crime_category,
    crime_major_head: caseInfo.crime_major_head,
    crime_minor_head: caseInfo.crime_minor_head,
    status: caseInfo.status || 'Under Investigation',
    registered_date: caseInfo.registered_date || new Date().toISOString().split('T')[0],
    incident_from: caseInfo.incident_from,
    incident_to: caseInfo.incident_to,
    latitude: caseInfo.latitude || 19.0760,
    longitude: caseInfo.longitude || 72.8777,
    police_station: caseInfo.police_station || 'Mumbai Police Station',
    brief_facts: caseInfo.brief_facts,
    created_at: new Date().toISOString()
  };

  if (isSupabaseLive) {
    const { data: cData, error: cErr } = await supabase.from('cases').insert([caseRecord]).select();
    if (!cErr && cData?.[0]) caseId = cData[0].id;
  }
  localStore.cases.push(caseRecord);

  // STEP 2: Entity Resolution & Insert Persons
  const personNameToIdMap = new Map();

  for (const p of persons) {
    const normalizedName = p.canonical_name.trim().toLowerCase();
    let existingPerson = null;

    // Check Supabase or Local Store for matching/similar canonical_name
    if (isSupabaseLive) {
      const { data: match } = await supabase
        .from('persons')
        .select('*')
        .ilike('canonical_name', p.canonical_name.trim())
        .limit(1);
      if (match && match.length > 0) existingPerson = match[0];
    } else {
      existingPerson = localStore.persons.find(
        lp => lp.canonical_name.toLowerCase() === normalizedName
      );
    }

    let personId;
    if (existingPerson) {
      personId = existingPerson.id;
      resolvedPersonsCount++;
      // Merge aliases if new alias found
      if (p.aliases && p.aliases.length > 0) {
        existingPerson.aliases = Array.from(new Set([...(existingPerson.aliases || []), ...p.aliases]));
      }
    } else {
      personId = `PER-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPersonRecord = {
        id: personId,
        canonical_name: p.canonical_name.trim(),
        aliases: p.aliases || [],
        dob: p.dob || null,
        gender: p.gender || 'Unknown',
        confidence_score: 95,
        status_tag: p.role_type === 'accused' ? 'Accused' : 'Person of Interest',
        created_at: new Date().toISOString()
      };

      if (isSupabaseLive) {
        const { data: npData } = await supabase.from('persons').insert([newPersonRecord]).select();
        if (npData?.[0]) personId = npData[0].id;
      }
      localStore.persons.push(newPersonRecord);
      newPersonsCount++;
    }

    personNameToIdMap.set(normalizedName, personId);

    // Insert person_case_roles
    const roleRecord = {
      id: `PCR-${Math.floor(10000 + Math.random() * 90000)}`,
      person_id: personId,
      case_id: caseId,
      role_type: p.role_type || 'accused',
      created_at: new Date().toISOString()
    };
    if (isSupabaseLive) await supabase.from('person_case_roles').insert([roleRecord]);
    localStore.person_case_roles.push(roleRecord);
  }

  // STEP 3: Insert Phones
  for (const ph of phones) {
    const ownerId = ph.owner_name ? personNameToIdMap.get(ph.owner_name.trim().toLowerCase()) : null;
    const phoneRecord = {
      id: `PHN-${Math.floor(1000 + Math.random() * 9000)}`,
      owner_person_id: ownerId || null,
      normalized_number_hash: ph.number,
      service_provider: 'Telecom India',
      first_seen: new Date().toISOString().split('T')[0],
      last_seen: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    if (isSupabaseLive) await supabase.from('phones').insert([phoneRecord]);
    localStore.phones.push(phoneRecord);
    phonesCount++;
  }

  // STEP 4: Insert Vehicles
  for (const v of vehicles) {
    const ownerId = v.owner_name ? personNameToIdMap.get(v.owner_name.trim().toLowerCase()) : null;
    const vehicleRecord = {
      id: `VEH-${Math.floor(1000 + Math.random() * 9000)}`,
      owner_person_id: ownerId || null,
      registration_hash: v.registration,
      make_model: v.vehicle_type || 'Vehicle',
      vehicle_type: v.vehicle_type || 'Four Wheeler',
      color: 'Unknown',
      created_at: new Date().toISOString()
    };
    if (isSupabaseLive) await supabase.from('vehicles').insert([vehicleRecord]);
    localStore.vehicles.push(vehicleRecord);
    vehiclesCount++;
  }

  // STEP 5: Insert MO Fingerprint
  const moRecord = {
    id: `MO-${caseId}`,
    case_id: caseId,
    target: mo_fingerprint.target || '',
    timing: mo_fingerprint.timing || '',
    entry_method: mo_fingerprint.entry_method || '',
    tools: mo_fingerprint.tools || '',
    transport: mo_fingerprint.transport || '',
    concealment: mo_fingerprint.concealment || '',
    action_sequence: mo_fingerprint.action_sequence || '',
    victim_interaction: mo_fingerprint.victim_interaction || '',
    exit_method: mo_fingerprint.exit_method || '',
    group_behavior: mo_fingerprint.group_behavior || '',
    created_at: new Date().toISOString()
  };
  if (isSupabaseLive) await supabase.from('mo_fingerprints').insert([moRecord]);
  localStore.mo_fingerprints.push(moRecord);

  // Save to local persistence store
  saveLocalStore(localStore);

  return {
    caseId,
    personsResolved: resolvedPersonsCount,
    newPersons: newPersonsCount,
    phonesAdded: phonesCount,
    vehiclesAdded: vehiclesCount,
    isSupabaseLive
  };
}
