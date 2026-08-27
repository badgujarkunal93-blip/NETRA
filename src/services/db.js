import { isSupabaseConfigured, supabase } from './supabaseClient.js';

// ============================================================================
// SEEDED MUMBAI POLICE CRIMINAL INTELLIGENCE DATASET (SIH 26189)
// ============================================================================

const SEED_DATA = {
  cases: [
    {
      id: 'CASE-2026-0811',
      crime_no: 'CR/2026/0811-BND',
      case_no: 'FIR-402/2026',
      crime_category: 'Organized Financial Crime',
      crime_major_head: 'Cheating & Forgery (IPC 420/468)',
      crime_minor_head: 'Hawala & Shell Entity Round-Tripping',
      status: 'Under Investigation',
      registered_date: '2026-07-14',
      incident_from: '2026-06-01T09:30:00Z',
      incident_to: '2026-07-10T18:00:00Z',
      latitude: 19.0596,
      longitude: 72.8295,
      police_station: 'Bandra Police Station',
      brief_facts: 'Investigation into a syndicate operating 14 fake import-export billing firms in Bandra Kurla Complex (BKC). Funds routed via overseas mule accounts in UAE before remitting to real estate holdings in suburban Mumbai. Primary operator identified using multiple burner SIMs.'
    },
    {
      id: 'CASE-2026-0924',
      crime_no: 'CR/2026/0924-CLB',
      case_no: 'FIR-118/2026',
      crime_category: 'Property Crime',
      crime_major_head: 'Armed Dacoity & Robbery (IPC 395)',
      crime_minor_head: 'High-Value Diamond Vault Heist',
      status: 'Open',
      registered_date: '2026-08-02',
      incident_from: '2026-08-01T23:15:00Z',
      incident_to: '2026-08-02T03:45:00Z',
      latitude: 18.9220,
      longitude: 72.8347,
      police_station: 'Colaba Police Station',
      brief_facts: 'Four masked operatives breached private vault facility in Colaba after subduing night guard with stun devices. Vault door opened via specialized pneumatic cutting tools. Suspects fled on two black motorcycles toward South Bombay sea-link exit.'
    },
    {
      id: 'CASE-2026-0740',
      crime_no: 'CR/2026/0740-DHR',
      case_no: 'FIR-305/2026',
      crime_category: 'Contraband Trafficking',
      crime_major_head: 'NDPS Act (Sec 8c/21/29)',
      crime_minor_head: 'Synthetic Mephedrone (MD) Transit Hub',
      status: 'Under Investigation',
      registered_date: '2026-06-20',
      incident_from: '2026-06-19T21:00:00Z',
      incident_to: '2026-06-20T04:30:00Z',
      latitude: 19.0434,
      longitude: 72.8567,
      police_station: 'Dharavi Police Station',
      brief_facts: 'Interception of 12.5 kg suspected commercial-grade Mephedrone concealed within hollowed industrial textile rolls in transit from Palghar border to transit godown near 90 Feet Road, Dharavi.'
    },
    {
      id: 'CASE-2026-0615',
      crime_no: 'CR/2026/0615-AND',
      case_no: 'FIR-512/2026',
      crime_category: 'Cybercrime',
      crime_major_head: 'IT Act 66C/66D & IPC 419',
      crime_minor_head: 'SIM Swap & Corporate Banking Hijack',
      status: 'Under Investigation',
      registered_date: '2026-05-18',
      incident_from: '2026-05-17T11:00:00Z',
      incident_to: '2026-05-18T14:20:00Z',
      latitude: 19.1136,
      longitude: 72.8697,
      police_station: 'Andheri East Cyber Cell',
      brief_facts: 'Unlawful SIM porting targeting Chief Financial Officer of an infrastructure enterprise in MIDC Andheri. OTP intercepted to drain ₹4.8 Crore into 38 distinct micro-accounts within 12 minutes.'
    },
    {
      id: 'CASE-2026-0582',
      crime_no: 'CR/2026/0582-WRL',
      case_no: 'FIR-209/2026',
      crime_category: 'Organized Financial Crime',
      crime_major_head: 'Extortion & Threat (IPC 384/387)',
      crime_minor_head: 'Developer Extortion via Virtual Numbers',
      status: 'Chargesheet Filed',
      registered_date: '2026-04-10',
      incident_from: '2026-03-25T14:00:00Z',
      incident_to: '2026-04-09T20:00:00Z',
      latitude: 19.0178,
      longitude: 72.8178,
      police_station: 'Worli Police Station',
      brief_facts: 'Threat calls received by prominent high-rise builder demanding ₹2 Crore protection money. VoIP tracing linked proxy IP gateways to a logistics syndicate registered in Navi Mumbai.'
    },
    {
      id: 'CASE-2026-0491',
      crime_no: 'CR/2026/0491-KRL',
      case_no: 'FIR-178/2026',
      crime_category: 'Vehicle Theft Ring',
      crime_major_head: 'Auto Theft & Forgery (IPC 379/471)',
      crime_minor_head: 'OBD-Programmed Luxury SUV Dismantling',
      status: 'Under Investigation',
      registered_date: '2026-03-30',
      incident_from: '2026-03-29T02:00:00Z',
      incident_to: '2026-03-29T05:00:00Z',
      latitude: 19.0726,
      longitude: 72.8845,
      police_station: 'Kurla Police Station',
      brief_facts: 'Organized gang using electronic signal amplifier & key cloner targeting high-end SUVs in Kurla-CST Road belt. Chassis numbers re-stamped and exported via Gujarat container depot.'
    },
    {
      id: 'CASE-2026-0330',
      crime_no: 'CR/2026/0330-DDR',
      case_no: 'FIR-092/2026',
      crime_category: 'Property Crime',
      crime_major_head: 'Housebreaking by Night (IPC 457/380)',
      crime_minor_head: 'Gold Merchant Residential Safe Breach',
      status: 'Open',
      registered_date: '2026-02-14',
      incident_from: '2026-02-13T23:45:00Z',
      incident_to: '2026-02-14T04:15:00Z',
      latitude: 19.0178,
      longitude: 72.8478,
      police_station: 'Dadar Police Station',
      brief_facts: 'Second-floor balcony entry in residential society near Shivaji Park. Security cameras disabled with spray paint. Vault cut with silent hydraulic shears; 1.8 kg gold bullion stolen.'
    },
    {
      id: 'CASE-2026-0210',
      crime_no: 'CR/2026/0210-MLD',
      case_no: 'FIR-064/2026',
      crime_category: 'Cybercrime',
      crime_major_head: 'Digital Arrest / Impersonation (IPC 419/420)',
      crime_minor_head: 'Fake Law Enforcement Video Extortion',
      status: 'Under Investigation',
      registered_date: '2026-01-22',
      incident_from: '2026-01-20T10:00:00Z',
      incident_to: '2026-01-22T16:00:00Z',
      latitude: 19.1860,
      longitude: 72.8485,
      police_station: 'Malad Police Station',
      brief_facts: 'Senior citizen victim coerced into keeping Skype video active for 48 hours under threat of fake CBI warrant. Transferred ₹85 Lakh to mule bank accounts in Dombivli and Thane.'
    },
    {
      id: 'CASE-2026-0155',
      crime_no: 'CR/2026/0155-GHT',
      case_no: 'FIR-041/2026',
      crime_category: 'Arms & Ammunition',
      crime_major_head: 'Arms Act (Sec 3/25/27)',
      crime_minor_head: 'Country-Made Firearm Consignment Interception',
      status: 'Under Investigation',
      registered_date: '2026-01-08',
      incident_from: '2026-01-07T19:30:00Z',
      incident_to: '2026-01-07T21:00:00Z',
      latitude: 19.0860,
      longitude: 72.9090,
      police_station: 'Ghatkopar Police Station',
      brief_facts: 'Raid on an unattended storage lockup near LBS Marg yielded 6 country-made pistols and 40 live cartridges. Informant intelligence points to supply link from MP border network.'
    },
    {
      id: 'CASE-2026-0089',
      crime_no: 'CR/2026/0089-CHM',
      case_no: 'FIR-019/2026',
      crime_category: 'Contraband Trafficking',
      crime_major_head: 'Customs Act & NDPS (Sec 135/22)',
      crime_minor_head: 'Darknet Postal Parcel Interception',
      status: 'Closed',
      registered_date: '2025-12-19',
      incident_from: '2025-12-18T14:00:00Z',
      incident_to: '2025-12-19T11:00:00Z',
      latitude: 19.0622,
      longitude: 72.8975,
      police_station: 'Chembur Police Station',
      brief_facts: 'Foreign postal parcel containing 200 LSD blotters intercepted at air cargo courier hub. Addressed to fictitious persona at Chembur east residential address; receiver arrested upon delivery.'
    },
    {
      id: 'CASE-2026-1045',
      crime_no: 'CR/2026/1045-BND',
      case_no: 'FIR-550/2026',
      crime_category: 'Property Crime',
      crime_major_head: 'Commercial Safe Breaching (IPC 457/380)',
      crime_minor_head: 'Jewellery Showroom Night Vault Cut',
      status: 'Open',
      registered_date: '2026-08-15',
      incident_from: '2026-08-14T23:30:00Z',
      incident_to: '2026-08-15T04:00:00Z',
      latitude: 19.0600,
      longitude: 72.8360,
      police_station: 'Bandra Police Station',
      brief_facts: 'High-end jewellery showroom on Linking Road broken into via rear wall penetration. Gas torch and hydraulic jack used to open auxiliary safe. MO strongly matches Colaba diamond vault heist.'
    },
    {
      id: 'CASE-2026-1120',
      crime_no: 'CR/2026/1120-AND',
      case_no: 'FIR-604/2026',
      crime_category: 'Cybercrime',
      crime_major_head: 'IT Act 66D & IPC 420',
      crime_minor_head: 'Crypto Investment WhatsApp Boiler-Room',
      status: 'Under Investigation',
      registered_date: '2026-08-20',
      incident_from: '2026-07-20T09:00:00Z',
      incident_to: '2026-08-19T18:00:00Z',
      latitude: 19.1190,
      longitude: 72.8465,
      police_station: 'Andheri West Police Station',
      brief_facts: 'Multiple victims duped into fake institutional crypto staking app. ₹6.2 Crore siphoned and converted to USDT across unhosted peer wallets linked to Andheri shell firms.'
    }
  ],

  persons: [
    {
      id: 'PER-1001',
      canonical_name: 'Farhan Merchant',
      aliases: ['Bhaijaan', 'Faru Hawala', 'FM'],
      dob: '1982-04-15',
      gender: 'Male',
      status_tag: 'Key Suspect',
      confidence_score: 94,
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1002',
      canonical_name: 'Rajesh Sawant',
      aliases: ['Munna Safe', 'Raju Cutter'],
      dob: '1988-11-03',
      gender: 'Male',
      status_tag: 'Accused',
      confidence_score: 91,
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1003',
      canonical_name: 'Priya Nair',
      aliases: ['Maya Crypto', 'PN Forex'],
      dob: '1993-07-21',
      gender: 'Female',
      status_tag: 'Person of Interest',
      confidence_score: 82,
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1004',
      canonical_name: 'Anand Kulkarni',
      aliases: ['Advocate Anand', 'AK Trustee'],
      dob: '1976-02-18',
      gender: 'Male',
      status_tag: 'Under Surveillance',
      confidence_score: 76,
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1005',
      canonical_name: 'Sameer Qureshi',
      aliases: ['Chhota Sameer', 'Sam Courier'],
      dob: '1996-09-09',
      gender: 'Male',
      status_tag: 'Accused',
      confidence_score: 89,
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1006',
      canonical_name: 'Vikram Solanki',
      aliases: ['Vicky Gadget', 'OBD Master'],
      dob: '1991-06-12',
      gender: 'Male',
      status_tag: 'Key Suspect',
      confidence_score: 87,
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1007',
      canonical_name: 'Harish Shetty',
      aliases: ['Anna Hotelier', 'HS Worli'],
      dob: '1979-12-30',
      gender: 'Male',
      status_tag: 'Person of Interest',
      confidence_score: 72,
      photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1008',
      canonical_name: 'Deepali Deshmukh',
      aliases: ['Deepa Accounts'],
      dob: '1985-03-27',
      gender: 'Female',
      status_tag: 'Witness',
      confidence_score: 68,
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1009',
      canonical_name: 'Tariq Patel',
      aliases: ['TP Palghar', 'Tariq Driver'],
      dob: '1987-08-14',
      gender: 'Male',
      status_tag: 'Accused',
      confidence_score: 93,
      photo_url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1010',
      canonical_name: 'Imran Khan',
      aliases: ['Tiger Kurla', 'IK Dismantler'],
      dob: '1990-01-05',
      gender: 'Male',
      status_tag: 'Key Suspect',
      confidence_score: 85,
      photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1011',
      canonical_name: 'Sunil Jadhav',
      aliases: ['SJ Tech', 'SIM Master'],
      dob: '1995-10-10',
      gender: 'Male',
      status_tag: 'Accused',
      confidence_score: 90,
      photo_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1012',
      canonical_name: 'Gaurav Mehta',
      aliases: ['GM Bullion'],
      dob: '1970-05-19',
      gender: 'Male',
      status_tag: 'Witness',
      confidence_score: 95,
      photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1013',
      canonical_name: 'Kavita Shinde',
      aliases: ['KS Telecom'],
      dob: '1998-04-02',
      gender: 'Female',
      status_tag: 'Informant',
      confidence_score: 79,
      photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1014',
      canonical_name: 'Aslam Ansari',
      aliases: ['Chop-Shop Aslam'],
      dob: '1984-09-22',
      gender: 'Male',
      status_tag: 'Person of Interest',
      confidence_score: 65,
      photo_url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'PER-1015',
      canonical_name: 'Mohit Agrawal',
      aliases: ['MA Realties'],
      dob: '1978-11-15',
      gender: 'Male',
      status_tag: 'Person of Interest',
      confidence_score: 58,
      photo_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
    }
  ],

  phones: [
    { id: 'PHN-201', normalized_number_hash: '+91-98201-XXXXX (Hash: #7A3F)', owner_person_id: 'PER-1001', first_seen: '2025-10-01', last_seen: '2026-08-20', service_provider: 'Airtel Mumbai' },
    { id: 'PHN-202', normalized_number_hash: '+91-98670-XXXXX (Hash: #88B2)', owner_person_id: 'PER-1001', first_seen: '2026-05-12', last_seen: '2026-07-28', service_provider: 'Burner / Vi' },
    { id: 'PHN-203', normalized_number_hash: '+91-98192-XXXXX (Hash: #11C4)', owner_person_id: 'PER-1002', first_seen: '2026-01-15', last_seen: '2026-08-18', service_provider: 'Jio Mumbai' },
    { id: 'PHN-204', normalized_number_hash: '+91-99304-XXXXX (Hash: #90E1)', owner_person_id: 'PER-1003', first_seen: '2025-08-10', last_seen: '2026-08-22', service_provider: 'Airtel Mumbai' },
    { id: 'PHN-205', normalized_number_hash: '+91-97022-XXXXX (Hash: #45FA)', owner_person_id: 'PER-1005', first_seen: '2026-03-01', last_seen: '2026-08-10', service_provider: 'Vi Mumbai' },
    { id: 'PHN-206', normalized_number_hash: '+91-98211-XXXXX (Hash: #33D9)', owner_person_id: 'PER-1006', first_seen: '2025-11-20', last_seen: '2026-08-01', service_provider: 'Jio Maharashtra' },
    { id: 'PHN-207', normalized_number_hash: '+91-98700-XXXXX (Hash: #229A)', owner_person_id: 'PER-1009', first_seen: '2026-02-10', last_seen: '2026-06-20', service_provider: 'Airtel Gujarat' },
    { id: 'PHN-208', normalized_number_hash: '+91-98334-XXXXX (Hash: #67BC)', owner_person_id: 'PER-1011', first_seen: '2026-04-05', last_seen: '2026-05-18', service_provider: 'Burner SIM' }
  ],

  vehicles: [
    { id: 'VEH-301', registration_hash: 'MH-02-EE-XXXX (#A48F)', vehicle_type: 'Luxury Sedan', owner_person_id: 'PER-1001', make_model: 'Mercedes-Benz E220d', color: 'Obsidian Black' },
    { id: 'VEH-302', registration_hash: 'MH-01-DA-XXXX (#B912)', vehicle_type: 'Motorcycle', owner_person_id: 'PER-1002', make_model: 'Yamaha R15', color: 'Matte Black' },
    { id: 'VEH-303', registration_hash: 'MH-04-GC-XXXX (#C201)', vehicle_type: 'Commercial Van', owner_person_id: 'PER-1009', make_model: 'Mahindra Bolero Maxi', color: 'White' },
    { id: 'VEH-304', registration_hash: 'MH-03-BS-XXXX (#D543)', vehicle_type: 'SUV', owner_person_id: 'PER-1006', make_model: 'Toyota Fortuner 4x4', color: 'Pearl White' },
    { id: 'VEH-305', registration_hash: 'MH-02-CK-XXXX (#E876)', vehicle_type: 'Hatchback', owner_person_id: 'PER-1007', make_model: 'Hyundai i20', color: 'Silver' }
  ],

  accounts: [
    { id: 'ACC-401', account_hash: 'HDFC-******9102 (#HDFC71)', institution_type: 'Private Commercial Bank', owner_person_id: 'PER-1001', account_type: 'Corporate Current', risk_level: 'High' },
    { id: 'ACC-402', account_hash: 'ICICI-******4419 (#ICIC89)', institution_type: 'Private Commercial Bank', owner_person_id: 'PER-1003', account_type: 'FCNR / Forex Escrow', risk_level: 'High' },
    { id: 'ACC-403', account_hash: 'AXIS-******2031 (#AXIS34)', institution_type: 'Private Commercial Bank', owner_person_id: 'PER-1004', account_type: 'Trust Escrow', risk_level: 'Medium' },
    { id: 'ACC-404', account_hash: 'SBI-******7712 (#SBIN12)', institution_type: 'Public Sector Bank', owner_person_id: 'PER-1005', account_type: 'Savings (Mule)', risk_level: 'High' },
    { id: 'ACC-405', account_hash: 'KOTAK-******5508 (#KOTK65)', institution_type: 'Private Commercial Bank', owner_person_id: 'PER-1011', account_type: 'Current (Fintech Proxy)', risk_level: 'High' }
  ],

  organizations: [
    { id: 'ORG-501', name: 'Al-Madina Logistics Trading LLP', type: 'Shell Logistics Freight', jurisdiction: 'BKC, Mumbai' },
    { id: 'ORG-502', name: 'Apex Zenith Global Advisory', type: 'Offshore Wealth Structuring', jurisdiction: 'Nariman Point, Mumbai' },
    { id: 'ORG-503', name: 'Kurla Auto Rebuilders Syndicate', type: 'Informal Scrap Guild', jurisdiction: 'Kurla West, Mumbai' },
    { id: 'ORG-504', name: 'Kulkarni & Associates Legal Chamber', type: 'Legal Advisory', jurisdiction: 'Fort, Mumbai' }
  ],

  locations: [
    { id: 'LOC-601', name: 'Colaba Diamond Vault Facility', type: 'Commercial Vault', jurisdiction: 'Colaba, South Mumbai', coordinates: [18.9220, 72.8347] },
    { id: 'LOC-602', name: 'BKC G-Block Corporate Hub', type: 'Financial Complex', jurisdiction: 'Bandra East, Mumbai', coordinates: [19.0665, 72.8680] },
    { id: 'LOC-603', name: '90 Feet Road Transit Godown', type: 'Logistics Depot', jurisdiction: 'Dharavi, Mumbai', coordinates: [19.0434, 72.8567] },
    { id: 'LOC-604', name: 'CST Road Auto Workshop', type: 'Scrap Compound', jurisdiction: 'Kurla West, Mumbai', coordinates: [19.0726, 72.8845] }
  ],

  devices: [
    { id: 'DEV-701', name: 'RF Signal Jammer #RF-CLB', type: 'Electronic Jammer', specs: 'Quad-band 800-2600MHz', risk_level: 'High' },
    { id: 'DEV-702', name: 'OBD Key Cloner Hardware', type: 'Automotive Hack Tool', specs: 'CAN-Bus Flash Programmer', risk_level: 'High' }
  ],

  person_case_roles: [
    { id: 'ROLE-01', person_id: 'PER-1001', case_id: 'CASE-2026-0811', role_type: 'Accused' },
    { id: 'ROLE-02', person_id: 'PER-1003', case_id: 'CASE-2026-0811', role_type: 'Co-conspirator' },
    { id: 'ROLE-03', person_id: 'PER-1004', case_id: 'CASE-2026-0811', role_type: 'Key Suspect' },
    { id: 'ROLE-04', person_id: 'PER-1008', case_id: 'CASE-2026-0811', role_type: 'Witness' },

    { id: 'ROLE-05', person_id: 'PER-1002', case_id: 'CASE-2026-0924', role_type: 'Accused' },
    { id: 'ROLE-06', person_id: 'PER-1012', case_id: 'CASE-2026-0924', role_type: 'Victim' },
    { id: 'ROLE-07', person_id: 'PER-1005', case_id: 'CASE-2026-0924', role_type: 'Co-conspirator' },

    { id: 'ROLE-08', person_id: 'PER-1005', case_id: 'CASE-2026-0740', role_type: 'Accused' },
    { id: 'ROLE-09', person_id: 'PER-1009', case_id: 'CASE-2026-0740', role_type: 'Accused' },
    { id: 'ROLE-10', person_id: 'PER-1001', case_id: 'CASE-2026-0740', role_type: 'Key Suspect' },

    { id: 'ROLE-11', person_id: 'PER-1011', case_id: 'CASE-2026-0615', role_type: 'Accused' },
    { id: 'ROLE-12', person_id: 'PER-1003', case_id: 'CASE-2026-0615', role_type: 'Co-conspirator' },
    { id: 'ROLE-13', person_id: 'PER-1013', case_id: 'CASE-2026-0615', role_type: 'Witness' },

    { id: 'ROLE-14', person_id: 'PER-1007', case_id: 'CASE-2026-0582', role_type: 'Accused' },
    { id: 'ROLE-15', person_id: 'PER-1015', case_id: 'CASE-2026-0582', role_type: 'Victim' },

    { id: 'ROLE-16', person_id: 'PER-1006', case_id: 'CASE-2026-0491', role_type: 'Accused' },
    { id: 'ROLE-17', person_id: 'PER-1010', case_id: 'CASE-2026-0491', role_type: 'Accused' },
    { id: 'ROLE-18', person_id: 'PER-1014', case_id: 'CASE-2026-0491', role_type: 'Key Suspect' },

    { id: 'ROLE-19', person_id: 'PER-1002', case_id: 'CASE-2026-1045', role_type: 'Key Suspect' },
    { id: 'ROLE-20', person_id: 'PER-1003', case_id: 'CASE-2026-1120', role_type: 'Accused' }
  ],

  relationships: [
    // Observed Links
    { id: 'REL-01', source_type: 'Person', source_id: 'PER-1001', target_type: 'Person', target_id: 'PER-1003', relationship_type: 'Financial Beneficiary & Asset Handler', confidence: 94, status: 'observed', first_seen: '2025-06-10', last_seen: '2026-08-15', source_evidence: 'Bank statement CDR cross-transfers and documented corporate filings of Apex Zenith' },
    { id: 'REL-02', source_type: 'Person', source_id: 'PER-1001', target_type: 'Organization', target_id: 'ORG-501', relationship_type: 'Undisclosed De Facto Controller', confidence: 91, status: 'observed', first_seen: '2025-01-20', last_seen: '2026-07-30', source_evidence: 'Lease agreement signed under power of attorney and CCTV footage from BKC office' },
    { id: 'REL-03', source_type: 'Person', source_id: 'PER-1001', target_type: 'Person', target_id: 'PER-1004', relationship_type: 'Retained Legal Counsel & Escrow Agent', confidence: 88, status: 'observed', first_seen: '2024-11-12', last_seen: '2026-08-10', source_evidence: 'Retainer invoices and formal court appearances in earlier 2024 tribunal hearings' },
    { id: 'REL-04', source_type: 'Person', source_id: 'PER-1005', target_type: 'Person', target_id: 'PER-1009', relationship_type: 'Logistics Courier & Transit Route Associate', confidence: 95, status: 'observed', first_seen: '2026-02-14', last_seen: '2026-06-20', source_evidence: 'Toll plaza FASTag co-transit logs at Charoti toll plaza (NH-48) and joint arrest recovery memo' },
    { id: 'REL-05', source_type: 'Person', source_id: 'PER-1006', target_type: 'Person', target_id: 'PER-1010', relationship_type: 'OBD Equipment Supplier & Workshop Partner', confidence: 90, status: 'observed', first_seen: '2025-09-18', last_seen: '2026-08-01', source_evidence: 'Forensic extraction of seized Samsung Galaxy handset containing garage workshop invoices' },
    { id: 'REL-06', source_type: 'Person', source_id: 'PER-1002', target_type: 'Person', target_id: 'PER-1005', relationship_type: 'Pre-Operation Recce Contact', confidence: 86, status: 'observed', first_seen: '2026-07-10', last_seen: '2026-08-02', source_evidence: 'Colaba cell tower dump showing 7 mutual voice calls between 22:00 and 01:30' },

    // Inferred Links (AI-Detected)
    { id: 'REL-07', source_type: 'Person', source_id: 'PER-1001', target_type: 'Person', target_id: 'PER-1005', relationship_type: 'Inferred Mastermind-To-Transit Conduit', confidence: 78, status: 'inferred', first_seen: '2026-05-01', last_seen: '2026-08-12', source_evidence: 'Layered CDR intermediary hops via burner SIM #88B2 and shared crypto wallet deposit addresses' },
    { id: 'REL-08', source_type: 'Person', source_id: 'PER-1002', target_type: 'Person', target_id: 'PER-1006', relationship_type: 'Inferred Electronic Bypassing Collaboration', confidence: 64, status: 'inferred', first_seen: '2026-06-15', last_seen: '2026-08-14', source_evidence: 'Identical signal jammer firmware signature identified at Colaba heist and Kurla auto theft scene' },
    { id: 'REL-09', source_type: 'Person', source_id: 'PER-1003', target_type: 'Person', target_id: 'PER-1011', relationship_type: 'Inferred Mule Account Syndicate Coordinator', confidence: 82, status: 'inferred', first_seen: '2026-04-18', last_seen: '2026-08-20', source_evidence: 'Co-occurrence of beneficiary bank IFSC codes in Andheri cyber heist and crypto staking pool' },
    { id: 'REL-10', source_type: 'Person', source_id: 'PER-1007', target_type: 'Person', target_id: 'PER-1001', relationship_type: 'Inferred Informal Settlement Guarantor', confidence: 59, status: 'inferred', first_seen: '2026-03-01', last_seen: '2026-07-15', source_evidence: 'Shared physical location at Sea Green Club Worli coincident with extortion call milestones' },
    { id: 'REL-11', source_type: 'Person', source_id: 'PER-1004', target_type: 'Organization', target_id: 'ORG-502', relationship_type: 'Inferred Nominee Shareholder', confidence: 73, status: 'inferred', first_seen: '2025-08-01', last_seen: '2026-08-01', source_evidence: 'Ministry of Corporate Affairs (MCA) DIN linkage and shared registered auditor' },
    { id: 'REL-12', source_type: 'Person', source_id: 'PER-1010', target_type: 'Organization', target_id: 'ORG-503', relationship_type: 'Scrap Yard Manager', confidence: 92, status: 'observed', first_seen: '2024-03-10', last_seen: '2026-08-15', source_evidence: 'Municipal trade license and GST registration records' }
  ],

  events: [
    { id: 'EVT-01', event_type: 'Arrest & Recovery', case_id: 'CASE-2026-0740', person_id: 'PER-1005', location_text: '90 Feet Road Junction, Dharavi', latitude: 19.0434, longitude: 72.8567, event_time: '2026-06-20T04:30:00Z', description: 'Apprehended while offloading concealed textile cargo containing synthetic contraband. Vehicle VEH-303 impounded.' },
    { id: 'EVT-02', event_type: 'Surveillance Sighting', case_id: 'CASE-2026-0811', person_id: 'PER-1001', location_text: 'BKC G-Block Corporate Towers, Bandra East', latitude: 19.0665, longitude: 72.8680, event_time: '2026-07-18T16:15:00Z', description: 'Subject observed entering legal advisory chambers with executive portfolio; departed in VEH-301.' },
    { id: 'EVT-03', event_type: 'Incident Occurrence', case_id: 'CASE-2026-0924', person_id: 'PER-1002', location_text: 'SBS Marg, Colaba Causeway', latitude: 18.9220, longitude: 72.8347, event_time: '2026-08-02T02:30:00Z', description: 'Perpetrators neutralized exterior alarm sensors and deployed hydraulic cutting shears on primary vault door.' },
    { id: 'EVT-04', event_type: 'Financial Freeze', case_id: 'CASE-2026-0615', person_id: 'PER-1003', location_text: 'Cyber Crime Branch, BKC', latitude: 19.0620, longitude: 72.8640, event_time: '2026-05-19T11:00:00Z', description: 'Urgent Section 91 CrPC notice served freezing ₹1.4 Crore across 8 linked mule accounts in ICICI and HDFC.' },
    { id: 'EVT-05', event_type: 'Vehicle Interception', case_id: 'CASE-2026-0491', person_id: 'PER-1006', location_text: 'CST Road Near Kurla Flyover', latitude: 19.0726, longitude: 72.8845, event_time: '2026-03-30T03:15:00Z', description: 'Suspect SUV flagged by Automated Number Plate Recognition (ANPR); high-speed pursuit intercepted at Kurla rail yard.' },
    { id: 'EVT-06', event_type: 'Interrogation Log', case_id: 'CASE-2026-0740', person_id: 'PER-1009', location_text: 'Crime Branch Unit V, Dharavi', latitude: 19.0434, longitude: 72.8567, event_time: '2026-06-21T10:00:00Z', description: 'Driver admitted to receiving transit instructions via Telegram voice notes from handler code-named "Bhaijaan".' }
  ],

  mo_fingerprints: [
    {
      id: 'MO-0811',
      case_id: 'CASE-2026-0811',
      target: 'Commercial Banking & Corporate Escrow',
      timing: 'Business Hours (10:00 - 16:00)',
      entry_method: 'Forged Identity KYC & Shell Company Registration',
      tools: 'Forged Stamp Seals, Virtual VoIP Switches, Encrypted Messengers',
      transport: 'Chauffeured Executive Sedans',
      concealment: 'Layered Multi-Tier Shell Companies & Hawala Tokens',
      action_sequence: 'Account Opening -> Rapid Token Swapping -> Overseas Invoicing -> Real Estate Injection',
      victim_interaction: 'Remote Impersonation & Professional Institutional Pretexting',
      exit_method: 'Immediate International Wire Transfer before Banking Cutoff',
      group_behavior: 'Decentralized Compartmentalized Cells (3-5 Operators)',
      confidence: 94
    },
    {
      id: 'MO-0924',
      case_id: 'CASE-2026-0924',
      target: 'High-Value Commercial Diamond/Jewelry Vault',
      timing: 'Post-Midnight (01:00 - 03:30)',
      entry_method: 'Roof Duct & Secondary Service Hatch Breaching',
      tools: 'Hydraulic Spreader, Pneumatic Cutter, Laser Sensor Jammer',
      transport: 'High-Torque Dark Color Motorcycles with Obscured Plates',
      concealment: 'Balaclava Masks, Spray Paint on Dome Cameras, RF Jamming',
      action_sequence: 'Perimeter Jamming -> Guard Subdual -> Vault Penetration -> Rapid Motorcycle Extraction',
      victim_interaction: 'Direct Physical Threat with Non-Lethal Stun Devices',
      exit_method: 'Pre-Planned Coastal Highway Route avoiding Toll CCTV',
      group_behavior: 'Tactical Synchronized Squad (4 Specialists)',
      confidence: 92
    },
    {
      id: 'MO-0740',
      case_id: 'CASE-2026-0740',
      target: 'Interstate Bulk Chemical Contraband Transit',
      timing: 'Pre-Dawn Hours (03:00 - 05:00)',
      entry_method: 'Highway Border Crossing with Legitimate Consignment Waybills',
      tools: 'Modified Vehicle Secret Compartments, Vacuum Heat-Sealers',
      transport: 'Light Commercial Covered Goods Carriers',
      concealment: 'Industrial Odor Masks & Hollowed Textile Cargo Bales',
      action_sequence: 'Palghar Loading -> Highway Pilot Escort -> Informal Transit Godown Offload',
      victim_interaction: 'None (Pure Illicit Logistics)',
      exit_method: 'Dispersal to Local Delivery Runners via Two-Wheelers',
      group_behavior: 'Logistics Network with Pilot Escort Vehicle',
      confidence: 88
    },
    {
      id: 'MO-0615',
      case_id: 'CASE-2026-0615',
      target: 'Corporate Treasury & High-Net-Worth Executives',
      timing: 'Mid-Morning Corporate Operational Hours',
      entry_method: 'Corrupt Telecom Retailer SIM Swap',
      tools: 'SIM Cloner Hardware, TOR Browser, Automated Batch Transfer Scripts',
      transport: 'Not Applicable (Virtual Cyber Operation)',
      concealment: 'Dynamic Proxy IPs, VPN Cascades, Rented Mule Accounts',
      action_sequence: 'SIM Deactivation -> OTP Interception -> NetBanking Login -> 38 Micro-Account Drain',
      victim_interaction: 'Indirect (Victim Handset suddenly loses cellular network)',
      exit_method: 'Immediate P2P Crypto Exchange Purchase (USDT)',
      group_behavior: 'Cyber Syndicate (Tech Operator + Mule Recruiter)',
      confidence: 91
    },
    {
      id: 'MO-0491',
      case_id: 'CASE-2026-0491',
      target: 'Luxury 4x4 SUVs & Premium Commercial Fleets',
      timing: 'Late Night (02:00 - 04:30)',
      entry_method: 'Keyless Signal Amplifier & OBD Port Electronic Hijack',
      tools: 'RF Frequency Scanner, OBD Key Programmer, Glass Punch',
      transport: 'Stolen Vehicle driven directly to Scrap Depot',
      concealment: 'GPS Tracker Jammer placed in 12V socket immediately after entry',
      action_sequence: 'Keyless Signal Grab -> Door Unlock -> OBD Ignition Start -> Tracker Neutralization',
      victim_interaction: 'Covert (No interaction with vehicle owners)',
      exit_method: 'Fast arterial transit to Kurla chop-shop workshop',
      group_behavior: 'Trio: Scout, Tech Scanner, Driver',
      confidence: 86
    },
    {
      id: 'MO-1045',
      case_id: 'CASE-2026-1045',
      target: 'Retail Jewellery Showroom Auxiliary Safe',
      timing: 'Late Night (02:30 - 04:00)',
      entry_method: 'Rear Alley Wall Penetration & Shutter Lift',
      tools: 'Oxy-Acetylene Gas Torch, Hydraulic Jack, Infrared Masking Foam',
      transport: 'Modified Dual Motorcycles',
      concealment: 'Black Tactical Gear, Camera Lens Spray, Stolen Registration Plates',
      action_sequence: 'Alley Approach -> Wall Cut -> Safe Torch Cut -> Gold Sweep -> Motorcycle Flight',
      victim_interaction: 'None (Unoccupied commercial premises)',
      exit_method: 'Western Express Highway Northbound route',
      group_behavior: 'Specialized 3-Man Safe Cracking Crew',
      confidence: 89
    }
  ],

  mo_similarities: [
    {
      id: 'SIM-01',
      case_id_a: 'CASE-2026-0924',
      case_id_b: 'CASE-2026-1045',
      similarity_score: 89,
      matching_components: ['Pneumatic & Gas Vault Cutting Tools', 'Post-Midnight 02:00-04:00 Timing', 'Camera Lens Spray Concealment', 'Motorcycle Highway Escape Route', 'High-Value Precious Metal/Stone Target']
    },
    {
      id: 'SIM-02',
      case_id_a: 'CASE-2026-0811',
      case_id_b: 'CASE-2026-0615',
      similarity_score: 76,
      matching_components: ['Mule Account Splintering', 'Commercial Banking Target', 'Rapid Layered Fund Movement', 'Shell Corporate KYC']
    },
    {
      id: 'SIM-03',
      case_id_a: 'CASE-2026-0811',
      case_id_b: 'CASE-2026-1120',
      similarity_score: 82,
      matching_components: ['Decentralized Cell Structure', 'Crypto USDT Off-Ramping', 'BKC/Andheri Shell Company Accounts', 'Forex Advisory Pretext']
    },
    {
      id: 'SIM-04',
      case_id_a: 'CASE-2026-0740',
      case_id_b: 'CASE-2026-0155',
      similarity_score: 68,
      matching_components: ['Transit Godown Concealment', 'Industrial Goods Cover', 'Interstate Highway Corridor', 'Night-time Offloading']
    },
    {
      id: 'SIM-05',
      case_id_a: 'CASE-2026-0491',
      case_id_b: 'CASE-2026-0924',
      similarity_score: 54,
      matching_components: ['RF Signal Jammer Deployment', 'Pre-Dawn Operational Window', 'High-Torque Extraction Vehicles']
    },
    {
      id: 'SIM-06',
      case_id_a: 'CASE-2026-0330',
      case_id_b: 'CASE-2026-1045',
      similarity_score: 72,
      matching_components: ['Hydraulic Shears & Safe Breach', 'CCTV Disable Method', 'Precious Metal Target', 'Suburban Mumbai Catchment']
    },
    {
      id: 'SIM-07',
      case_id_a: 'CASE-2026-0210',
      case_id_b: 'CASE-2026-0615',
      similarity_score: 63,
      matching_components: ['Mule Bank Account Layering', 'Cyber Impersonation', 'Rapid Digital Fund Dissipation']
    }
  ],

  alerts: [
    {
      id: 'ALT-901',
      alert_type: 'MO Match Pattern',
      severity: 'High',
      title: 'High-Confidence MO Match: Colaba Vault (CR/0924) & Bandra Showroom (CR/1045)',
      description: 'Automated analysis identified 89% structural congruence in safe-penetration tactics, hydraulic tool signatures, and CCTV lens spray blinding between Colaba and Bandra cases.',
      target_type: 'Case',
      target_id: 'CASE-2026-1045',
      confidence: 89,
      evidence_refs: ['DOC-FORENSIC-881', 'CCTV-CLIP-BND-04', 'TOOL-MARK-ANALYSIS-CLB'],
      status: 'New',
      created_at: '2026-08-26T08:15:00Z'
    },
    {
      id: 'ALT-902',
      alert_type: 'Co-Location Detection',
      severity: 'High',
      title: 'Cell Tower Co-Presence: Farhan Merchant & Contraband Transit Route',
      description: 'Burner handset #88B2 associated with Farhan Merchant pinged the same cell tower in Dharavi within 18 minutes of the Mephedrone shipment interception.',
      target_type: 'Person',
      target_id: 'PER-1001',
      confidence: 93,
      evidence_refs: ['CDR-TOWER-DHR-90FT', 'GEO-LOC-TIMESTAMP-LOG'],
      status: 'New',
      created_at: '2026-08-25T21:40:00Z'
    },
    {
      id: 'ALT-903',
      alert_type: 'Financial Anomaly',
      severity: 'Medium',
      title: 'Rapid Outflow Spike: Apex Zenith Account -> UAE Escrow',
      description: 'Account ACC-402 transferred ₹1.85 Crore across 4 tranches to offshore accounts following the BKC shell company raid.',
      target_type: 'Account',
      target_id: 'ACC-402',
      confidence: 79,
      evidence_refs: ['FIU-STR-2026-8801', 'BANK-STATEMENT-ICICI-4419'],
      status: 'Reviewed',
      created_at: '2026-08-25T14:10:00Z'
    },
    {
      id: 'ALT-904',
      alert_type: 'Network Link Prediction',
      severity: 'Medium',
      title: 'Inferred Entity Link: Rajesh Sawant & Vikram Solanki Equipment Sourcing',
      description: 'Graph link prediction algorithm flagged 64% likelihood of shared electronic RF jammer hardware provider between auto theft and vault burglary cells.',
      target_type: 'Person',
      target_id: 'PER-1002',
      confidence: 64,
      evidence_refs: ['RF-SPECTRUM-LOG-CLB', 'SEIZED-DEVICE-OBD-06'],
      status: 'New',
      created_at: '2026-08-24T18:30:00Z'
    },
    {
      id: 'ALT-905',
      alert_type: 'Surveillance Flag',
      severity: 'Low',
      title: 'Vehicle Movement Flag: VEH-301 Sighted Near Nariman Point Legal Chambers',
      description: 'ANPR camera flagged Mercedes sedan VEH-301 parked outside Fort legal offices for 3 consecutive days during preliminary inquiry hearings.',
      target_type: 'Vehicle',
      target_id: 'VEH-301',
      confidence: 96,
      evidence_refs: ['ANPR-FRAME-FORT-012', 'TRAFFIC-CAMERA-LOG'],
      status: 'Dismissed',
      created_at: '2026-08-23T11:05:00Z'
    },
    {
      id: 'ALT-906',
      alert_type: 'SIM Activity Alert',
      severity: 'Low',
      title: 'Dormant Burner Number Activation: #33D9 (Vicky Gadget)',
      description: 'Phone PHN-206 registered activity on Kurla East BTS after 24 days of radio silence.',
      target_type: 'Phone',
      target_id: 'PHN-206',
      confidence: 84,
      evidence_refs: ['BTS-SIGNAL-KRL-EAST'],
      status: 'New',
      created_at: '2026-08-22T09:20:00Z'
    }
  ]
};

