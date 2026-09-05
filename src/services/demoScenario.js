/**
 * DEMO SCENARIO DATA STORE — NETRA (VAJRA-X21)
 * 
 * Fully isolated, synthetic scenario for Hackathon Demo Mode (SIH 26189).
 * NEVER reads from or writes to production Supabase database.
 * Every record is prefixed 'DEMO-' to guarantee strict isolation.
 * Records include `revealAtStep` to progressive-reveal intelligence across the 9 storyline steps.
 */

export const DEMO_STORAGE_KEY_ACTIVE = 'netra_demo_active';
export const DEMO_STORAGE_KEY_STEP = 'netra_demo_step';

let memoryDemoActive = false;
let memoryDemoStep = 1;

export function isDemoModeActive() {
  if (typeof window === 'undefined' || !window.sessionStorage) return memoryDemoActive;
  try {
    const val = window.sessionStorage.getItem(DEMO_STORAGE_KEY_ACTIVE);
    return val !== null ? val === 'true' : memoryDemoActive;
  } catch {
    return memoryDemoActive;
  }
}

export function getDemoCurrentStep() {
  if (typeof window === 'undefined' || !window.sessionStorage) return memoryDemoStep;
  try {
    const s = parseInt(window.sessionStorage.getItem(DEMO_STORAGE_KEY_STEP) || '1', 10);
    return isNaN(s) || s < 1 ? 1 : Math.min(s, 9);
  } catch {
    return memoryDemoStep;
  }
}

export function setDemoState(active, step = 1) {
  memoryDemoActive = Boolean(active);
  memoryDemoStep = Number(step) || 1;
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    if (active) {
      window.sessionStorage.setItem(DEMO_STORAGE_KEY_ACTIVE, 'true');
      window.sessionStorage.setItem(DEMO_STORAGE_KEY_STEP, String(step));
    } else {
      window.sessionStorage.removeItem(DEMO_STORAGE_KEY_ACTIVE);
      window.sessionStorage.removeItem(DEMO_STORAGE_KEY_STEP);
    }
    // Dispatch a custom window event so all components react immediately
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('netra_demo_state_change', { detail: { active, step } }));
    }
  } catch (e) {
    console.warn('Could not set demo state in sessionStorage:', e);
  }
}

// ============================================================================
// 1. SYNTHETIC DEMO CASES
// ============================================================================
export const DEMO_CASES = [
  {
    id: 'DEMO-CASE-X',
    crime_no: 'CR/2026/COL-8821',
    case_no: 'CASE-DEMO-COLABA-01',
    crime_category: 'Property Crime',
    crime_major_head: 'Organized Vault Heist',
    crime_minor_head: 'Commercial Safe Breaching',
    status: 'Under Investigation',
    registered_date: '2026-08-14',
    incident_from: '2026-08-14T03:15:00Z',
    incident_to: '2026-08-14T04:30:00Z',
    latitude: 18.9067,
    longitude: 72.8147,
    police_station: 'Colaba Police Station',
    brief_facts: 'In the early morning hours of 14-Aug-2026, perpetrators penetrated the subterranean reinforced vault of Imperial Gems & Diamonds on Colaba Causeway. The telemetry alarm system was severed using high-frequency pulse equipment, and the 12-inch tungsten alloy safe was breached with an oxy-acetylene thermal lance. Uncut diamonds and gold bullion worth ₹14.5 Crores were stolen. Initial investigation into on-duty security guard Farhan Qureshi and locksmith assistant Dinesh Rawat yielded no actionable leads. Case appears cold with no immediate local suspects.',
    revealAtStep: 1
  },
  {
    id: 'DEMO-CASE-Y',
    crime_no: 'CR/2026/BND-5102',
    case_no: 'CASE-DEMO-BANDRA-02',
    crime_category: 'Property Crime',
    crime_major_head: 'Luxury Showroom Burglary',
    crime_minor_head: 'Electronic Alarm Bypassing',
    status: 'Under Investigation',
    registered_date: '2026-06-22',
    incident_from: '2026-06-22T02:45:00Z',
    incident_to: '2026-06-22T04:00:00Z',
    latitude: 19.0596,
    longitude: 72.8295,
    police_station: 'Bandra Police Station',
    brief_facts: 'Burglary at Swiss Horology Emporium on Linking Road, Bandra. Alarm optical fiber junction box was bridged with custom telemetry bypass hardware, safe door penetrated via oxy-acetylene torch cutting. 34 luxury chronographs worth ₹4.2 Crores stolen. Dark blue Bajaj Pulsar motorcycle sighted on CCTV leaving scene.',
    revealAtStep: 4
  },
  {
    id: 'DEMO-CASE-Z',
    crime_no: 'CR/2026/ZVR-1934',
    case_no: 'CASE-DEMO-ZAVERI-03',
    crime_category: 'Organized Financial Crime',
    crime_major_head: 'Precious Metals Smuggling & Melting',
    crime_minor_head: 'Illegal Gold Bullion Smelting',
    status: 'Under Investigation',
    registered_date: '2026-07-10',
    incident_from: '2026-07-10T23:30:00Z',
    incident_to: '2026-07-11T05:00:00Z',
    latitude: 18.9500,
    longitude: 72.8310,
    police_station: 'Byculla Police Station',
    brief_facts: 'Raid on clandestine gold smelting facility in Zaveri Bazaar corridor. Un-assayed bullion bars stamped with foreign hallmarks recovered. Smelter operators coordinated through encrypted voice lines tied to burner SIM card (+91 98201 99887).',
    revealAtStep: 4
  }
];

