-- ============================================================================
-- SIH 26189: Criminal Intelligence Command Center — Database Schema & Seeds
-- Jurisdiction: Mumbai City Police (Pilot CIU)
-- ============================================================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS mo_similarities CASCADE;
DROP TABLE IF EXISTS mo_fingerprints CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS person_case_roles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS phones CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- 1. Cases
CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    crime_no TEXT NOT NULL UNIQUE,
    case_no TEXT NOT NULL,
    crime_category TEXT NOT NULL,
    crime_major_head TEXT NOT NULL,
    crime_minor_head TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Under Investigation', 'Open', 'Chargesheet Filed', 'Closed', 'Escalated')),
    registered_date DATE NOT NULL,
    incident_from TIMESTAMP WITH TIME ZONE NOT NULL,
    incident_to TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    police_station TEXT NOT NULL,
    brief_facts TEXT NOT NULL
);

-- 2. Persons
CREATE TABLE persons (
    id TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    dob DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    status_tag TEXT NOT NULL CHECK (status_tag IN ('Person of Interest', 'Accused', 'Key Suspect', 'Witness', 'Under Surveillance', 'Informant')),
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    photo_url TEXT
);

-- 3. Phones
CREATE TABLE phones (
    id TEXT PRIMARY KEY,
    normalized_number_hash TEXT NOT NULL,
    owner_person_id TEXT REFERENCES persons(id) ON DELETE SET NULL,
    first_seen DATE NOT NULL,
    last_seen DATE NOT NULL,
    imei_hash TEXT,
    service_provider TEXT
);

-- 4. Vehicles
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    registration_hash TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    owner_person_id TEXT REFERENCES persons(id) ON DELETE SET NULL,
    make_model TEXT,
    color TEXT
);

-- 5. Accounts
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    account_hash TEXT NOT NULL,
    institution_type TEXT NOT NULL,
    owner_person_id TEXT REFERENCES persons(id) ON DELETE SET NULL,
    account_type TEXT,
    risk_level TEXT DEFAULT 'Medium'
);

-- 6. Organizations
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    jurisdiction TEXT DEFAULT 'Mumbai Metropolitan Region'
);

-- 7. Roles & Links
CREATE TABLE person_case_roles (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('Accused', 'Key Suspect', 'Victim', 'Complainant', 'Witness', 'Co-conspirator'))
);

-- 8. Relationships
CREATE TABLE relationships (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    status TEXT NOT NULL CHECK (status IN ('observed', 'inferred')),
    first_seen DATE NOT NULL,
    last_seen DATE NOT NULL,
    source_evidence TEXT NOT NULL
);

-- 9. Events
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
    person_id TEXT REFERENCES persons(id) ON DELETE SET NULL,
    location_text TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL
);

-- 10. MO Fingerprints
CREATE TABLE mo_fingerprints (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
    target TEXT NOT NULL,
    timing TEXT NOT NULL,
    entry_method TEXT NOT NULL,
    tools TEXT NOT NULL,
    transport TEXT NOT NULL,
    concealment TEXT NOT NULL,
    action_sequence TEXT NOT NULL,
    victim_interaction TEXT NOT NULL,
    exit_method TEXT NOT NULL,
    group_behavior TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100)
);

-- 11. MO Similarities
CREATE TABLE mo_similarities (
    id TEXT PRIMARY KEY,
    case_id_a TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    case_id_b TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    similarity_score INTEGER NOT NULL CHECK (similarity_score BETWEEN 0 AND 100),
    matching_components TEXT[] NOT NULL
);

-- 12. Alerts
CREATE TABLE alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('High', 'Medium', 'Low')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    evidence_refs TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewed', 'Dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-performance investigator queries
CREATE INDEX idx_cases_crime_no ON cases(crime_no);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_registered_date ON cases(registered_date);
CREATE INDEX idx_persons_canonical_name ON persons(canonical_name);
CREATE INDEX idx_person_case_roles_person ON person_case_roles(person_id);
CREATE INDEX idx_person_case_roles_case ON person_case_roles(case_id);
CREATE INDEX idx_relationships_source ON relationships(source_id);
CREATE INDEX idx_relationships_target ON relationships(target_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);

-- ============================================================================
-- 13. CASE CANVAS INVESTIGATIVE WHITEBOARD TABLES
-- ============================================================================

CREATE TABLE case_canvases (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    case_notes TEXT DEFAULT '',
    created_by TEXT DEFAULT 'Officer VK',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE canvas_nodes (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL REFERENCES case_canvases(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('personCard', 'noteCard', 'entityCard')),
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    label TEXT NOT NULL,
    description TEXT DEFAULT '',
    linked_entity_type TEXT,
    linked_entity_id TEXT,
    status TEXT NOT NULL DEFAULT 'hypothesis' CHECK (status IN ('confirmed', 'hypothesis'))
);

CREATE TABLE canvas_edges (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL REFERENCES case_canvases(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    relationship_label TEXT NOT NULL,
    justification TEXT DEFAULT ''
);

CREATE TABLE canvas_snapshots (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL REFERENCES case_canvases(id) ON DELETE CASCADE,
    snapshot_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_canvases_case ON case_canvases(case_id);
CREATE INDEX idx_canvas_nodes_canvas ON canvas_nodes(canvas_id);
CREATE INDEX idx_canvas_edges_canvas ON canvas_edges(canvas_id);