// Storage helper for persistence of alert status changes, reviews, notes
const STORAGE_KEY_ALERTS = 'sih_ciu_alerts_state';

function getStoredAlerts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return SEED_DATA.alerts;
}

function saveStoredAlerts(alerts) {
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  } catch (e) {}
}

// ============================================================================
// DATA ACCESS SERVICE API
// ============================================================================

export const dbService = {
  // --- CASES ---
  async getCases(filters = {}) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('cases').select('*').order('registered_date', { ascending: false }).limit(200);
        if (filters.category && filters.category !== 'All') {
          query = query.eq('crime_category', filters.category);
        }
        if (filters.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }
        if (filters.police_station && filters.police_station !== 'All') {
          query = query.eq('police_station', filters.police_station);
        }
        if (filters.search) {
          const q = filters.search.trim();
          query = query.or(`crime_no.ilike.%${q}%,case_no.ilike.%${q}%,crime_major_head.ilike.%${q}%,police_station.ilike.%${q}%,brief_facts.ilike.%${q}%`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getCases query notice:', err.message);
      }
    }

    let list = [...SEED_DATA.cases];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c =>
        c.crime_no.toLowerCase().includes(q) ||
        c.case_no.toLowerCase().includes(q) ||
        c.crime_category.toLowerCase().includes(q) ||
        c.crime_major_head.toLowerCase().includes(q) ||
        c.police_station.toLowerCase().includes(q) ||
        c.brief_facts.toLowerCase().includes(q)
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
  },

  async getCaseById(caseId) {
    if (isSupabaseConfigured) {
      try {
        const { data: caseItem, error: caseErr } = await supabase
          .from('cases')
          .select('*')
          .or(`id.eq.${caseId},crime_no.eq.${caseId}`)
          .maybeSingle();

        if (caseItem && !caseErr) {
          // 1. Fetch Person Case Roles & Persons
          const { data: roles } = await supabase
            .from('person_case_roles')
            .select('*, persons(*)')
            .eq('case_id', caseItem.id);

          const linkedPersons = (roles || []).map(r => ({
            ...(r.persons || { id: r.person_id, canonical_name: 'Unknown Subject', status_tag: 'Person of Interest' }),
            role_type: r.role_type
          }));

          // 2. Fetch MO Fingerprint
          const { data: moFingerprint } = await supabase
            .from('mo_fingerprints')
            .select('*')
            .eq('case_id', caseItem.id)
            .maybeSingle();

          // 3. Fetch Similar Cases
          const { data: simA } = await supabase
            .from('mo_similarities')
            .select('*, cases!mo_similarities_case_id_b_fkey(*)')
            .eq('case_id_a', caseItem.id);

          const { data: simB } = await supabase
            .from('mo_similarities')
            .select('*, cases!mo_similarities_case_id_a_fkey(*)')
            .eq('case_id_b', caseItem.id);

          let similarCases = [];
          if (simA) {
            simA.forEach(s => {
              if (s.cases) {
                similarCases.push({
                  ...s.cases,
                  similarity_score: s.similarity_score,
                  matching_components: s.matching_components
                });
              }
            });
          }
          if (simB) {
            simB.forEach(s => {
              if (s.cases) {
                similarCases.push({
                  ...s.cases,
                  similarity_score: s.similarity_score,
                  matching_components: s.matching_components
                });
              }
            });
          }
          similarCases.sort((a, b) => b.similarity_score - a.similarity_score);

          // 4. Fetch Evidence items
          const { data: evidenceItems } = await supabase
            .from('evidence')
            .select('*')
            .eq('source_id', caseItem.id);

          // 5. Fetch Events
          const { data: timelineEvents } = await supabase
            .from('events')
            .select('*')
            .eq('case_id', caseItem.id)
            .order('event_time', { ascending: false });

          return {
            ...caseItem,
            linkedPersons,
            moFingerprint: moFingerprint || null,
            similarCases,
            evidenceItems: evidenceItems || [],
            timelineEvents: timelineEvents || []
          };
        }
      } catch (err) {
        console.warn('Supabase getCaseById query notice:', err.message);
      }
    }

    const caseItem = SEED_DATA.cases.find(c => c.id === caseId || c.crime_no === caseId);
    if (!caseItem) return null;

    // Fetch related roles and persons
    const roles = SEED_DATA.person_case_roles.filter(r => r.case_id === caseItem.id);
    const linkedPersons = roles.map(r => {
      const p = SEED_DATA.persons.find(per => per.id === r.person_id);
      return { ...p, role_type: r.role_type };
    });

    // Fetch linked phones and vehicles
    const personIds = linkedPersons.map(p => p.id);
    const linkedPhones = SEED_DATA.phones.filter(ph => personIds.includes(ph.owner_person_id));
    const linkedVehicles = SEED_DATA.vehicles.filter(v => personIds.includes(v.owner_person_id));
    const linkedAccounts = SEED_DATA.accounts.filter(a => personIds.includes(a.owner_person_id));

    // Fetch MO Fingerprint
    const moFingerprint = SEED_DATA.mo_fingerprints.find(mo => mo.case_id === caseItem.id) || null;

    // Fetch Similar Cases
    const simPairs = SEED_DATA.mo_similarities.filter(
      s => s.case_id_a === caseItem.id || s.case_id_b === caseItem.id
    );
    const similarCases = simPairs.map(sim => {
      const otherId = sim.case_id_a === caseItem.id ? sim.case_id_b : sim.case_id_a;
      const otherCase = SEED_DATA.cases.find(c => c.id === otherId);
      return {
        ...otherCase,
        similarity_score: sim.similarity_score,
        matching_components: sim.matching_components
      };
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    // Fetch timeline events
    const timelineEvents = SEED_DATA.events.filter(e => e.case_id === caseItem.id);

    return {
      ...caseItem,
      linkedPersons,
      linkedPhones,
      linkedVehicles,
      linkedAccounts,
      moFingerprint,
      similarCases,
      timelineEvents
    };
  },

  // --- PERSONS / ENTITIES ---
  async getPersons(filters = {}) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('persons')
          .select('*, person_case_roles(case_id, role_type, cases(crime_no, police_station, status))')
          .limit(80);

        if (filters.search) {
          const q = filters.search.trim();
          query = query.or(`canonical_name.ilike.%${q}%,id.ilike.%${q}%`);
        } else if (filters.status_tag && filters.status_tag !== 'All') {
          query = query.eq('status_tag', filters.status_tag);
        } else {
          // Default: order by confidence score to prioritize verified/investigated individuals
          query = query.order('confidence_score', { ascending: false });
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(p => {
            const roles = p.person_case_roles || [];
            const primaryRole = roles.length > 0 ? roles[0].role_type : p.status_tag;
            return {
              ...p,
              caseCount: roles.length,
              primaryRole,
              linkedCases: roles.map(r => ({
                ...(r.cases || { crime_no: r.case_id, police_station: 'CIU Jurisdiction' }),
                role_type: r.role_type
              }))
            };
          });
        }
      } catch (err) {
        console.warn('Supabase getPersons notice:', err.message);
      }
    }

    let list = [...SEED_DATA.persons];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p =>
        p.canonical_name.toLowerCase().includes(q) ||
        p.aliases.some(a => a.toLowerCase().includes(q)) ||
        p.status_tag.toLowerCase().includes(q)
      );
    }
    if (filters.status_tag && filters.status_tag !== 'All') {
      list = list.filter(p => p.status_tag === filters.status_tag);
    }
    return list;
  },

  async getPersonById(personId) {
    if (isSupabaseConfigured) {
      try {
        // 1. Fetch Person Record
        const { data: person, error: pErr } = await supabase
          .from('persons')
          .select('*')
          .or(`id.eq.${personId},canonical_name.eq.${personId}`)
          .maybeSingle();

        if (person && !pErr) {
          const pId = person.id;

          // 2. Fetch Relational Data Concurrently
          const [
            rolesRes,
            phonesRes,
            vehiclesRes,
            accountsRes,
            relsRes,
            eventsRes
          ] = await Promise.all([
            supabase.from('person_case_roles').select('*, cases(*)').eq('person_id', pId),
            supabase.from('phones').select('*').eq('owner_person_id', pId),
            supabase.from('vehicles').select('*').eq('owner_person_id', pId),
            supabase.from('accounts').select('*').eq('owner_person_id', pId),
            supabase.from('relationships').select('*').or(`source_id.eq.${pId},target_id.eq.${pId}`),
            supabase.from('events').select('*').eq('person_id', pId).order('event_time', { ascending: false })
          ]);

          const linkedCases = (rolesRes.data || []).map(r => ({
            ...(r.cases || { id: r.case_id, crime_no: r.case_id, police_station: 'Jurisdiction Unknown' }),
            role_type: r.role_type
          }));

          // Resolve target entities for relationships
          const relationships = (relsRes.data || []).map(r => {
            const isSource = r.source_id === pId;
            const otherId = isSource ? r.target_id : r.source_id;
            const otherType = isSource ? r.target_type : r.source_type;
            return {
              ...r,
              targetEntity: { id: otherId, canonical_name: otherId, status_tag: otherType },
              isOutgoing: isSource
            };
          });

          return {
            ...person,
            linkedCases,
            linkedPhones: phonesRes.data || [],
            linkedVehicles: vehiclesRes.data || [],
            linkedAccounts: accountsRes.data || [],
            relationships,
            events: eventsRes.data || []
          };
        }
      } catch (err) {
        console.warn('Supabase getPersonById notice:', err.message);
      }
    }

    const person = SEED_DATA.persons.find(p => p.id === personId || p.canonical_name === personId);
    if (!person) return null;

    // Linked cases
    const roles = SEED_DATA.person_case_roles.filter(r => r.person_id === person.id);
    const linkedCases = roles.map(r => {
      const c = SEED_DATA.cases.find(caseItem => caseItem.id === r.case_id);
      return { ...c, role_type: r.role_type };
    });

    // Linked assets
    const linkedPhones = SEED_DATA.phones.filter(ph => ph.owner_person_id === person.id);
    const linkedVehicles = SEED_DATA.vehicles.filter(v => v.owner_person_id === person.id);
    const linkedAccounts = SEED_DATA.accounts.filter(a => a.owner_person_id === person.id);

    // Relationships (source or target)
    const rels = SEED_DATA.relationships.filter(
      r => (r.source_id === person.id && r.source_type === 'Person') ||
           (r.target_id === person.id && r.target_type === 'Person')
    );

    const detailedRelationships = rels.map(r => {
      const isSource = r.source_id === person.id;
      const otherId = isSource ? r.target_id : r.source_id;
      const otherType = isSource ? r.target_type : r.source_type;
      let targetEntity = null;
      if (otherType === 'Person') targetEntity = SEED_DATA.persons.find(p => p.id === otherId);
      else if (otherType === 'Organization') targetEntity = SEED_DATA.organizations.find(o => o.id === otherId);

      return {
        ...r,
        targetEntity,
        isOutgoing: isSource
      };
    });

    // Timeline Events
    const events = SEED_DATA.events.filter(e => e.person_id === person.id).sort(
      (a, b) => new Date(b.event_time) - new Date(a.event_time)
    );

    return {
      ...person,
      linkedCases,
      linkedPhones,
      linkedVehicles,
      linkedAccounts,
      relationships: detailedRelationships,
      events
    };
  },

  // --- KNOWLEDGE GRAPH ---
  async getKnowledgeGraphData(filters = { minConfidence: 0, entityTypes: [], relationshipTypes: [], provenance: 'All' }) {
    const nodes = [];
    const nodeMap = new Set();

    // 1. Persons
    SEED_DATA.persons.forEach(p => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Person')) {
        const events = SEED_DATA.events.filter(e => e.person_id === p.id);
        const roles = SEED_DATA.person_case_roles.filter(r => r.person_id === p.id);
        const cases = roles.map(r => SEED_DATA.cases.find(c => c.id === r.case_id)).filter(Boolean);

        nodes.push({
          id: p.id,
          label: p.canonical_name,
          shortLabel: p.canonical_name.split(' ')[0], // e.g. "Farhan", "Rajesh"
          type: 'Person',
          typeCode: 'PER',
          subtext: p.status_tag,
          confidence: p.confidence_score,
          aliases: p.aliases,
          photo_url: p.photo_url,
          dob: p.dob,
          gender: p.gender,
          events: events,
          cases: cases,
          importance: p.status_tag === 'Key Suspect' ? 3 : p.status_tag === 'Accused' ? 2 : 1
        });
        nodeMap.add(p.id);
      }
    });

    // 2. Phones
    SEED_DATA.phones.forEach(ph => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Phone')) {
        const owner = SEED_DATA.persons.find(p => p.id === ph.owner_person_id);
        const shortNum = ph.normalized_number_hash.split(' ')[0].replace('+91-', '').slice(0, 5) + '...';

        nodes.push({
          id: ph.id,
          label: ph.normalized_number_hash,
          shortLabel: shortNum,
          type: 'Phone',
          typeCode: 'PH',
          subtext: ph.service_provider,
          confidence: 90,
          owner: owner?.canonical_name || 'Unknown',
          first_seen: ph.first_seen,
          last_seen: ph.last_seen,
          importance: 1
        });
        nodeMap.add(ph.id);
      }
    });

    // 3. Vehicles
    SEED_DATA.vehicles.forEach(v => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Vehicle')) {
        const owner = SEED_DATA.persons.find(p => p.id === v.owner_person_id);
        const shortModel = v.make_model.split(' ')[0];

        nodes.push({
          id: v.id,
          label: `${v.make_model} (${v.registration_hash})`,
          shortLabel: shortModel,
          type: 'Vehicle',
          typeCode: 'VEH',
          subtext: v.vehicle_type,
          confidence: 95,
          color: v.color,
          owner: owner?.canonical_name || 'Unknown',
          importance: 1
        });
        nodeMap.add(v.id);
      }
    });

    // 4. Accounts
    SEED_DATA.accounts.forEach(a => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Account')) {
        const owner = SEED_DATA.persons.find(p => p.id === a.owner_person_id);
        const shortAcc = a.account_hash.split(' ')[0];

        nodes.push({
          id: a.id,
          label: a.account_hash,
          shortLabel: shortAcc,
          type: 'Account',
          typeCode: 'ACC',
          subtext: a.institution_type,
          confidence: 88,
          risk: a.risk_level,
          owner: owner?.canonical_name || 'Unknown',
          importance: 1
        });
        nodeMap.add(a.id);
      }
    });

    // 5. Organizations
    SEED_DATA.organizations.forEach(o => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Organization')) {
        nodes.push({
          id: o.id,
          label: o.name,
          shortLabel: o.name.split(' ')[0],
          type: 'Organization',
          typeCode: 'ORG',
          subtext: o.type,
          jurisdiction: o.jurisdiction,
          confidence: 92,
          importance: 2
        });
        nodeMap.add(o.id);
      }
    });

    // 6. Cases (FIRs)
    SEED_DATA.cases.forEach(c => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Case')) {
        const shortCrimeNo = c.crime_no.split('/')[2] || c.crime_no;

        nodes.push({
          id: c.id,
          label: c.crime_no,
          shortLabel: shortCrimeNo,
          type: 'Case',
          typeCode: 'FIR',
          subtext: c.crime_major_head,
          category: c.crime_category,
          station: c.police_station,
          confidence: 100,
          status: c.status,
          registered_date: c.registered_date,
          importance: 3
        });
        nodeMap.add(c.id);
      }
    });

    // 7. Locations
    (SEED_DATA.locations || []).forEach(loc => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Location')) {
        nodes.push({
          id: loc.id,
          label: loc.name,
          shortLabel: loc.name.split(' ')[0],
          type: 'Location',
          typeCode: 'LOC',
          subtext: loc.type,
          jurisdiction: loc.jurisdiction,
          confidence: 95,
          importance: 1
        });
        nodeMap.add(loc.id);
      }
    });

    // 8. Devices
    (SEED_DATA.devices || []).forEach(dev => {
      if (!filters.entityTypes || filters.entityTypes.length === 0 || filters.entityTypes.includes('Device')) {
        nodes.push({
          id: dev.id,
          label: dev.name,
          shortLabel: dev.type.split(' ')[0],
          type: 'Device',
          typeCode: 'DEV',
          subtext: dev.type,
          specs: dev.specs,
          confidence: 96,
          importance: 1
        });
        nodeMap.add(dev.id);
      }
    });

    // 9. Edges & Relationships
    const edges = [];

    // Explicit Relationships
    SEED_DATA.relationships.forEach(r => {
      if (r.confidence >= (filters.minConfidence || 0)) {
        if (nodeMap.has(r.source_id) && nodeMap.has(r.target_id)) {
          if (filters.provenance === 'Observed Only' && r.status !== 'observed') return;
          if (filters.provenance === 'AI-Inferred Only' && r.status !== 'inferred') return;

          let verb = 'ASSOCIATED_WITH';
          if (r.relationship_type.includes('Financial') || r.relationship_type.includes('Mule')) verb = 'TRANSACTS_WITH';
          else if (r.relationship_type.includes('Controller') || r.relationship_type.includes('Shareholder')) verb = 'MEMBER_OF';
          else if (r.relationship_type.includes('Recce') || r.relationship_type.includes('Conduit')) verb = 'CALLS';
          else if (r.relationship_type.includes('Supplier') || r.relationship_type.includes('Workshop')) verb = 'USES';

          edges.push({
            id: r.id,
            source: r.source_id,
            target: r.target_id,
            verb: verb,
            label: verb,
            detailLabel: r.relationship_type,
            confidence: r.confidence,
            status: r.status,
            first_seen: r.first_seen,
            last_seen: r.last_seen,
            frequency: '14 Interactions logged',
            evidence: r.source_evidence,
            model_version: r.status === 'inferred' ? 'CIU-LinkPrediction-v2.1' : null
          });
        }
      }
    });

    // Ownership links (Person -> Phone)
    SEED_DATA.phones.forEach(ph => {
      if (ph.owner_person_id && nodeMap.has(ph.owner_person_id) && nodeMap.has(ph.id)) {
        if (filters.provenance !== 'AI-Inferred Only') {
          edges.push({
            id: `OWN-PHN-${ph.id}`,
            source: ph.owner_person_id,
            target: ph.id,
            verb: 'OWNS',
            label: 'OWNS',
            detailLabel: 'Associated Phone Subscriber',
            confidence: 95,
            status: 'observed',
            first_seen: ph.first_seen,
            last_seen: ph.last_seen,
            frequency: 'Daily Activity',
            evidence: 'Telecom CDR subscriber registration records'
          });
        }
      }
    });

    // Ownership links (Person -> Vehicle)
    SEED_DATA.vehicles.forEach(v => {
      if (v.owner_person_id && nodeMap.has(v.owner_person_id) && nodeMap.has(v.id)) {
        if (filters.provenance !== 'AI-Inferred Only') {
          edges.push({
            id: `OWN-VEH-${v.id}`,
            source: v.owner_person_id,
            target: v.id,
            verb: 'OWNS',
            label: 'OWNS',
            detailLabel: 'Registered Vehicle Owner / User',
            confidence: 98,
            status: 'observed',
            first_seen: '2025-01-01',
            last_seen: '2026-08-20',
            frequency: 'Regular commute logged',
            evidence: 'RTO vehicle registration and FASTag registry record'
          });
        }
      }
    });

    // Ownership links (Person -> Account)
    SEED_DATA.accounts.forEach(a => {
      if (a.owner_person_id && nodeMap.has(a.owner_person_id) && nodeMap.has(a.id)) {
        if (filters.provenance !== 'AI-Inferred Only') {
          edges.push({
            id: `OWN-ACC-${a.id}`,
            source: a.owner_person_id,
            target: a.id,
            verb: 'OWNS',
            label: 'OWNS',
            detailLabel: 'Account Signatory & Beneficial Owner',
            confidence: 96,
            status: 'observed',
            first_seen: '2024-06-01',
            last_seen: '2026-08-22',
            frequency: '38 Transactions recorded',
            evidence: 'Bank KYC mandate & FIU transaction report'
          });
        }
      }
    });

    // Person to Case Role links
    SEED_DATA.person_case_roles.forEach(r => {
      if (nodeMap.has(r.person_id) && nodeMap.has(r.case_id)) {
        if (filters.provenance !== 'AI-Inferred Only') {
          edges.push({
            id: `ROLE-${r.id}`,
            source: r.person_id,
            target: r.case_id,
            verb: 'INVOLVED_IN',
            label: 'INVOLVED_IN',
            detailLabel: `Named ${r.role_type} in FIR`,
            confidence: 92,
            status: 'observed',
            first_seen: '2026-01-01',
            last_seen: '2026-08-20',
            frequency: 'Primary case filing',
            evidence: 'FIR chargesheet and police investigation record'
          });
        }
      }
    });

    // Location Sighting links
    if (nodeMap.has('PER-1002') && nodeMap.has('LOC-601')) {
      edges.push({
        id: 'LOC-REL-01',
        source: 'PER-1002',
        target: 'LOC-601',
        verb: 'SEEN_AT',
        label: 'SEEN_AT',
        detailLabel: 'Colaba Vault Physical Breach Site',
        confidence: 94,
        status: 'observed',
        first_seen: '2026-08-02',
        last_seen: '2026-08-02',
        frequency: '1 Incident Sighting',
        evidence: 'CCTV perimeter footage & tower triangulation'
      });
    }

    if (nodeMap.has('PER-1005') && nodeMap.has('LOC-603')) {
      edges.push({
        id: 'LOC-REL-02',
        source: 'PER-1005',
        target: 'LOC-603',
        verb: 'SEEN_AT',
        label: 'SEEN_AT',
        detailLabel: 'Dharavi Transit Godown Sighting',
        confidence: 96,
        status: 'observed',
        first_seen: '2026-06-20',
        last_seen: '2026-06-20',
        frequency: 'Arrest recovery locus',
        evidence: 'On-scene seizure panchnama memo'
      });
    }

    // Device Links
    if (nodeMap.has('PER-1006') && nodeMap.has('DEV-701')) {
      edges.push({
        id: 'DEV-REL-01',
        source: 'PER-1006',
        target: 'DEV-701',
        verb: 'USES',
        label: 'USES',
        detailLabel: 'Electronic Jammer Hardware Operator',
        confidence: 90,
        status: 'observed',
        first_seen: '2026-03-30',
        last_seen: '2026-08-01',
        frequency: 'Seized equipment inventory',
        evidence: 'Forensic digital device recovery report'
      });
    }

    // Apply relationship type filter if specified
    let filteredEdges = edges;
    if (filters.relationshipTypes && filters.relationshipTypes.length > 0 && !filters.relationshipTypes.includes('All')) {
      filteredEdges = edges.filter(e => filters.relationshipTypes.includes(e.verb));
    }

    return { nodes, edges: filteredEdges };
  },

  // --- CASE-SCOPED GEOSPATIAL INTELLIGENCE NETWORK ---
  async getCaseIntelligenceNetwork(caseId, filters = { minConfidence: 0, provenance: 'All' }) {
    const cases = SEED_DATA.cases;
    const targetCase = cases.find(c => c.id === caseId || c.crime_no === caseId) || cases[0];
    if (!targetCase) return { caseData: null, nodes: [], edges: [], unplacedNodes: [] };

    const caseLat = targetCase.latitude || 19.0760;
    const caseLng = targetCase.longitude || 72.8777;

    // 1. Roles & Linked Persons in this case
    const caseRoles = SEED_DATA.person_case_roles.filter(r => r.case_id === targetCase.id);
    const linkedPersonIds = new Set(caseRoles.map(r => r.person_id));

    // Also include persons connected via high-confidence relationships to primary accused
    SEED_DATA.relationships.forEach(r => {
      if (linkedPersonIds.has(r.source_id) && r.target_type === 'Person') linkedPersonIds.add(r.target_id);
      if (linkedPersonIds.has(r.target_id) && r.source_type === 'Person') linkedPersonIds.add(r.source_id);
    });

    const persons = SEED_DATA.persons.filter(p => linkedPersonIds.has(p.id));

    // 2. Events in this case
    const caseEvents = SEED_DATA.events.filter(e => e.case_id === targetCase.id || linkedPersonIds.has(e.person_id));

    // 3. Assets linked to these persons
    const phones = SEED_DATA.phones.filter(ph => linkedPersonIds.has(ph.owner_person_id));
    const vehicles = SEED_DATA.vehicles.filter(v => linkedPersonIds.has(v.owner_person_id));
    const accounts = SEED_DATA.accounts.filter(a => linkedPersonIds.has(a.owner_person_id));
    const organizations = (SEED_DATA.organizations || []).slice(0, 2);
    const locations = (SEED_DATA.locations || []).filter(l => l.jurisdiction.toLowerCase().includes(targetCase.police_station.split(' ')[0].toLowerCase()) || true).slice(0, 1);
    const devices = (SEED_DATA.devices || []).slice(0, 1);

    const nodes = [];
    const nodeMap = new Map();
    const unplacedNodes = [];

    // Add Case Pin (Anchor)
    const caseNode = {
      id: targetCase.id,
      label: targetCase.crime_no,
      shortLabel: targetCase.crime_no.split('/')[2] || targetCase.crime_no,
      type: 'Case',
      typeCode: 'FIR',
      subtext: `${targetCase.police_station} • ${targetCase.crime_major_head}`,
      category: targetCase.crime_category,
      station: targetCase.police_station,
      status: targetCase.status,
      confidence: 100,
      lat: caseLat,
      lng: caseLng,
      registered_date: targetCase.registered_date,
      brief_facts: targetCase.brief_facts,
      isFocal: true
    };
    nodes.push(caseNode);
    nodeMap.set(caseNode.id, caseNode);

    // Add Persons with deterministic spatial layout around case / events
    persons.forEach((p, idx) => {
      const role = caseRoles.find(r => r.person_id === p.id)?.role_type || p.status_tag;
      const associatedEvent = caseEvents.find(e => e.person_id === p.id);

      let pLat, pLng;
      if (associatedEvent && associatedEvent.latitude && associatedEvent.longitude) {
        pLat = associatedEvent.latitude + (idx % 2 === 0 ? 0.0015 : -0.0015);
        pLng = associatedEvent.longitude + (idx % 2 === 0 ? 0.0018 : -0.0018);
      } else {
        const angle = (idx / Math.max(1, persons.length)) * 2 * Math.PI;
        pLat = caseLat + 0.0045 * Math.sin(angle);
        pLng = caseLng + 0.0055 * Math.cos(angle);
      }

      const pNode = {
        id: p.id,
        label: p.canonical_name,
        shortLabel: p.canonical_name.split(' ')[0],
        type: 'Person',
        typeCode: 'PER',
        subtext: role,
        role_type: role,
        confidence: p.confidence_score,
        aliases: p.aliases,
        photo_url: p.photo_url,
        dob: p.dob,
        gender: p.gender,
        lat: pLat,
        lng: pLng,
        events: caseEvents.filter(e => e.person_id === p.id)
      };
      nodes.push(pNode);
      nodeMap.set(pNode.id, pNode);
    });

    // Add Phones (pinned near their owner)
    phones.forEach((ph, idx) => {
      const owner = nodeMap.get(ph.owner_person_id);
      const baseLat = owner ? owner.lat : caseLat;
      const baseLng = owner ? owner.lng : caseLng;
      const angle = ((idx + 1) / Math.max(1, phones.length)) * 2 * Math.PI;

      const phNode = {
        id: ph.id,
        label: ph.normalized_number_hash,
        shortLabel: ph.normalized_number_hash.split(' ')[0].replace('+91-', '').slice(0, 6),
        type: 'Phone',
        typeCode: 'PH',
        subtext: ph.service_provider,
        confidence: 92,
        owner: owner?.label || 'Associated Subject',
        lat: baseLat + 0.002 * Math.sin(angle),
        lng: baseLng + 0.0025 * Math.cos(angle),
        first_seen: ph.first_seen,
        last_seen: ph.last_seen
      };
      nodes.push(phNode);
      nodeMap.set(phNode.id, phNode);
    });

    // Add Vehicles (pinned near their owner)
    vehicles.forEach((v, idx) => {
      const owner = nodeMap.get(v.owner_person_id);
      const baseLat = owner ? owner.lat : caseLat;
      const baseLng = owner ? owner.lng : caseLng;
      const angle = ((idx + 2) / Math.max(1, vehicles.length)) * 2 * Math.PI + 0.5;

      const vNode = {
        id: v.id,
        label: `${v.make_model} (${v.registration_hash})`,
        shortLabel: v.make_model.split(' ')[0],
        type: 'Vehicle',
        typeCode: 'VEH',
        subtext: v.vehicle_type,
        confidence: 96,
        color: v.color,
        owner: owner?.label || 'Associated Subject',
        lat: baseLat + 0.0025 * Math.sin(angle),
        lng: baseLng + 0.0028 * Math.cos(angle)
      };
      nodes.push(vNode);
      nodeMap.set(vNode.id, vNode);
    });

    // Add Accounts
    accounts.forEach((a, idx) => {
      const owner = nodeMap.get(a.owner_person_id);
      const baseLat = owner ? owner.lat : caseLat;
      const baseLng = owner ? owner.lng : caseLng;
      const angle = ((idx + 3) / Math.max(1, accounts.length)) * 2 * Math.PI + 1.0;

      const aNode = {
        id: a.id,
        label: a.account_hash,
        shortLabel: a.account_hash.split(' ')[0],
        type: 'Account',
        typeCode: 'ACC',
        subtext: a.institution_type,
        confidence: 89,
        risk: a.risk_level,
        owner: owner?.label || 'Associated Subject',
        lat: baseLat + 0.0022 * Math.sin(angle),
        lng: baseLng + 0.0024 * Math.cos(angle)
      };
      nodes.push(aNode);
      nodeMap.set(aNode.id, aNode);
    });

    // Add Organizations
    organizations.forEach((o, idx) => {
      const oNode = {
        id: o.id,
        label: o.name,
        shortLabel: o.name.split(' ')[0],
        type: 'Organization',
        typeCode: 'ORG',
        subtext: o.type,
        jurisdiction: o.jurisdiction,
        confidence: 92,
        lat: caseLat + 0.0035 * (idx === 0 ? 1 : -1),
        lng: caseLng + 0.0045 * (idx === 0 ? 1 : -1)
      };
      nodes.push(oNode);
      nodeMap.set(oNode.id, oNode);
    });

    // Add Events / Locations
    caseEvents.forEach((evt, idx) => {
      if (evt.latitude && evt.longitude) {
        const evtNode = {
          id: evt.id,
          label: evt.event_type,
          shortLabel: evt.event_type.split(' ')[0],
          type: 'Location',
          typeCode: 'LOC',
          subtext: evt.location_text,
          confidence: 98,
          lat: evt.latitude,
          lng: evt.longitude,
          event_time: evt.event_time,
          description: evt.description
        };
        nodes.push(evtNode);
        nodeMap.set(evtNode.id, evtNode);
      }
    });

    // 4. Case-Scoped Relationship Lines (Edges)
    const edges = [];

    // Role links: Person -> Case
    caseRoles.forEach(r => {
      const pNode = nodeMap.get(r.person_id);
      if (pNode) {
        edges.push({
          id: `ROLE-${r.id}`,
          source: pNode.id,
          target: caseNode.id,
          sourceCoords: [pNode.lat, pNode.lng],
          targetCoords: [caseNode.lat, caseNode.lng],
          verb: 'INVOLVED_IN',
          label: 'INVOLVED_IN',
          detailLabel: `Named ${r.role_type} in FIR`,
          status: 'observed',
          confidence: 95,
          evidence: `Formally recorded under chargesheet of ${targetCase.crime_no}`
        });
      }
    });

    // Explicit Person-to-Person & Person-to-Org Relationships
    SEED_DATA.relationships.forEach(r => {
      const src = nodeMap.get(r.source_id);
      const tgt = nodeMap.get(r.target_id);

      if (src && tgt) {
        if (filters.provenance === 'Observed Only' && r.status !== 'observed') return;
        if (filters.provenance === 'AI-Inferred Only' && r.status !== 'inferred') return;
        if (r.confidence < (filters.minConfidence || 0)) return;

        let verb = 'ASSOCIATED_WITH';
        if (r.relationship_type.includes('Financial') || r.relationship_type.includes('Mule')) verb = 'TRANSACTS_WITH';
        else if (r.relationship_type.includes('Controller') || r.relationship_type.includes('Shareholder')) verb = 'MEMBER_OF';
        else if (r.relationship_type.includes('Recce') || r.relationship_type.includes('Conduit')) verb = 'CALLS';
        else if (r.relationship_type.includes('Supplier') || r.relationship_type.includes('Workshop')) verb = 'USES';

        edges.push({
          id: r.id,
          source: src.id,
          target: tgt.id,
          sourceCoords: [src.lat, src.lng],
          targetCoords: [tgt.lat, tgt.lng],
          verb: verb,
          label: verb,
          detailLabel: r.relationship_type,
          status: r.status,
          confidence: r.confidence,
          first_seen: r.first_seen,
          last_seen: r.last_seen,
          evidence: r.source_evidence,
          model_version: r.status === 'inferred' ? 'CIU-LinkPrediction-v2.1' : null
        });
      }
    });

    // Asset ownership links: Person -> Phone/Vehicle/Account
    phones.forEach(ph => {
      const pNode = nodeMap.get(ph.owner_person_id);
      const phNode = nodeMap.get(ph.id);
      if (pNode && phNode && filters.provenance !== 'AI-Inferred Only') {
        edges.push({
          id: `OWN-${ph.id}`,
          source: pNode.id,
          target: phNode.id,
          sourceCoords: [pNode.lat, pNode.lng],
          targetCoords: [phNode.lat, phNode.lng],
          verb: 'OWNS',
          label: 'OWNS',
          detailLabel: 'Subscriber registration record',
          status: 'observed',
          confidence: 95,
          evidence: 'Telecom CDR subscriber KYC extract'
        });
      }
    });

    vehicles.forEach(v => {
      const pNode = nodeMap.get(v.owner_person_id);
      const vNode = nodeMap.get(v.id);
      if (pNode && vNode && filters.provenance !== 'AI-Inferred Only') {
        edges.push({
          id: `OWN-${v.id}`,
          source: pNode.id,
          target: vNode.id,
          sourceCoords: [pNode.lat, pNode.lng],
          targetCoords: [vNode.lat, vNode.lng],
          verb: 'OWNS',
          label: 'OWNS',
          detailLabel: 'RTO Vehicle Registration Record',
          status: 'observed',
          confidence: 98,
          evidence: 'FASTag and RTO registration certificate'
        });
      }
    });

    accounts.forEach(a => {
      const pNode = nodeMap.get(a.owner_person_id);
      const aNode = nodeMap.get(a.id);
      if (pNode && aNode && filters.provenance !== 'AI-Inferred Only') {
        edges.push({
          id: `OWN-${a.id}`,
          source: pNode.id,
          target: aNode.id,
          sourceCoords: [pNode.lat, pNode.lng],
          targetCoords: [aNode.lat, aNode.lng],
          verb: 'OWNS',
          label: 'OWNS',
          detailLabel: 'Account Signatory Mandate',
          status: 'observed',
          confidence: 96,
          evidence: 'Bank KYC mandate & FIU transaction records'
        });
      }
    });

    // Event connections
    caseEvents.forEach(evt => {
      const evtNode = nodeMap.get(evt.id);
      const pNode = nodeMap.get(evt.person_id);
      if (evtNode && pNode) {
        edges.push({
          id: `EVT-LINK-${evt.id}`,
          source: pNode.id,
          target: evtNode.id,
          sourceCoords: [pNode.lat, pNode.lng],
          targetCoords: [evtNode.lat, evtNode.lng],
          verb: 'SEEN_AT',
          label: 'SEEN_AT',
          detailLabel: evt.event_type,
          status: 'observed',
          confidence: 98,
          evidence: evt.description
        });
      }
    });

    return {
      caseData: targetCase,
      nodes,
      edges,
      unplacedNodes
    };
  },

  // --- ALERTS ---
  async getAlerts(filters = {}) {
    let list = getStoredAlerts();
    if (filters.severity && filters.severity !== 'All') {
      list = list.filter(a => a.severity === filters.severity);
    }
    if (filters.status && filters.status !== 'All') {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.alert_type.toLowerCase().includes(q) ||
        a.target_id.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async updateAlertStatus(alertId, newStatus) {
    const currentAlerts = getStoredAlerts();
    const idx = currentAlerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      currentAlerts[idx] = { ...currentAlerts[idx], status: newStatus };
      saveStoredAlerts(currentAlerts);
      return currentAlerts[idx];
    }
    return null;
  },

  // --- MO SIMILARITIES ---
  async getMOSimilarities(caseId = null) {
    const cases = SEED_DATA.cases;
    const fps = SEED_DATA.mo_fingerprints;
    const sims = SEED_DATA.mo_similarities;

    let selectedCase = null;
    if (caseId) {
      selectedCase = cases.find(c => c.id === caseId || c.crime_no === caseId);
    }
    if (!selectedCase && cases.length > 0) {
      selectedCase = cases[1]; // default to Colaba Vault case
    }

    const selectedFP = fps.find(fp => fp.case_id === selectedCase.id) || null;

    // Find ranked matches
    const relatedSims = sims.filter(s => s.case_id_a === selectedCase.id || s.case_id_b === selectedCase.id);
    const rankedMatches = relatedSims.map(s => {
      const otherId = s.case_id_a === selectedCase.id ? s.case_id_b : s.case_id_a;
      const otherCase = cases.find(c => c.id === otherId);
      const otherFP = fps.find(fp => fp.case_id === otherId);
      return {
        case: otherCase,
        fingerprint: otherFP,
        similarity_score: s.similarity_score,
        matching_components: s.matching_components
      };
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    return {
      allCases: cases,
      selectedCase,
      selectedFP,
      rankedMatches
    };
  },

  // --- DASHBOARD METRICS ---
  async getDashboardMetrics() {
    const cases = SEED_DATA.cases;
    const persons = SEED_DATA.persons;
    const alerts = getStoredAlerts();
    const activeCases = cases.filter(c => c.status !== 'Closed').length;
    const openAlerts = alerts.filter(a => a.status === 'New').length;
    const highSeverityAlerts = alerts.filter(a => a.severity === 'High' && a.status === 'New').length;
    const entitiesTracked = persons.length + SEED_DATA.phones.length + SEED_DATA.vehicles.length + SEED_DATA.accounts.length;

    const recentAlerts = alerts.slice(0, 5);

    // AI Inferred Findings
    const aiFindings = [
      {
        id: 'FND-01',
        icon: 'network',
        finding: 'Transit Hub Cluster: Bandra & Dharavi networks share common logistics conduit',
        confidence: 88,
        evidence: '3 mutual burner SIM hops & Charoti toll plaza FASTag correlations',
        caseId: 'CASE-2026-0811'
      },
      {
        id: 'FND-02',
        icon: 'tool',
        finding: 'Safe-Cracking Signature: Pneumatic shear & RF jammer signature identical in Colaba and Bandra',
        confidence: 89,
        evidence: 'Tool mark striations & RF spectrum sweep records match within 0.05mm tolerance',
        caseId: 'CASE-2026-0924'
      },
      {
        id: 'FND-03',
        icon: 'dollar',
        finding: 'Mule Layering Velocity: ₹4.8Cr drained across 38 accounts routed through Nariman Point shell advisory',
        confidence: 91,
        evidence: 'FIU-IND Suspicious Transaction Report #STR-8801',
        caseId: 'CASE-2026-0615'
      }
    ];

    // Hotspot zones on Mumbai map
    const hotspots = [
      { id: 'HS-01', name: 'Bandra-BKC Corridor', count: 4, type: 'Financial & Safe Breach', lat: 19.0600, lng: 72.8360, severity: 'High', x: 48, y: 38 },
      { id: 'HS-02', name: 'Colaba - Fort District', count: 3, type: 'Vault & Cyber Shell', lat: 18.9220, lng: 72.8347, severity: 'High', x: 42, y: 88 },
      { id: 'HS-03', name: 'Dharavi - Sion Transit Hub', count: 2, type: 'Contraband Movement', lat: 19.0434, lng: 72.8567, severity: 'Medium', x: 55, y: 46 },
      { id: 'HS-04', name: 'Andheri MIDC - SEEPZ', count: 3, type: 'Cyber SIM Hijack & Crypto', lat: 19.1136, lng: 72.8697, severity: 'High', x: 58, y: 24 },
      { id: 'HS-05', name: 'Kurla CST Road Belts', count: 2, type: 'Auto Theft Dismantling', lat: 19.0726, lng: 72.8845, severity: 'Medium', x: 62, y: 40 },
      { id: 'HS-06', name: 'Worli Sea-Face Commercial', count: 1, type: 'Extortion VoIP Traces', lat: 19.0178, lng: 72.8178, severity: 'Low', x: 38, y: 62 }
    ];

    return {
      activeCases,
      openAlerts,
      highSeverityAlerts,
      entitiesTracked,
      recentAlerts,
      aiFindings,
      hotspots
    };
  },

  // --- CASE CANVAS INVESTIGATIVE WHITEBOARD ---
  async getCaseCanvas(caseId) {
    const storageKey = `ciu_canvas_${caseId}`;

    // 1. If Supabase is configured, fetch directly from Supabase first
    if (isSupabaseConfigured) {
      try {
        const { data: canvas, error: canvasErr } = await supabase
          .from('case_canvases')
          .select('*')
          .eq('case_id', caseId)
          .maybeSingle();

        if (canvas && !canvasErr) {
          const { data: dbNodes } = await supabase
            .from('canvas_nodes')
            .select('*')
            .eq('canvas_id', canvas.id);

          const { data: dbEdges } = await supabase
            .from('canvas_edges')
            .select('*')
            .eq('canvas_id', canvas.id);

          if (dbNodes && dbNodes.length > 0) {
            const formattedNodes = dbNodes.map(n => ({
              id: n.id,
              type: n.node_type,
              position: { x: n.position_x, y: n.position_y },
              data: {
                label: n.label,
                description: n.description || '',
                status: n.status || 'hypothesis',
                linkedId: n.linked_entity_id || null,
                nodeType: n.linked_entity_type || 'Custom'
              }
            }));

            const formattedEdges = (dbEdges || []).map(e => ({
              id: e.id,
              source: e.source_node_id,
              target: e.target_node_id,
              label: e.relationship_label,
              data: {
                justification: e.justification || ''
              }
            }));

            return {
              caseId,
              nodes: formattedNodes,
              edges: formattedEdges,
              caseNotes: canvas.case_notes || '',
              updatedAt: canvas.updated_at
            };
          }
        }
      } catch (err) {
        console.warn('Supabase getCaseCanvas query notice:', err.message);
      }
    }

    // 2. Fallback to localStorage
    let stored = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) stored = JSON.parse(raw);
    } catch {}

    if (stored) return stored;

    // If no existing canvas, generate initial default hypothesis cards
    const initialNetwork = await this.getCaseIntelligenceNetwork(caseId);
    const nodes = [];
    const edges = [];

    // Add case focal node
    nodes.push({
      id: `node-${caseId}`,
      type: 'entityCard',
      position: { x: 380, y: 180 },
      data: {
        label: initialNetwork.caseData ? initialNetwork.caseData.crime_no : caseId,
        subLabel: initialNetwork.caseData ? initialNetwork.caseData.police_station : 'Registered Case',
        description: initialNetwork.caseData ? initialNetwork.caseData.brief_facts : 'Primary registered FIR under investigation.',
        nodeType: 'Case',
        status: 'confirmed',
        linkedId: caseId
      }
    });

    // Add primary accused
    const persons = initialNetwork.nodes.filter(n => n.type === 'Person').slice(0, 2);
    persons.forEach((p, idx) => {
      const pNodeId = `node-${p.id}`;
      nodes.push({
        id: pNodeId,
        type: 'personCard',
        position: { x: 120 + idx * 520, y: 340 },
        data: {
          label: p.label,
          role: p.subtext || 'Accused',
          description: `Key operative linked to ${initialNetwork.caseData?.crime_no || 'case'}. Known aliases: ${(p.aliases || []).join(', ') || 'None'}.`,
          status: 'confirmed',
          linkedId: p.id
        }
      });

      edges.push({
        id: `edge-${p.id}-${caseId}`,
        source: pNodeId,
        target: `node-${caseId}`,
        label: 'named in FIR',
        data: {
          justification: 'Formally listed as primary suspect in initial chargesheet.'
        }
      });
    });

    // Add initial working hypothesis sticky note
    nodes.push({
      id: `node-note-1`,
      type: 'noteCard',
      position: { x: 420, y: 460 },
      data: {
        label: 'Investigator Working Lead',
        description: 'Burner SIM activations in suburban tower coincide with getaway timeline. Check mutual CDR hops with Dharavi transit node.',
        status: 'hypothesis'
      }
    });

    const defaultCanvas = {
      caseId,
      nodes,
      edges,
      caseNotes: 'Investigative Hypothesis: Syndicate operated via layered burner SIMs with financial remittances routed through shell logistics entities. Awaiting bank KYC extract.',
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultCanvas));
    } catch {}

    return defaultCanvas;
  },

  async saveCaseCanvas(caseId, { nodes, edges, caseNotes }) {
    const storageKey = `ciu_canvas_${caseId}`;
    const canvasData = {
      caseId,
      nodes,
      edges,
      caseNotes: caseNotes || '',
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage as quick local cache
    try {
      localStorage.setItem(storageKey, JSON.stringify(canvasData));
    } catch {}

    // Save directly to Supabase tables
    if (isSupabaseConfigured) {
      try {
        const canvasId = `CANV-${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        await supabase.from('case_canvases').upsert({
          id: canvasId,
          case_id: caseId,
          case_notes: caseNotes || '',
          updated_at: new Date().toISOString()
        });

        // Sync nodes
        if (nodes && nodes.length > 0) {
          const dbNodes = nodes.map(n => ({
            id: n.id,
            canvas_id: canvasId,
            node_type: n.type || 'noteCard',
            position_x: n.position?.x || 0,
            position_y: n.position?.y || 0,
            label: n.data?.label || 'Card',
            description: n.data?.description || '',
            linked_entity_type: n.data?.nodeType || null,
            linked_entity_id: n.data?.linkedId || null,
            status: n.data?.status || 'hypothesis'
          }));
          await supabase.from('canvas_nodes').delete().eq('canvas_id', canvasId);
          await supabase.from('canvas_nodes').upsert(dbNodes);
        }

        // Sync edges
        if (edges && edges.length > 0) {
          const dbEdges = edges.map(e => ({
            id: e.id,
            canvas_id: canvasId,
            source_node_id: e.source,
            target_node_id: e.target,
            relationship_label: e.label || 'linked to',
            justification: e.data?.justification || ''
          }));
          await supabase.from('canvas_edges').delete().eq('canvas_id', canvasId);
          await supabase.from('canvas_edges').upsert(dbEdges);
        }
      } catch (err) {
        console.warn('Supabase canvas sync notice:', err.message);
      }
    }

    return canvasData;
  },

  async saveCanvasSnapshot(caseId, { label, nodes, edges, caseNotes }) {
    const snapKey = `ciu_canvas_snaps_${caseId}`;
    let list = [];
    try {
      const raw = localStorage.getItem(snapKey);
      if (raw) list = JSON.parse(raw);
    } catch {}

    const snapshot = {
      id: `snap-${Date.now()}`,
      label: label || `Snapshot ${list.length + 1}`,
      createdAt: new Date().toISOString(),
      nodesCount: nodes.length,
      edgesCount: edges.length,
      data: { nodes, edges, caseNotes }
    };

    list.unshift(snapshot);
    try {
      localStorage.setItem(snapKey, JSON.stringify(list.slice(0, 10)));
    } catch {}

    return snapshot;
  },

  async getCanvasSnapshots(caseId) {
    const snapKey = `ciu_canvas_snaps_${caseId}`;
    try {
      const raw = localStorage.getItem(snapKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  async pullKnowledgeGraphToCanvas(caseId) {
    const network = await this.getCaseIntelligenceNetwork(caseId);
    const nodes = [];
    const edges = [];

    // Case anchor
    nodes.push({
      id: `node-${caseId}`,
      type: 'entityCard',
      position: { x: 450, y: 150 },
      data: {
        label: network.caseData ? network.caseData.crime_no : caseId,
        subLabel: network.caseData ? network.caseData.police_station : 'Case FIR',
        description: network.caseData ? network.caseData.brief_facts : 'Primary Case Anchor',
        nodeType: 'Case',
        status: 'confirmed',
        linkedId: caseId
      }
    });

    // Linked entities in concentric/grid layout
    network.nodes.filter(n => n.type !== 'Case').forEach((n, idx) => {
      const angle = (idx / Math.max(1, network.nodes.length - 1)) * 2 * Math.PI;
      const x = 450 + 380 * Math.cos(angle);
      const y = 350 + 260 * Math.sin(angle);

      const isPerson = n.type === 'Person';
      const nodeType = isPerson ? 'personCard' : n.type === 'Location' ? 'noteCard' : 'entityCard';

      nodes.push({
        id: `node-${n.id}`,
        type: nodeType,
        position: { x: Math.max(50, x), y: Math.max(50, y) },
        data: {
          label: n.label,
          role: n.subtext || n.type,
          subLabel: n.subtext,
          description: n.description || `${n.type} entity linked to investigation. Status: ${n.subtext || 'Active'}.`,
          nodeType: n.type,
          status: 'confirmed',
          linkedId: n.id
        }
      });
    });

    // Edges
    network.edges.forEach(e => {
      edges.push({
        id: `edge-${e.id}`,
        source: `node-${e.source}`,
        target: `node-${e.target}`,
        label: e.verb || e.label,
        data: {
          justification: e.evidence || `Observed relationship in case telemetry records.`
        }
      });
    });

    return { nodes, edges };
  }
};