// ============================================================================
// 2. SYNTHETIC DEMO PERSONS
// ============================================================================
export const DEMO_PERSONS = [
  {
    id: 'DEMO-PERSON-1',
    canonical_name: 'Farhan Qureshi',
    aliases: ['Farhan Guard', 'Chacha'],
    dob: '1978-04-12',
    gender: 'Male',
    status_tag: 'Person of Interest',
    confidence_score: 62,
    role: 'Key Suspect',
    photo_url: null,
    revealAtStep: 1,
    details: 'Night security guard on duty at Colaba vault during the breach. Claimed master alarm panel malfunctioned. Polygraph inconclusive.',
    timeline: [
      {
        id: 'EVT-P1-01',
        date: '2026-08-14T05:30:00Z',
        event_time: '2026-08-14T05:30:00Z',
        event_type: 'Incident Response Interrogation',
        description: 'Questioned on scene by Colaba precinct squad. Claimed master alarm panel flashed false alarm code and power cut occurred.',
        location_text: 'Colaba Police Station / Vault Site',
        revealAtStep: 1
      },
      {
        id: 'EVT-P1-02',
        date: '2026-08-16T11:00:00Z',
        event_time: '2026-08-16T11:00:00Z',
        event_type: 'Polygraph Examination',
        description: 'Forensic polygraph examination regarding vault biometric time-lock access and alarm sequence yielded inconclusive baseline variance.',
        location_text: 'State Forensic Science Laboratory, Kalina',
        revealAtStep: 1
      },
      {
        id: 'EVT-P1-03',
        date: '2026-08-19T14:20:00Z',
        event_time: '2026-08-19T14:20:00Z',
        event_type: 'CDR Log Extraction',
        description: 'Guard handset +91 98209 11223 seized for forensic extraction. Device remained silent between 02:00 AM and 05:00 AM heist window.',
        location_text: 'Cyber Crime Cell, Bandra-Kurla Complex',
        revealAtStep: 1
      },
      {
        id: 'EVT-P1-04',
        date: '2026-08-25T16:45:00Z',
        event_time: '2026-08-25T16:45:00Z',
        event_type: 'Cell Tower Telemetry Cross-Match',
        description: 'Telemetry correlation discovers co-location with burner SIM (+91 98201 99887) pinging Colaba tower 12 minutes before the heist.',
        location_text: 'CIU Telemetry Intercept Unit',
        revealAtStep: 4
      },
      {
        id: 'EVT-P1-05',
        date: '2026-09-01T09:15:00Z',
        event_time: '2026-09-01T09:15:00Z',
        event_type: 'Cross-Case Syndicate Alert Flag',
        description: 'Automated Link Prediction flags Farhan as local accomplice receiving instructions from coordinator Vikram Malhotra.',
        location_text: 'CIU Strategic Command Center',
        revealAtStep: 7
      }
    ],
    relationships: [
      {
        id: 'DEMO-REL-1',
        target_id: 'DEMO-CASE-X',
        target_type: 'Case',
        relationship_type: 'ASSIGNED_SECURITY',
        confidence: 95,
        source_evidence: 'Duty Roster Schedule Log #COL-88',
        status: 'observed',
        targetEntity: { id: 'DEMO-CASE-X', canonical_name: 'CR/2026/COL-8821 (Colaba Vault Heist)', type: 'Case', name: 'CR/2026/COL-8821' },
        revealAtStep: 1
      },
      {
        id: 'DEMO-REL-4',
        target_id: 'DEMO-PHONE-2',
        target_type: 'Phone',
        relationship_type: 'REGISTERED_OWNER',
        confidence: 90,
        source_evidence: 'Telecom KYC & Device IMEI Seizure',
        status: 'observed',
        targetEntity: { id: 'DEMO-PHONE-2', canonical_name: 'Guard Handset (+91 98209 11223)', type: 'Phone', name: '+91 98209 11223' },
        revealAtStep: 1
      },
      {
        id: 'REL-P1-P3',
        target_id: 'DEMO-PERSON-3',
        target_type: 'Person',
        relationship_type: 'SUSPECTED_HANDLER_CONTACT',
        confidence: 86,
        source_evidence: 'Proximity cell tower triangulations & indirect relay hops',
        status: 'inferred',
        targetEntity: { id: 'DEMO-PERSON-3', canonical_name: 'Vikram "Vicky" Malhotra', type: 'Person', name: 'Vikram Malhotra' },
        revealAtStep: 4
      },
      {
        id: 'REL-P1-PH1',
        target_id: 'DEMO-PHONE-1',
        target_type: 'Phone',
        relationship_type: 'CO_LOCATED_BURST',
        confidence: 89,
        source_evidence: 'Colaba Causeway Tower Triangulation Log at 03:22 AM',
        status: 'inferred',
        targetEntity: { id: 'DEMO-PHONE-1', canonical_name: 'Burner SIM (+91 98201 99887)', type: 'Phone', name: '+91 98201 99887' },
        revealAtStep: 4
      }
    ],
    linkedCases: [
      {
        id: 'DEMO-CASE-X',
        case_id: 'DEMO-CASE-X',
        crime_no: 'CR/2026/COL-8821',
        crime_major_head: 'Organized Vault Heist',
        police_station: 'Colaba Police Station',
        registered_date: '2026-08-14',
        role_type: 'On-Duty Security Guard',
        role_in_case: 'On-Duty Security Guard',
        revealAtStep: 1
      }
    ],
    linkedPhones: [
      { id: 'DEMO-PHONE-2', number: '+91 98209 11223', label: 'Guard Handset (+91 98209 11223)', type: 'Phone', revealAtStep: 1 }
    ],
    linkedVehicles: [],
    linkedAccounts: []
  },
  {
    id: 'DEMO-PERSON-2',
    canonical_name: 'Dinesh Rawat',
    aliases: ['Dinu Locksmith'],
    dob: '1985-09-20',
    gender: 'Male',
    status_tag: 'Person of Interest',
    confidence_score: 48,
    role: 'Associate',
    photo_url: null,
    revealAtStep: 1,
    details: 'Assistant technician who serviced the vault biometric time-lock 10 days prior to the heist. Denies copying master digital keys.',
    timeline: [
      {
        id: 'EVT-P2-01',
        date: '2026-08-04T15:00:00Z',
        event_time: '2026-08-04T15:00:00Z',
        event_type: 'Vault Maintenance Call',
        description: 'Serviced subterranean time-lock biometric unit at Imperial Gems & Diamonds. Issued invoice #INV-401.',
        location_text: 'Colaba Causeway Vault',
        revealAtStep: 1
      },
      {
        id: 'EVT-P2-02',
        date: '2026-08-15T10:30:00Z',
        event_time: '2026-08-15T10:30:00Z',
        event_type: 'Contractor Verification',
        description: 'Questioned regarding cloned digital key profiles. Maintained hardware was sealed with security tamper tape.',
        location_text: 'Colaba Police Station',
        revealAtStep: 1
      },
      {
        id: 'EVT-P2-03',
        date: '2026-08-18T16:00:00Z',
        event_time: '2026-08-18T16:00:00Z',
        event_type: 'Vehicle & Tool Search',
        description: 'Maruti Omni (MH-02-CZ-4410) tool chest inspected. Contained hydraulic drill bits and bypass schematics.',
        location_text: 'Tardeo RTO Inspection Yard',
        revealAtStep: 1
      },
      {
        id: 'EVT-P2-04',
        date: '2026-08-26T14:00:00Z',
        event_time: '2026-08-26T14:00:00Z',
        event_type: 'Financial Subcontract Link',
        description: 'Bank statement reveals ₹75,000 cash receipt from freelance contractor Vikram Malhotra for lock cylinder parts.',
        location_text: 'Financial Intelligence Unit, Fort',
        revealAtStep: 4
      }
    ],
    relationships: [
      {
        id: 'DEMO-REL-2',
        target_id: 'DEMO-CASE-X',
        target_type: 'Case',
        relationship_type: 'LOCKSMITH_CONTRACTOR',
        confidence: 85,
        source_evidence: 'Service Invoice #INV-401',
        status: 'observed',
        targetEntity: { id: 'DEMO-CASE-X', canonical_name: 'CR/2026/COL-8821 (Colaba Vault Heist)', type: 'Case', name: 'CR/2026/COL-8821' },
        revealAtStep: 1
      },
      {
        id: 'DEMO-REL-5',
        target_id: 'DEMO-VEHICLE-2',
        target_type: 'Vehicle',
        relationship_type: 'REGISTERED_OWNER',
        confidence: 90,
        source_evidence: 'Vahan Portal Match',
        status: 'observed',
        targetEntity: { id: 'DEMO-VEHICLE-2', canonical_name: 'Service Van (MH-02-CZ-4410)', type: 'Vehicle', name: 'MH-02-CZ-4410' },
        revealAtStep: 1
      },
      {
        id: 'REL-P2-P3',
        target_id: 'DEMO-PERSON-3',
        target_type: 'Person',
        relationship_type: 'PARTS_SUPPLIER_LINK',
        confidence: 82,
        source_evidence: 'Hardware cylinder procurement invoice & financial transfer',
        status: 'observed',
        targetEntity: { id: 'DEMO-PERSON-3', canonical_name: 'Vikram "Vicky" Malhotra', type: 'Person', name: 'Vikram Malhotra' },
        revealAtStep: 4
      }
    ],
    linkedCases: [
      {
        id: 'DEMO-CASE-X',
        case_id: 'DEMO-CASE-X',
        crime_no: 'CR/2026/COL-8821',
        crime_major_head: 'Organized Vault Heist',
        police_station: 'Colaba Police Station',
        registered_date: '2026-08-14',
        role_type: 'Locksmith Contractor',
        role_in_case: 'Locksmith Contractor',
        revealAtStep: 1
      }
    ],
    linkedPhones: [],
    linkedVehicles: [
      { id: 'DEMO-VEHICLE-2', registration: 'MH-02-CZ-4410', label: 'Service Van (MH-02-CZ-4410)', type: 'Vehicle', revealAtStep: 1 }
    ],
    linkedAccounts: []
  },
  {
    id: 'DEMO-PERSON-3',
    canonical_name: 'Vikram "Vicky" Malhotra',
    aliases: ['Vicky Keyman', 'The Technician', 'Malhotra Saab'],
    dob: '1982-11-03',
    gender: 'Male',
    status_tag: 'Key Suspect',
    confidence_score: 96,
    role: 'Accused',
    photo_url: null,
    revealAtStep: 1, // Appears as peripheral contractor in Case X initially, then revealed as mastermind
    details: 'Freelance electronic security contractor and safe specialist. Registered owner of burner phone +91 98201 99887 and Bajaj Pulsar MH-01-EA-9912. Bridge suspect connecting Colaba, Bandra, and Zaveri Bazaar syndicates.',
    timeline: [
      {
        id: 'EVT-P3-01',
        date: '2026-08-14T03:20:00Z',
        event_time: '2026-08-14T03:20:00Z',
        event_type: 'Peripheral Vendor Mention',
        description: 'Appears as subcontractor on secondary lock hardware receipt for Colaba vault. Initially categorized as peripheral vendor.',
        location_text: 'Colaba Police Station Record',
        revealAtStep: 1
      },
      {
        id: 'EVT-P3-02',
        date: '2026-08-22T03:00:00Z',
        event_time: '2026-08-22T03:00:00Z',
        event_type: 'Burner SIM & ANPR Triangulation',
        description: 'Burner SIM (+91 98201 99887) and Navy Blue Bajaj Pulsar (MH-01-EA-9912) registered to Vikram matched across Colaba and Bandra scenes.',
        location_text: 'Bandra-Worli Sea Link & Marine Drive',
        revealAtStep: 4
      },
      {
        id: 'EVT-P3-03',
        date: '2026-08-25T18:30:00Z',
        event_time: '2026-08-25T18:30:00Z',
        event_type: 'Encrypted Wiretap Intercept',
        description: '14 intercepted voice communications with illegal smelter Asif Khan coordinating delivery of uncut diamonds and gold bars.',
        location_text: 'Zaveri Bazaar Corridor Intercept',
        revealAtStep: 4
      },
      {
        id: 'EVT-P3-04',
        date: '2026-08-29T11:00:00Z',
        event_time: '2026-08-29T11:00:00Z',
        event_type: 'Cross-Case Link Prediction Flag',
        description: 'AI Priority Model computes 96.8 / 100 priority score and 0.94 graph centrality, flagging Vikram as a key bridging entity requiring verification.',
        location_text: 'CIU Strategic Command Center',
        revealAtStep: 7
      },
      {
        id: 'EVT-P3-05',
        date: '2026-09-02T17:00:00Z',
        event_time: '2026-09-02T17:00:00Z',
        event_type: 'Non-Bailable Warrant Issued',
        description: 'Special Court issues Non-Bailable Warrant under MCOCA provisions for orchestrated safe penetration across Mumbai.',
        location_text: 'City Sessions Court, Mumbai',
        revealAtStep: 8
      }
    ],
    relationships: [
      {
        id: 'DEMO-REL-3',
        target_id: 'DEMO-CASE-X',
        target_type: 'Case',
        relationship_type: 'PARTS_SUPPLIER',
        confidence: 60,
        source_evidence: 'Lock Cylinder Supply Receipt',
        status: 'observed',
        targetEntity: { id: 'DEMO-CASE-X', canonical_name: 'CR/2026/COL-8821 (Colaba Vault Heist)', type: 'Case', name: 'CR/2026/COL-8821' },
        revealAtStep: 1
      },
      {
        id: 'DEMO-REL-6',
        target_id: 'DEMO-PHONE-1',
        target_type: 'Phone',
        relationship_type: 'PRIMARY_SUBSCRIBER',
        confidence: 98,
        source_evidence: 'Burner SIM IMEI & KYC Tower Data',
        status: 'observed',
        targetEntity: { id: 'DEMO-PHONE-1', canonical_name: 'Burner SIM (+91 98201 99887)', type: 'Phone', name: '+91 98201 99887' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-7',
        target_id: 'DEMO-VEHICLE-1',
        target_type: 'Vehicle',
        relationship_type: 'REGISTERED_OWNER',
        confidence: 95,
        source_evidence: 'CCTV ANPR Cross-Reference',
        status: 'observed',
        targetEntity: { id: 'DEMO-VEHICLE-1', canonical_name: 'Bajaj Pulsar (MH-01-EA-9912)', type: 'Vehicle', name: 'MH-01-EA-9912' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-10',
        target_id: 'DEMO-PERSON-4',
        target_type: 'Person',
        relationship_type: 'FENCING_COORDINATOR',
        confidence: 96,
        source_evidence: '14 Encrypted Voice Calls on Burner SIM',
        status: 'observed',
        targetEntity: { id: 'DEMO-PERSON-4', canonical_name: 'Asif "Gadari" Khan', type: 'Person', name: 'Asif Khan' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-13',
        target_id: 'DEMO-PERSON-5',
        target_type: 'Person',
        relationship_type: 'OPERATIONAL_HANDLER',
        confidence: 88,
        source_evidence: 'Call Sequence & Shared Getaway Vehicle',
        status: 'observed',
        targetEntity: { id: 'DEMO-PERSON-5', canonical_name: 'Rohan Mehta', type: 'Person', name: 'Rohan Mehta' },
        revealAtStep: 4
      },
      {
        id: 'REL-P3-CY',
        target_id: 'DEMO-CASE-Y',
        target_type: 'Case',
        relationship_type: 'SAFE_BREACHING_COORDINATOR',
        confidence: 94,
        source_evidence: 'Identical oxy-acetylene torch cut marks and telemetry bypass',
        status: 'inferred',
        targetEntity: { id: 'DEMO-CASE-Y', canonical_name: 'CR/2026/BND-5102 (Bandra Showroom)', type: 'Case', name: 'CR/2026/BND-5102' },
        revealAtStep: 4
      },
      {
        id: 'REL-P3-CZ',
        target_id: 'DEMO-CASE-Z',
        target_type: 'Case',
        relationship_type: 'SMUGGLING_CONTROLLER',
        confidence: 92,
        source_evidence: 'Smelter raid inventory matches melted gold serials',
        status: 'inferred',
        targetEntity: { id: 'DEMO-CASE-Z', canonical_name: 'CR/2026/ZVR-1934 (Zaveri Smelter)', type: 'Case', name: 'CR/2026/ZVR-1934' },
        revealAtStep: 4
      }
    ],
    linkedCases: [
      {
        id: 'DEMO-CASE-X',
        case_id: 'DEMO-CASE-X',
        crime_no: 'CR/2026/COL-8821',
        crime_major_head: 'Organized Vault Heist',
        police_station: 'Colaba Police Station',
        registered_date: '2026-08-14',
        role_type: 'Key Person of Interest / Bridging Node',
        role_in_case: 'Key Person of Interest / Bridging Node',
        revealAtStep: 1
      },
      {
        id: 'DEMO-CASE-Y',
        case_id: 'DEMO-CASE-Y',
        crime_no: 'CR/2026/BND-5102',
        crime_major_head: 'Luxury Showroom Burglary',
        police_station: 'Bandra Police Station',
        registered_date: '2026-06-22',
        role_type: 'Safe Breaching Coordinator',
        role_in_case: 'Safe Breaching Coordinator',
        revealAtStep: 4
      },
      {
        id: 'DEMO-CASE-Z',
        case_id: 'DEMO-CASE-Z',
        crime_no: 'CR/2026/ZVR-1934',
        crime_major_head: 'Precious Metals Smuggling & Melting',
        police_station: 'Byculla Police Station',
        registered_date: '2026-07-10',
        role_type: 'Smuggling Syndicate Controller',
        role_in_case: 'Smuggling Syndicate Controller',
        revealAtStep: 4
      }
    ],
    linkedPhones: [
      { id: 'DEMO-PHONE-1', number: '+91 98201 99887', label: 'Burner SIM (+91 98201 99887)', type: 'Phone', revealAtStep: 4 }
    ],
    linkedVehicles: [
      { id: 'DEMO-VEHICLE-1', registration: 'MH-01-EA-9912', label: 'Bajaj Pulsar (MH-01-EA-9912)', type: 'Vehicle', revealAtStep: 4 }
    ],
    linkedAccounts: [
      { id: 'DEMO-ACC-1', account_number: 'HDFC-MULE-88019', label: 'HDFC Mule Account (..8019)', type: 'Account', bank_name: 'HDFC Bank', revealAtStep: 4 }
    ]
  },
  {
    id: 'DEMO-PERSON-4',
    canonical_name: 'Asif "Gadari" Khan',
    aliases: ['Gadari', 'Asif Smelter'],
    dob: '1974-02-18',
    gender: 'Male',
    status_tag: 'Accused',
    confidence_score: 88,
    role: 'Co-conspirator',
    photo_url: null,
    revealAtStep: 4,
    details: 'Illegal gold melter operating in Zaveri Bazaar. Received raw precious metals from Vikram Malhotra within 3 hours of vault breaches.',
    timeline: [
      {
        id: 'EVT-P4-01',
        date: '2026-07-11T05:30:00Z',
        event_time: '2026-07-11T05:30:00Z',
        event_type: 'Smelter Facility Raid',
        description: 'Byculla police raided basement smelting den in Zaveri Bazaar corridor. Seized un-assayed bullion with foreign hallmarks.',
        location_text: 'Zaveri Bazaar Corridor, Byculla',
        revealAtStep: 4
      },
      {
        id: 'EVT-P4-02',
        date: '2026-07-12T12:00:00Z',
        event_time: '2026-07-12T12:00:00Z',
        event_type: 'Mule Account Freezing',
        description: 'HDFC Mule Account #88019 frozen following ₹25 Lakhs cash deposit traced to illegal smelting proceeds.',
        location_text: 'HDFC Bank, Fort Branch',
        revealAtStep: 4
      },
      {
        id: 'EVT-P4-03',
        date: '2026-08-24T21:00:00Z',
        event_time: '2026-08-24T21:00:00Z',
        event_type: 'Wiretap Call Intercept',
        description: 'Intercepted call with Vikram Malhotra confirming arrival of diamond parcel from Colaba heist.',
        location_text: 'CIU Telemetry Intercept Unit',
        revealAtStep: 4
      },
      {
        id: 'EVT-P4-04',
        date: '2026-08-30T14:00:00Z',
        event_time: '2026-08-30T14:00:00Z',
        event_type: 'Forensic Assay Cross-Match',
        description: 'Metallurgical assay matches melted bullion in Case Z with safe cutting slag from Case X and Case Y.',
        location_text: 'State Forensic Laboratory, Kalina',
        revealAtStep: 7
      }
    ],
    relationships: [
      {
        id: 'DEMO-REL-14',
        target_id: 'DEMO-CASE-Z',
        target_type: 'Case',
        relationship_type: 'SMELTER_CUSTODIAN',
        confidence: 97,
        source_evidence: 'Raid Seizure Memo #ZVR-89',
        status: 'observed',
        targetEntity: { id: 'DEMO-CASE-Z', canonical_name: 'CR/2026/ZVR-1934 (Zaveri Smelter)', type: 'Case', name: 'CR/2026/ZVR-1934' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-15',
        target_id: 'DEMO-ACC-1',
        target_type: 'Account',
        relationship_type: 'BENEFICIARY_HOLDER',
        confidence: 99,
        source_evidence: 'Bank KYC & Transaction Audit',
        status: 'observed',
        targetEntity: { id: 'DEMO-ACC-1', canonical_name: 'Mule Account (HDFC-88019)', type: 'Account', name: 'HDFC-88019' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-10',
        target_id: 'DEMO-PERSON-3',
        target_type: 'Person',
        relationship_type: 'SYNDICATE_CO_CONSPIRATOR',
        confidence: 96,
        source_evidence: '14 Encrypted Calls on Burner Line',
        status: 'observed',
        targetEntity: { id: 'DEMO-PERSON-3', canonical_name: 'Vikram "Vicky" Malhotra', type: 'Person', name: 'Vikram Malhotra' },
        revealAtStep: 4
      }
    ],
    linkedCases: [
      {
        id: 'DEMO-CASE-Z',
        case_id: 'DEMO-CASE-Z',
        crime_no: 'CR/2026/ZVR-1934',
        crime_major_head: 'Precious Metals Smuggling & Melting',
        police_station: 'Byculla Police Station',
        registered_date: '2026-07-10',
        role_type: 'Smelter Site Custodian',
        role_in_case: 'Smelter Site Custodian',
        revealAtStep: 4
      },
      {
        id: 'DEMO-CASE-X',
        case_id: 'DEMO-CASE-X',
        crime_no: 'CR/2026/COL-8821',
        crime_major_head: 'Organized Vault Heist',
        police_station: 'Colaba Police Station',
        registered_date: '2026-08-14',
        role_type: 'Stolen Bullion Receiver',
        role_in_case: 'Stolen Bullion Receiver',
        revealAtStep: 4
      }
    ],
    linkedPhones: [],
    linkedVehicles: [],
    linkedAccounts: [
      { id: 'DEMO-ACC-1', account_number: 'HDFC-MULE-88019', label: 'Mule Account (HDFC-88019)', type: 'Account', revealAtStep: 4 }
    ]
  },
  {
    id: 'DEMO-PERSON-5',
    canonical_name: 'Rohan Mehta',
    aliases: ['Rony', 'Speedy'],
    dob: '1993-07-14',
    gender: 'Male',
    status_tag: 'Accused',
    confidence_score: 82,
    role: 'Lookout',
    photo_url: null,
    revealAtStep: 4,
    details: 'Getaway driver and lookout. Sighted operating Bajaj Pulsar MH-01-EA-9912 near Swiss Horology Emporium in Bandra.',
    timeline: [
      {
        id: 'EVT-P5-01',
        date: '2026-06-22T04:15:00Z',
        event_time: '2026-06-22T04:15:00Z',
        event_type: 'CCTV Sighting (Case Y)',
        description: 'Sighted on CCTV operating Navy Blue Bajaj Pulsar 220 near Swiss Horology Emporium on Linking Road during burglary.',
        location_text: 'Linking Road, Bandra West',
        revealAtStep: 4
      },
      {
        id: 'EVT-P5-02',
        date: '2026-08-14T04:32:00Z',
        event_time: '2026-08-14T04:32:00Z',
        event_type: 'ANPR Traffic Mesh Hit (Case X)',
        description: 'Captured on traffic surveillance camera #CP-402 fleeing Colaba Causeway alley via Marine Drive corridor at high speed.',
        location_text: 'Marine Drive Junction, Colaba',
        revealAtStep: 4
      },
      {
        id: 'EVT-P5-03',
        date: '2026-08-27T10:00:00Z',
        event_time: '2026-08-27T10:00:00Z',
        event_type: 'Operational Handler Link',
        description: 'Call frequency analysis establishes Rohan as field driver executing tactical getaways under Vikram Malhotra dispatch.',
        location_text: 'Bandra Police Station',
        revealAtStep: 4
      }
    ],
    relationships: [
      {
        id: 'DEMO-REL-13',
        target_id: 'DEMO-PERSON-3',
        target_type: 'Person',
        relationship_type: 'DISPATCH_OPERATIVE',
        confidence: 88,
        source_evidence: 'Call Sequence & Shared Vehicle',
        status: 'observed',
        targetEntity: { id: 'DEMO-PERSON-3', canonical_name: 'Vikram "Vicky" Malhotra', type: 'Person', name: 'Vikram Malhotra' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-12',
        target_id: 'DEMO-CASE-Y',
        target_type: 'Case',
        relationship_type: 'GETAWAY_DRIVER',
        confidence: 93,
        source_evidence: 'Bandra West CCTV Mesh #BND-12',
        status: 'observed',
        targetEntity: { id: 'DEMO-CASE-Y', canonical_name: 'CR/2026/BND-5102 (Bandra Showroom)', type: 'Case', name: 'CR/2026/BND-5102' },
        revealAtStep: 4
      },
      {
        id: 'DEMO-REL-11',
        target_id: 'DEMO-VEHICLE-1',
        target_type: 'Vehicle',
        relationship_type: 'OPERATOR_SIGHTING',
        confidence: 91,
        source_evidence: 'Traffic Police Camera #CP-402',
        status: 'observed',
        targetEntity: { id: 'DEMO-VEHICLE-1', canonical_name: 'Bajaj Pulsar (MH-01-EA-9912)', type: 'Vehicle', name: 'MH-01-EA-9912' },
        revealAtStep: 4
      }
    ],
    linkedCases: [
      {
        id: 'DEMO-CASE-Y',
        case_id: 'DEMO-CASE-Y',
        crime_no: 'CR/2026/BND-5102',
        crime_major_head: 'Luxury Showroom Burglary',
        police_station: 'Bandra Police Station',
        registered_date: '2026-06-22',
        role_type: 'Getaway Driver & Transport',
        role_in_case: 'Getaway Driver & Transport',
        revealAtStep: 4
      },
      {
        id: 'DEMO-CASE-X',
        case_id: 'DEMO-CASE-X',
        crime_no: 'CR/2026/COL-8821',
        crime_major_head: 'Organized Vault Heist',
        police_station: 'Colaba Police Station',
        registered_date: '2026-08-14',
        role_type: 'Lookout & Getaway Driver',
        role_in_case: 'Lookout & Getaway Driver',
        revealAtStep: 4
      }
    ],
    linkedPhones: [],
    linkedVehicles: [
      { id: 'DEMO-VEHICLE-1', registration: 'MH-01-EA-9912', label: 'Bajaj Pulsar (MH-01-EA-9912)', type: 'Vehicle', revealAtStep: 4 }
    ],
    linkedAccounts: []
  }
];

// ============================================================================
// 3. SYNTHETIC DEMO ASSETS (Phones, Vehicles, Accounts, Locations)
// ============================================================================
export const DEMO_ASSETS = {
  phones: [
    {
      id: 'DEMO-PHONE-1',
      number: '+91 98201 99887',
      owner_person_id: 'DEMO-PERSON-3',
      label: 'Burner SIM (+91 98201 99887)',
      type: 'Phone',
      revealAtStep: 4,
      details: 'Prepaid burner SIM activated under fake Aadhaar. Pinged Colaba cell tower at 03:22 AM, Bandra tower at 02:50 AM, and communicated with Zaveri smelter.'
    },
    {
      id: 'DEMO-PHONE-2',
      number: '+91 98209 11223',
      owner_person_id: 'DEMO-PERSON-1',
      label: 'Guard Handset (+91 98209 11223)',
      type: 'Phone',
      revealAtStep: 1,
      details: 'Personal handset of guard Farhan Qureshi. Inactive between 02:00 AM and 05:00 AM on heist night.'
    }
  ],
  vehicles: [
    {
      id: 'DEMO-VEHICLE-1',
      registration: 'MH-01-EA-9912',
      make_model: 'Bajaj Pulsar 220 (Navy Blue)',
      owner_person_id: 'DEMO-PERSON-3',
      label: 'Bajaj Pulsar (MH-01-EA-9912)',
      type: 'Vehicle',
      revealAtStep: 4,
      details: 'Blue motorcycle captured on CCTV exiting Colaba Causeway alley at 04:32 AM and previously recorded near Bandra burglary scene.'
    },
    {
      id: 'DEMO-VEHICLE-2',
      registration: 'MH-02-CZ-4410',
      make_model: 'Maruti Omni (White)',
      owner_person_id: 'DEMO-PERSON-2',
      label: 'Service Van (MH-02-CZ-4410)',
      type: 'Vehicle',
      revealAtStep: 1,
      details: 'Locksmith maintenance van parked near Colaba during prior maintenance.'
    }
  ],
  accounts: [
    {
      id: 'DEMO-ACC-1',
      account_number: 'HDFC-MULE-88019',
      owner_person_id: 'DEMO-PERSON-4',
      label: 'Mule Account (HDFC-88019)',
      type: 'Account',
      revealAtStep: 4,
      details: 'Beneficiary account that received ₹25 Lakhs cash deposit 48 hours post-Colaba heist.'
    }
  ],
  locations: [
    {
      id: 'DEMO-LOC-1',
      name: 'Imperial Gems Vault (Colaba)',
      latitude: 18.9067,
      longitude: 72.8147,
      type: 'Location',
      revealAtStep: 1
    },
    {
      id: 'DEMO-LOC-2',
      name: 'Swiss Horology (Bandra)',
      latitude: 19.0596,
      longitude: 72.8295,
      type: 'Location',
      revealAtStep: 4
    },
    {
      id: 'DEMO-LOC-3',
      name: 'Zaveri Bazaar Smelting Den',
      latitude: 18.9500,
      longitude: 72.8310,
      type: 'Location',
      revealAtStep: 4
    }
  ]
};

// ============================================================================
// 4. SYNTHETIC DEMO RELATIONSHIPS (Graph Edges)
// ============================================================================
export const DEMO_RELATIONSHIPS = [
  // --- Case X Internal Initial Links (Step 1-3) ---
  {
    id: 'DEMO-REL-1',
    source_id: 'DEMO-PERSON-1',
    target_id: 'DEMO-CASE-X',
    relationship_type: 'Assigned Security',
    confidence: 95,
    source_evidence: 'Roster Schedule Log #COL-88',
    status: 'observed',
    revealAtStep: 1
  },
  {
    id: 'DEMO-REL-2',
    source_id: 'DEMO-PERSON-2',
    target_id: 'DEMO-CASE-X',
    relationship_type: 'Locksmith Contractor',
    confidence: 85,
    source_evidence: 'Service Invoice #INV-401',
    status: 'observed',
    revealAtStep: 1
  },
  {
    id: 'DEMO-REL-3',
    source_id: 'DEMO-PERSON-3',
    target_id: 'DEMO-CASE-X',
    relationship_type: 'Subcontractor / Parts Supplier',
    confidence: 60,
    source_evidence: 'Lock Cylinder Supply Receipt',
    status: 'observed',
    revealAtStep: 1
  },
  {
    id: 'DEMO-REL-4',
    source_id: 'DEMO-PERSON-1',
    target_id: 'DEMO-PHONE-2',
    relationship_type: 'Registered Owner',
    confidence: 90,
    source_evidence: 'Telecom KYC',
    status: 'observed',
    revealAtStep: 1
  },
  {
    id: 'DEMO-REL-5',
    source_id: 'DEMO-PERSON-2',
    target_id: 'DEMO-VEHICLE-2',
    relationship_type: 'Registered Owner',
    confidence: 90,
    source_evidence: 'Vahan Portal Match',
    status: 'observed',
    revealAtStep: 1
  },

  // --- Cross-Case Bridges Discovered at Step 4+ ---
  {
    id: 'DEMO-REL-6',
    source_id: 'DEMO-PERSON-3',
    target_id: 'DEMO-PHONE-1',
    relationship_type: 'Primary Subscriber',
    confidence: 98,
    source_evidence: 'Burner SIM IMEI & KYC Tower Data',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-7',
    source_id: 'DEMO-PERSON-3',
    target_id: 'DEMO-VEHICLE-1',
    relationship_type: 'Registered Vehicle Owner',
    confidence: 95,
    source_evidence: 'CCTV ANPR Cross-Reference',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-8',
    source_id: 'DEMO-PHONE-1',
    target_id: 'DEMO-CASE-X',
    relationship_type: 'Cell Tower Ping (03:22 AM)',
    confidence: 94,
    source_evidence: 'Colaba Causeway Tower Triangulation',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-9',
    source_id: 'DEMO-PHONE-1',
    target_id: 'DEMO-CASE-Y',
    relationship_type: 'Cell Tower Ping (02:50 AM)',
    confidence: 92,
    source_evidence: 'Bandra Linking Rd Tower Log',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-10',
    source_id: 'DEMO-PHONE-1',
    target_id: 'DEMO-PERSON-4',
    relationship_type: 'Encrypted Voice Exchange (14 Calls)',
    confidence: 96,
    source_evidence: 'CDR Intercept Log #ZVR-89',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-11',
    source_id: 'DEMO-VEHICLE-1',
    target_id: 'DEMO-CASE-X',
    relationship_type: 'Getaway Transport Sighting',
    confidence: 91,
    source_evidence: 'Traffic Police Camera #CP-402',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-12',
    source_id: 'DEMO-VEHICLE-1',
    target_id: 'DEMO-CASE-Y',
    relationship_type: 'Getaway Transport Sighting',
    confidence: 93,
    source_evidence: 'Bandra West CCTV Mesh #BND-12',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-13',
    source_id: 'DEMO-PERSON-3',
    target_id: 'DEMO-PERSON-5',
    relationship_type: 'Operational Handler',
    confidence: 88,
    source_evidence: 'Call Sequence & Shared Vehicle',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-14',
    source_id: 'DEMO-PERSON-4',
    target_id: 'DEMO-CASE-Z',
    relationship_type: 'Smelter Site Custodian',
    confidence: 97,
    source_evidence: 'Raid Seizure Memo',
    status: 'observed',
    revealAtStep: 4
  },
  {
    id: 'DEMO-REL-15',
    source_id: 'DEMO-PERSON-4',
    target_id: 'DEMO-ACC-1',
    relationship_type: 'Beneficiary Account Holder',
    confidence: 99,
    source_evidence: 'Bank KYC & Transaction Audit',
    status: 'observed',
    revealAtStep: 4
  }
];

// ============================================================================
// 5. SYNTHETIC DEMO MODUS OPERANDI (MO) FINGERPRINTS & SIMILARITIES
// ============================================================================
export const DEMO_MO_FINGERPRINTS = [
  {
    case_id: 'DEMO-CASE-X',
    target: 'Subterranean Commercial Diamond Vault',
    timing: 'Sunday Early Morning (03:15 AM - 04:30 AM)',
    entry_method: 'Roof duct entrance + high-voltage telemetry alarm pulse bypass',
    tools: 'Oxy-acetylene thermal lance torch + diamond core drill bit',
    transport: 'Navy Blue sports motorcycle with obscured plates',
    concealment: 'Black tactical overalls + ceramic balaclavas + cellular jammer',
    action_sequence: '1. Neutralize telemetry junction -> 2. Penetrate 12-inch tungsten door -> 3. Selective grab of uncut diamonds -> 4. Southbound sea route egress',
    victim_interaction: 'No direct contact (unattended overnight vault)',
    exit_method: 'Rapid motorcycle transit along Marine Drive corridor',
    group_behavior: 'Highly disciplined 3-man specialist cell (Bypasser, Cutter, Carrier)',
    revealAtStep: 1
  },
  {
    case_id: 'DEMO-CASE-Y',
    target: 'High-End Luxury Watch Showroom Vault',
    timing: 'Sunday Early Morning (02:45 AM - 04:00 AM)',
    entry_method: 'Rear exhaust vent + electronic optical alarm loop bypass',
    tools: 'Oxy-acetylene torch + heavy hydraulic spreader',
    transport: 'Navy Blue sports motorcycle',
    concealment: 'Dark balaclavas + RF signal blocker',
    action_sequence: '1. Bridge optical fiber sensor -> 2. Cut safe hinges -> 3. Evacuate high-value chronographs -> 4. Sea Link egress route',
    victim_interaction: 'No direct contact (night burglary)',
    exit_method: 'Bandra-Worli Sea Link corridor getaway',
    group_behavior: 'Specialized 2-man technician unit',
    revealAtStep: 4
  },
  {
    case_id: 'DEMO-CASE-Z',
    target: 'Clandestine Precious Metals Smelting Facility',
    timing: 'Overnight Processing (23:30 PM - 05:00 AM)',
    entry_method: 'Coordinated drop via encrypted burner SIM instructions',
    tools: 'Induction smelting furnace + graphite bullion crucibles',
    transport: 'Covert local transport courier',
    concealment: 'Industrial soundproofed basement unit',
    action_sequence: '1. Ingest stolen raw gems/gold -> 2. Melt down identifying hallmarks -> 3. Convert to untraceable 1kg dore bars',
    victim_interaction: 'Commercial black-market fence network',
    exit_method: 'Interstate courier pipeline',
    group_behavior: 'Financial laundering and smelting cell',
    revealAtStep: 4
  }
];

export const DEMO_MO_SIMILARITIES = [
  {
    case_id_a: 'DEMO-CASE-X',
    case_id_b: 'DEMO-CASE-Y',
    similarity_score: 94.2,
    matching_components: [
      'Identical oxy-acetylene torch penetration signature on safe steel',
      'Specialized optical telemetry alarm bridge tool used in both breaches',
      'Sunday 02:45 - 04:30 AM operational time window',
      'Navy Blue Bajaj Pulsar 220 motorcycle getaway vehicle signature'
    ],
    revealAtStep: 5
  },
  {
    case_id_a: 'DEMO-CASE-X',
    case_id_b: 'DEMO-CASE-Z',
    similarity_score: 89.5,
    matching_components: [
      'Matching metallurgical composition of stolen bullion vs Zaveri melt residue',
      'Shared burner SIM +91 98201 99887 communication within 120 mins of Colaba breach',
      'High-value precious metals target profile'
    ],
    revealAtStep: 5
  },
  {
    case_id_a: 'DEMO-CASE-Y',
    case_id_b: 'DEMO-CASE-Z',
    similarity_score: 86.8,
    matching_components: [
      'Fence transaction timeline matches Bandra watch casing disposal',
      'Shared communication hub linking Vikram Malhotra to smelter Asif Khan'
    ],
    revealAtStep: 5
  }
];

// ============================================================================
// 6. SYNTHETIC DEMO ALERTS & FINDINGS
// ============================================================================
export const DEMO_ALERTS = [
  {
    id: 'DEMO-ALERT-1',
    title: 'High-Value Vault Breach (Initial Intake)',
    severity: 'High',
    status: 'New',
    description: 'Colaba vault heist registered with zero immediate suspects. On-duty guard Farhan Qureshi and technician Dinesh Rawat placed under initial inquiry.',
    target_id: 'DEMO-CASE-X',
    confidence: 65,
    created_at: '2026-08-14T06:00:00Z',
    revealAtStep: 1
  },
  {
    id: 'DEMO-ALERT-CROSS-CASE',
    title: '🚨 Potential Cross-Case Pattern Flagged for Review',
    severity: 'High',
    status: 'New',
    description: 'AI Multi-Case Linker detected that Case X (Colaba Diamond Vault Heist) shares identical burner SIM (+91 98201 99887), getaway motorcycle (MH-01-EA-9912), and safe-cutting MO pattern with Case Y (Bandra Showroom) and Case Z (Zaveri Smelter). Person of interest Vikram Malhotra flagged as high-centrality bridging entity across all 3 FIRs — unverified investigative lead.',
    target_id: 'DEMO-PERSON-3',
    confidence: 96,
    created_at: '2026-08-15T09:30:00Z',
    evidence_chain: [
      'Burner Phone +91 98201 99887 active at Colaba (03:22 AM) and Bandra (02:50 AM)',
      'Motorcycle MH-01-EA-9912 registered to Vikram Malhotra sighted at both crime scenes',
      'Oxy-acetylene safe penetration tool signature matches 94.2% with Bandra FIR',
      '14 encrypted voice calls logged between Vikram Malhotra and Zaveri smelter Asif Khan'
    ],
    revealAtStep: 7
  }
];

// ============================================================================
// 7. SCRIPTED STORYLINE STEP DEFINITIONS (1 to 9)
// ============================================================================
export const DEMO_STEPS = [
  {
    step: 1,
    title: 'Initial Case Intake (Dead End)',
    route: '/cases?id=DEMO-CASE-X',
    pageName: 'Case Search / Details',
    headline: 'Case X: Colaba Diamond Vault Heist — Isolated FIR & Dead End',
    instructions: 'Examine Case X details and initial suspects. Notice that Farhan Qureshi and Dinesh Rawat appear to be isolated suspects with no clear evidence or external leads.',
    hint: 'Click "Next Step" to run AI Suspect Priority Ranking on Case X.',
    actionLabel: 'Proceed to Suspect Ranking'
  },
  {
    step: 2,
    title: 'Local Suspect Priority Ranking',
    route: '/canvas?id=DEMO-CASE-X',
    pageName: 'Investigation Canvas',
    headline: 'Rank Suspects: Inconclusive Local Scores',
    instructions: 'AI Priority Model ranks Farhan Qureshi (~62 pts) and Dinesh Rawat (~48 pts). The reasoning reflects only Case X\'s own local parameters — no breakthrough leads exist yet.',
    hint: 'Click "Next Step" to inspect the Knowledge Graph for Case X.',
    actionLabel: 'Open Knowledge Graph'
  },
  {
    step: 3,
    title: 'Isolated Knowledge Graph',
    route: '/graph?case_id=DEMO-CASE-X',
    pageName: 'Knowledge Graph',
    headline: 'Case X Graph: Self-Contained Local Network',
    instructions: 'Observe the Knowledge Graph for Case X. It contains only 5 local nodes (Farhan, Dinesh, Guard Handset, Service Van, and Vikram as a minor contractor). The network looks completely isolated.',
    hint: 'Click "Next Step" to trigger Cross-Case Link Discovery and uncover hidden connections.',
    actionLabel: 'Run Cross-Case Link Analysis'
  },
  {
    step: 4,
    title: 'Hidden Cross-Case Link Discovery',
    route: '/graph?case_id=DEMO-CASE-X',
    pageName: 'Knowledge Graph',
    headline: 'Breakthrough: Cross-Case Network Revealed (Cases X, Y, Z)',
    instructions: 'NETRA discovers hidden links! Burner SIM +91 98201 99887 and Bajaj Pulsar MH-01-EA-9912 bridge Case X with Case Y (Bandra Showroom Burglary) and Case Z (Zaveri Gold Smelter).',
    hint: 'Click "Next Step" to verify the Modus Operandi (MO) Similarity Matrix.',
    actionLabel: 'Inspect MO Similarity Matrix'
  },
  {
    step: 5,
    title: 'Modus Operandi (MO) Pattern Matching',
    route: '/mo-similarity?id=DEMO-CASE-X',
    pageName: 'MO Similarity',
    headline: '94.2% MO Match Between Colaba and Bandra Vault Breaches',
    instructions: 'Review the MO Similarity Matrix. Despite completely different FIR descriptions, Case X and Case Y score 94.2% similarity (oxy-acetylene thermal lance, telemetry bypass, Sunday 3 AM window).',
    hint: 'Click "Next Step" to examine the multi-case spatial distribution on the Command Center Map.',
    actionLabel: 'View Geospatial Crime Corridor'
  },
  {
    step: 6,
    title: 'Geospatial Transit Corridor',
    route: '/dashboard',
    pageName: 'Command Center',
    headline: 'Spatial Evidence: South & West Mumbai Transit Route',
    instructions: 'The Command Center map plots all three connected cases (Colaba Vault -> Bandra Showroom -> Zaveri Smelter), revealing the criminal corridor and getaway trajectory.',
    hint: 'Click "Next Step" to review high-priority AI Intelligence Alerts.',
    actionLabel: 'Review Intelligence Alerts'
  },
  {
    step: 7,
    title: 'Cross-Case Link Alert',
    route: '/alerts',
    pageName: 'Alerts & Findings',
    headline: '🚨 AI Intelligence Alert: Potential Cross-Case Pattern Flagged for Review',
    instructions: 'An actionable high-priority alert flags a potential correlation across the burner phone, getaway motorcycle, and shared MO signature across all 3 FIRs for supervisory review.',
    hint: 'Click "Next Step" to inspect the bridging entity on the Entity Profile dossier.',
    actionLabel: 'Analyze Bridging Person'
  },
  {
    step: 8,
    title: 'High-Centrality Link Analysis',
    route: '/entities?id=DEMO-PERSON-3',
    pageName: 'Entity Profile',
    headline: 'Vikram "Vicky" Malhotra Flagged with High Network Centrality',
    instructions: 'Vikram Malhotra, who appeared as a minor parts contractor in Case X alone, surfaces with elevated priority score (96.8 / 100) and graph centrality (0.94) bridging all 3 cases — flagged as a key bridging lead.',
    hint: 'Click "Next Step" to view the compiled Cross-Case Intelligence Package.',
    actionLabel: 'View Intelligence Package'
  },
  {
    step: 9,
    title: 'Cross-Case Intelligence Package Compiled',
    route: '/cases?id=DEMO-CASE-X',
    pageName: 'Case Resolution Summary',
    headline: 'Cross-Case Intelligence Package Compiled — Investigator Review Required',
    instructions: 'NETRA has surfaced a potential link between Vikram "Vicky" Malhotra and Cases X, Y, and Z via a shared phone number, shared vehicle, and a 94.2% MO similarity score. This is an investigative lead requiring verification — not a confirmed connection.',
    hint: 'Storyline complete! You can restart the storyline or review field corroboration workflows.',
    actionLabel: 'Restart Storyline'
  }
];

// ============================================================================
// 8. SERVICE QUERY HANDLERS (Filtered by `revealAtStep <= currentStep`)
// ============================================================================

export function getDemoCases(step = 1, filters = {}) {
  let list = DEMO_CASES.filter(c => c.revealAtStep <= step);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(c => 
      c.crime_no.toLowerCase().includes(q) ||
      c.case_no.toLowerCase().includes(q) ||
      c.brief_facts.toLowerCase().includes(q) ||
      c.police_station.toLowerCase().includes(q)
    );
  }
  if (filters.category && filters.category !== 'All') {
    list = list.filter(c => c.crime_category === filters.category);
  }
  if (filters.status && filters.status !== 'All') {
    list = list.filter(c => c.status === filters.status);
  }
  if (filters.police_station && filters.police_station !== 'All') {
    list = list.filter(c => c.police_station === filters.police_station);
  }
  return list;
}

export function getDemoCaseById(id, step = 1) {
  const c = DEMO_CASES.find(item => (item.id === id || item.crime_no === id) && item.revealAtStep <= step);
  if (!c) return DEMO_CASES[0]; // Default to Case X in demo
  return c;
}

export function getDemoPersons(step = 1, filters = {}) {
  let list = DEMO_PERSONS.filter(p => p.revealAtStep <= step).map(p => getDemoPersonById(p.id, step));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(p =>
      p.canonical_name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.aliases || []).some(a => a.toLowerCase().includes(q))
    );
  }
  return list;
}

export function getDemoPersonById(id, step = 1) {
  const target = DEMO_PERSONS.find(item => item.id === id && item.revealAtStep <= step)
    || DEMO_PERSONS.find(item => item.id === id)
    || DEMO_PERSONS[0];

  const isBridging = target.id === 'DEMO-PERSON-3' && step >= 4;
  const score = (target.id === 'DEMO-PERSON-3') 
    ? (step >= 8 ? 96.8 : step >= 4 ? 88.5 : 35.0)
    : (target.id === 'DEMO-PERSON-1' ? 62.4 : 48.1);

  // Filter timeline events, relationships, linked cases, assets by revealAtStep <= step
  const visibleEvents = (target.timeline || []).filter(e => (e.revealAtStep || 1) <= step);
  const visibleRelationships = (target.relationships || []).filter(r => (r.revealAtStep || 1) <= step);
  const visibleCases = (target.linkedCases || []).filter(c => (c.revealAtStep || 1) <= step);
  const visiblePhones = (target.linkedPhones || []).filter(ph => (ph.revealAtStep || 1) <= step);
  const visibleVehicles = (target.linkedVehicles || []).filter(v => (v.revealAtStep || 1) <= step);
  const visibleAccounts = (target.linkedAccounts || []).filter(a => (a.revealAtStep || 1) <= step);

  return {
    ...target,
    role: isBridging ? 'Key Bridging Suspect' : target.role,
    status_tag: isBridging ? 'High-Priority POI' : target.status_tag,
    priority_score: score,
    events: visibleEvents,
    timeline: visibleEvents,
    relationships: visibleRelationships,
    linkedCases: visibleCases,
    linkedPhones: visiblePhones,
    linkedVehicles: visibleVehicles,
    linkedAccounts: visibleAccounts,
    caseCount: visibleCases.length
  };
}

// Geospatial coordinates lookup for Demo Entities (Mumbai Metropolitan)
export const DEMO_GEO_COORDINATES = {
  'DEMO-CASE-X': { lat: 18.9067, lng: 72.8147 },
  'DEMO-CASE-Y': { lat: 19.0596, lng: 72.8295 },
  'DEMO-CASE-Z': { lat: 18.9500, lng: 72.8310 },
  'DEMO-PERSON-1': { lat: 18.9090, lng: 72.8130 },
  'DEMO-PERSON-2': { lat: 18.9130, lng: 72.8170 },
  'DEMO-PERSON-3': { lat: 18.9430, lng: 72.8240 },
  'DEMO-PERSON-4': { lat: 18.9520, lng: 72.8335 },
  'DEMO-PERSON-5': { lat: 19.0550, lng: 72.8350 },
  'DEMO-PHONE-1': { lat: 18.9600, lng: 72.8200 },
  'DEMO-PHONE-2': { lat: 18.9085, lng: 72.8120 },
  'DEMO-VEHICLE-1': { lat: 19.0050, lng: 72.8180 },
  'DEMO-VEHICLE-2': { lat: 18.9145, lng: 72.8185 },
  'DEMO-ACC-1': { lat: 18.9540, lng: 72.8300 }
};

// Canvas 2D Layout Positions for Investigation Canvas (ReactFlow)
export const DEMO_CANVAS_POSITIONS = {
  'DEMO-CASE-X': { x: 420, y: 60 },
  'DEMO-PERSON-1': { x: 80, y: 260 },
  'DEMO-PHONE-2': { x: 80, y: 520 },
  'DEMO-PERSON-2': { x: 420, y: 320 },
  'DEMO-VEHICLE-2': { x: 420, y: 580 },
  'DEMO-PERSON-3': { x: 760, y: 260 },
  'DEMO-PHONE-1': { x: 760, y: 60 },
  'DEMO-CASE-Y': { x: 1100, y: 60 },
  'DEMO-VEHICLE-1': { x: 760, y: 520 },
  'DEMO-PERSON-5': { x: 1100, y: 320 },
  'DEMO-PERSON-4': { x: 760, y: 760 },
  'DEMO-CASE-Z': { x: 1100, y: 600 },
  'DEMO-ACC-1': { x: 420, y: 800 }
};

export function getDemoCaseIntelligenceNetwork(caseId, step = 1, filters = {}) {
  const targetCase = DEMO_CASES.find(c => c.id === caseId || c.crime_no === caseId) || DEMO_CASES[0];
  const visibleRels = DEMO_RELATIONSHIPS.filter(r => r.revealAtStep <= step);
  const visiblePersons = DEMO_PERSONS.filter(p => p.revealAtStep <= step);
  const visiblePhones = DEMO_ASSETS.phones.filter(ph => ph.revealAtStep <= step);
  const visibleVehicles = DEMO_ASSETS.vehicles.filter(v => v.revealAtStep <= step);
  const visibleAccounts = DEMO_ASSETS.accounts.filter(a => a.revealAtStep <= step);
  const visibleCases = DEMO_CASES.filter(c => c.revealAtStep <= step);

  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // Add Case Nodes
  visibleCases.forEach(c => {
    if (!nodeMap.has(c.id)) {
      const geo = DEMO_GEO_COORDINATES[c.id] || { lat: c.latitude || 18.9067, lng: c.longitude || 72.8147 };
      const node = {
        id: c.id,
        label: c.crime_no,
        shortLabel: c.crime_no,
        type: 'Case',
        nodeType: 'Case',
        typeCode: 'FIR',
        category: c.crime_category,
        police_station: c.police_station,
        status: c.status,
        subtext: `${c.police_station} • ${c.crime_category}`,
        brief_facts: c.brief_facts,
        latitude: geo.lat,
        longitude: geo.lng,
        lat: geo.lat,
        lng: geo.lng,
        confidence: 100
      };
      nodes.push(node);
      nodeMap.set(c.id, node);
    }
  });

  // Add Person Nodes
  visiblePersons.forEach(p => {
    if (!nodeMap.has(p.id)) {
      const isBridging = p.id === 'DEMO-PERSON-3' && step >= 4;
      const score = (p.id === 'DEMO-PERSON-3') 
        ? (step >= 8 ? 96.8 : step >= 4 ? 88.5 : 35.0)
        : (p.id === 'DEMO-PERSON-1' ? 62.4 : 48.1);
      const geo = DEMO_GEO_COORDINATES[p.id] || { lat: 18.9090, lng: 72.8130 };

      const node = {
        id: p.id,
        label: p.canonical_name,
        shortLabel: p.canonical_name.split(' ')[0],
        type: 'Person',
        nodeType: 'Person',
        typeCode: 'PER',
        role: isBridging ? 'Key Bridging Suspect' : p.role,
        subtext: isBridging ? 'Key Bridging Suspect' : (p.role || p.status_tag),
        status: p.status_tag,
        confidence: p.confidence_score,
        priority_score: score,
        isPerson: true,
        photo_url: p.photo_url,
        aliases: p.aliases,
        details: p.details,
        lat: geo.lat,
        lng: geo.lng,
        latitude: geo.lat,
        longitude: geo.lng
      };
      nodes.push(node);
      nodeMap.set(p.id, node);
    }
  });

  // Add Asset Nodes
  visiblePhones.forEach(ph => {
    if (!nodeMap.has(ph.id)) {
      const geo = DEMO_GEO_COORDINATES[ph.id] || { lat: 18.9085, lng: 72.8120 };
      const node = {
        id: ph.id,
        label: ph.label,
        shortLabel: ph.number || ph.id,
        type: 'Phone',
        nodeType: 'Phone',
        typeCode: 'PH',
        subtext: ph.number || 'Telecom Asset',
        details: ph.details,
        lat: geo.lat,
        lng: geo.lng,
        confidence: 90
      };
      nodes.push(node);
      nodeMap.set(ph.id, node);
    }
  });

  visibleVehicles.forEach(v => {
    if (!nodeMap.has(v.id)) {
      const geo = DEMO_GEO_COORDINATES[v.id] || { lat: 18.9145, lng: 72.8185 };
      const node = {
        id: v.id,
        label: v.label,
        shortLabel: v.registration || v.id,
        type: 'Vehicle',
        nodeType: 'Vehicle',
        typeCode: 'VEH',
        subtext: v.registration || 'Vehicle Asset',
        details: v.details,
        lat: geo.lat,
        lng: geo.lng,
        confidence: 92
      };
      nodes.push(node);
      nodeMap.set(v.id, node);
    }
  });

  visibleAccounts.forEach(a => {
    if (!nodeMap.has(a.id)) {
      const geo = DEMO_GEO_COORDINATES[a.id] || { lat: 18.9540, lng: 72.8300 };
      const node = {
        id: a.id,
        label: a.label,
        shortLabel: (a.account_number || a.id).slice(-6),
        type: 'Account',
        nodeType: 'Account',
        typeCode: 'ACC',
        subtext: a.account_number || 'Bank Account',
        details: a.details,
        lat: geo.lat,
        lng: geo.lng,
        confidence: 88
      };
      nodes.push(node);
      nodeMap.set(a.id, node);
    }
  });

  // Add Edges with resolved coordinate pairs
  visibleRels.forEach(r => {
    const src = nodeMap.get(r.source_id);
    const tgt = nodeMap.get(r.target_id);
    if (src && tgt) {
      edges.push({
        id: r.id,
        source: r.source_id,
        target: r.target_id,
        label: r.relationship_type,
        verb: r.relationship_type,
        detailLabel: r.source_evidence || r.relationship_type,
        confidence: r.confidence || 90,
        status: r.status || 'observed',
        isCrossCase: r.revealAtStep >= 4,
        sourceCoords: [src.lat, src.lng],
        targetCoords: [tgt.lat, tgt.lng]
      });
    }
  });

  return {
    caseData: targetCase,
    nodes,
    edges,
    unplacedNodes: []
  };
}

export function getDemoCaseCanvas(caseId = 'DEMO-CASE-X', step = 1) {
  const net = getDemoCaseIntelligenceNetwork(caseId, step);
  const targetCase = DEMO_CASES.find(c => c.id === caseId || c.crime_no === caseId) || DEMO_CASES[0];

  const canvasNodes = (net.nodes || []).map((n, idx) => {
    const pos = DEMO_CANVAS_POSITIONS[n.id] || {
      x: 80 + (idx % 3) * 340,
      y: 80 + Math.floor(idx / 3) * 240
    };

    const isPerson = n.type === 'Person';
    const isCase = n.type === 'Case';

    return {
      id: n.id,
      type: isPerson ? 'personCard' : 'entityCard',
      position: pos,
      data: {
        label: n.label,
        role: n.role || n.subtext || (isPerson ? 'Suspect' : isCase ? 'Case FIR' : n.type),
        nodeType: n.type,
        description: n.details || n.brief_facts || n.subtext || '',
        status: (n.confidence && n.confidence >= 80) ? 'confirmed' : 'hypothesis',
        priority_score: n.priority_score || n.confidence || 75,
        confidence: n.confidence || 85,
        linkedId: n.id,
        aliases: n.aliases || [],
        photo_url: n.photo_url || null
      }
    };
  });

  const canvasEdges = (net.edges || []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.verb || e.label || 'connected to',
    data: {
      justification: e.detailLabel || 'Evidence established in case investigation',
      status: e.status || 'confirmed'
    }
  }));

  return {
    caseId: targetCase.id,
    caseNotes: step >= 4 
      ? 'Cross-case syndicate analysis: Burner SIM +91 98201 99887 and blue Bajaj Pulsar MH-01-EA-9912 bridge Colaba Vault Heist (Case X) with Bandra Horology Burglary (Case Y) and Zaveri Gold Smelter (Case Z). Primary coordinator: Vikram Malhotra.'
      : 'Initial investigative whiteboard for Colaba Vault Heist. Physical safe penetration via oxy-acetylene thermal lance. Security guard Farhan Qureshi and locksmith Dinesh Rawat under active observation.',
    nodes: canvasNodes,
    edges: canvasEdges
  };
}

export function getDemoGlobalIntelligenceNetwork(step = 1, filters = {}) {
  return getDemoCaseIntelligenceNetwork('DEMO-CASE-X', step, filters);
}

export function getDemoMOSimilarities(caseId = 'DEMO-CASE-X', step = 1) {
  const allCases = DEMO_CASES.filter(c => c.revealAtStep <= step);
  const selectedCase = allCases.find(c => c.id === caseId) || allCases[0];
  const selectedFP = DEMO_MO_FINGERPRINTS.find(fp => fp.case_id === selectedCase.id) || DEMO_MO_FINGERPRINTS[0];

  const visibleSims = DEMO_MO_SIMILARITIES.filter(s => s.revealAtStep <= step);
  const relatedSims = visibleSims.filter(s => s.case_id_a === selectedCase.id || s.case_id_b === selectedCase.id);

  const rankedMatches = relatedSims.map(s => {
    const otherId = s.case_id_a === selectedCase.id ? s.case_id_b : s.case_id_a;
    return {
      case: allCases.find(c => c.id === otherId),
      fingerprint: DEMO_MO_FINGERPRINTS.find(fp => fp.case_id === otherId),
      similarity_score: s.similarity_score,
      matching_components: s.matching_components
    };
  }).filter(m => m.case).sort((a, b) => b.similarity_score - a.similarity_score);

  return { allCases, selectedCase, selectedFP, rankedMatches };
}

export function getDemoAlerts(step = 1, filters = {}) {
  let list = DEMO_ALERTS.filter(a => a.revealAtStep <= step);
  if (filters.severity && filters.severity !== 'All') {
    list = list.filter(a => a.severity === filters.severity);
  }
  if (filters.status && filters.status !== 'All') {
    list = list.filter(a => a.status === filters.status);
  }
  return list;
}

export function getDemoDashboardMetrics(step = 1) {
  const cases = DEMO_CASES.filter(c => c.revealAtStep <= step);
  const persons = DEMO_PERSONS.filter(p => p.revealAtStep <= step);
  const alerts = DEMO_ALERTS.filter(a => a.revealAtStep <= step);

  const activeCases = cases.length;
  const openAlerts = alerts.filter(a => a.status === 'New').length;
  const highSeverityAlerts = alerts.filter(a => a.severity === 'High').length;
  const entitiesTracked = persons.length + DEMO_ASSETS.phones.length + DEMO_ASSETS.vehicles.length;

  const aiFindings = (step >= 7) ? [
    {
      id: 'FINDING-DEMO-01',
      finding_id: 'FINDING-DEMO-01',
      icon: 'network',
      title: 'Multi-Case Syndicate Correlation',
      finding: 'Cross-Jurisdictional Vault Heist Syndicate Discovered',
      description: 'Burner phone +91 98201 99887 and motorcycle MH-01-EA-9912 link Colaba Vault Heist with Bandra Showroom & Zaveri Smelter.',
      confidence: 96,
      case_id: 'DEMO-CASE-X',
      caseId: 'DEMO-CASE-X',
      finding_type: 'CROSS_CASE_LINK',
      created_at: new Date().toISOString()
    }
  ] : [
    {
      id: 'FINDING-DEMO-INIT',
      finding_id: 'FINDING-DEMO-INIT',
      icon: 'tool',
      title: 'Initial Forensic Metallurgy Scan',
      finding: 'Oxy-Acetylene Torch Safe Cut Marks Identified',
      description: 'Physical cut residue matches high-temperature industrial torch equipment.',
      confidence: 82,
      case_id: 'DEMO-CASE-X',
      caseId: 'DEMO-CASE-X',
      finding_type: 'FORENSIC_MATCH',
      created_at: new Date().toISOString()
    }
  ];

  const hotspots = [
    {
      id: 'zone-colaba',
      name: 'Colaba Causeway Precinct',
      stationJurisdiction: 'Colaba Police Station',
      station: 'Colaba Police Station',
      region: 'South Mumbai Sector',
      reportedCrimes: 1,
      caseCount: 1,
      count: 1,
      type: 'Organized Vault Heist',
      topCategory: 'Property Crime',
      lat: 18.9067,
      lng: 72.8147,
      latitude: 18.9067,
      longitude: 72.8147,
      severity: 'High',
      activityLevel: 'HIGH',
      x: 35,
      y: 75
    }
  ];

  if (step >= 4) {
    hotspots.push(
      {
        id: 'zone-bandra',
        name: 'Bandra Linking Road',
        stationJurisdiction: 'Bandra Police Station',
        station: 'Bandra Police Station',
        region: 'Western Suburbs Sector',
        reportedCrimes: 1,
        caseCount: 1,
        count: 1,
        type: 'Luxury Showroom Burglary',
        topCategory: 'Property Crime',
        lat: 19.0596,
        lng: 72.8295,
        latitude: 19.0596,
        longitude: 72.8295,
        severity: 'High',
        activityLevel: 'HIGH',
        x: 60,
        y: 45
      },
      {
        id: 'zone-zaveri',
        name: 'Zaveri Bazaar Corridor',
        stationJurisdiction: 'Byculla Police Station',
        station: 'Byculla Police Station',
        region: 'Central Smelting District',
        reportedCrimes: 1,
        caseCount: 1,
        count: 1,
        type: 'Gold Smelting Smuggling',
        topCategory: 'Organized Financial Crime',
        lat: 18.9500,
        lng: 72.8310,
        latitude: 18.9500,
        longitude: 72.8310,
        severity: 'High',
        activityLevel: 'HIGH',
        x: 45,
        y: 65
      }
    );
  }

  return {
    activeCases,
    openAlerts,
    highSeverityAlerts,
    entitiesTracked,
    recentAlerts: alerts,
    aiFindings,
    hotspots
  };
}
