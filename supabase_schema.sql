-- ============================================================================
-- SIH 26189: Criminal Intelligence Command Center — Database Schema & Seeds
-- Jurisdiction: Mumbai City Police (Pilot CIU)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- MIGRATION NOTE & TABLE CLASSIFICATION
-- ============================================================================
-- This schema assumes `auth.users` entries are created via Supabase Auth.
-- Every real officer must have a corresponding `officers` row before they can 
-- read or write anything. RLS is strictly enforced using `auth.uid()`.
--
-- TABLE CATEGORIES:
-- 1. SOURCE_DATA: cases, persons, phones, vehicles, accounts, organizations, locations, events, person_case_roles, fir_documents, case_canvases, canvas_nodes, canvas_edges, canvas_snapshots
--    (SELECT: active officer, INSERT/UPDATE: investigator+, DELETE: admin)
-- 2. INTELLIGENCE: relationships, mo_fingerprints, mo_similarities, evidence, evidence_links
--    (SELECT: active officer, INSERT/UPDATE: analyst+, DELETE: admin)
-- 3. MODEL_OUTPUT: entityresolutionoutput, networkcommunity, linkpredictionoutput, anomalydetectionoutput, alerts, rolepredictionoutput, document_chunks, extraction_spans
--    (SELECT: active officer, INSERT/UPDATE: backend service role only (nobody via UI), DELETE: admin)
-- 4. SECURITY: officers
--    (SELECT: admin (or self-row), INSERT/UPDATE/DELETE: admin)
-- 5. AUDIT: audit_logs
--    (SELECT: supervisor+, INSERT: backend service role only, UPDATE/DELETE: Nobody)
-- ============================================================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
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

-- ============================================================================
-- 0. SECURITY & AUDIT TABLES
-- ============================================================================
CREATE TABLE officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    badge TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('investigator', 'analyst', 'supervisor', 'admin')),
    unit TEXT,
    is_active BOOLEAN DEFAULT true
);
CREATE INDEX idx_officers_auth ON officers(auth_user_id);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id TEXT NOT NULL,
    actor_id UUID REFERENCES officers(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    mo_embedding vector(384)
);

-- 11. Locations
CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    normalized_address TEXT NOT NULL,
    locality TEXT,
    location_type TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

-- 12. FIR Documents
CREATE TABLE fir_documents (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    language TEXT DEFAULT 'English',
    raw_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Evidence & Evidence Links
CREATE TABLE evidence (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT,
    source_location TEXT,
    evidence_class TEXT,
    reliability DOUBLE PRECISION DEFAULT 0.9,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidence_links (
    id TEXT PRIMARY KEY,
    evidence_id TEXT REFERENCES evidence(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    support_type TEXT,
    contribution_weight DOUBLE PRECISION DEFAULT 1.0
);

-- 14. MO Similarities
CREATE TABLE mo_similarities (
    id TEXT PRIMARY KEY,
    case_id_a TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    case_id_b TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    similarity_score INTEGER NOT NULL CHECK (similarity_score BETWEEN 0 AND 100),
    matching_components TEXT[] NOT NULL
);

-- 15. Alerts
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
-- 16. CASE CANVAS INVESTIGATIVE WHITEBOARD TABLES
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

-- ============================================================================
-- 17. COMPUTED AI OUTPUT TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS entityresolutionoutput (
    id TEXT PRIMARY KEY,
    candidate_person_id_a TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    candidate_person_id_b TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_name_a TEXT NOT NULL,
    person_name_b TEXT NOT NULL,
    match_confidence INTEGER NOT NULL,
    matching_signals TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'MANUAL_REVIEW_REQUIRED',
    recommendation TEXT,
    model_name TEXT DEFAULT 'CIU-EntityLinker-v1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS networkcommunity (
    community_id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    hub_entity_id TEXT NOT NULL,
    member_count INTEGER NOT NULL,
    density_score REAL NOT NULL,
    members TEXT[] DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS linkpredictionoutput (
    id TEXT PRIMARY KEY,
    source_entity_id TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    predicted_relationship TEXT NOT NULL,
    predicted_confidence INTEGER NOT NULL,
    common_neighbors_count INTEGER NOT NULL,
    common_neighbors TEXT[] DEFAULT '{}',
    topology_score REAL NOT NULL,
    rationale TEXT,
    model_name TEXT DEFAULT 'CIU-Graph-AdamicAdar-v1'
);

CREATE TABLE IF NOT EXISTS anomalydetectionoutput (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    anomaly_type TEXT NOT NULL,
    z_score REAL NOT NULL,
    anomaly_score INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rolepredictionoutput (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    predicted_role TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    basis TEXT NOT NULL,
    model_name TEXT DEFAULT 'CIU-RolePredictor-v1'
);

-- ============================================================================
-- 18. NLP INGESTION EVIDENCE SPANS
-- ============================================================================
CREATE TABLE document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES fir_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    chunk_text TEXT NOT NULL
);

CREATE TABLE extraction_spans (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES fir_documents(id) ON DELETE CASCADE,
    chunk_id TEXT REFERENCES document_chunks(id) ON DELETE CASCADE,
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    text_snippet TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_value TEXT NOT NULL,
    extraction_method TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_chunks_doc ON document_chunks(document_id);
CREATE INDEX idx_extraction_spans_doc ON extraction_spans(document_id);

-- ============================================================================
-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- ============================================================================

-- ENABLE RLS ON ALL TABLES
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_case_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mo_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fir_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE mo_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE entityresolutionoutput ENABLE ROW LEVEL SECURITY;
ALTER TABLE networkcommunity ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkpredictionoutput ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalydetectionoutput ENABLE ROW LEVEL SECURITY;
ALTER TABLE rolepredictionoutput ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_spans ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SECURITY (officers)
-- SELECT: self or admin. INSERT/UPDATE/DELETE: admin.
-- ----------------------------------------------------------------------------
CREATE POLICY "officers_select" ON officers FOR SELECT USING (
    auth_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM officers o WHERE o.auth_user_id = auth.uid() AND o.role = 'admin')
);
CREATE POLICY "officers_insert" ON officers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM officers o WHERE o.auth_user_id = auth.uid() AND o.role = 'admin')
);
CREATE POLICY "officers_update" ON officers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM officers o WHERE o.auth_user_id = auth.uid() AND o.role = 'admin')
);
CREATE POLICY "officers_delete" ON officers FOR DELETE USING (
    EXISTS (SELECT 1 FROM officers o WHERE o.auth_user_id = auth.uid() AND o.role = 'admin')
);

-- ----------------------------------------------------------------------------
-- AUDIT (audit_logs)
-- SELECT: supervisor or admin. INSERT: backend only. UPDATE/DELETE: Nobody.
-- ----------------------------------------------------------------------------
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role IN ('supervisor', 'admin') AND is_active = true)
);
-- No insert policy for users (UI cannot write to audit log, must be service role)
-- No update/delete policy for users (immutable)

-- ----------------------------------------------------------------------------
-- HELPER: Define generic policy statements to avoid massive repetition
-- We will apply these to each category.
-- ----------------------------------------------------------------------------
-- Note: In PostgreSQL, we cannot easily loop policy creation, so we write them explicitly.

-- ============================================================================
-- SOURCE_DATA POLICIES
-- SELECT: active officer. INSERT/UPDATE: investigator, analyst, supervisor, admin. DELETE: admin.
-- Tables: cases, persons, phones, vehicles, accounts, organizations, locations, events, person_case_roles, fir_documents, case_canvases, canvas_nodes, canvas_edges, canvas_snapshots
-- ============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['cases', 'persons', 'phones', 'vehicles', 'accounts', 'organizations', 'locations', 'events', 'person_case_roles', 'fir_documents', 'case_canvases', 'canvas_nodes', 'canvas_edges', 'canvas_snapshots'])
    LOOP
        EXECUTE format('
            CREATE POLICY "%I_select" ON %I FOR SELECT USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND is_active = true)
            );
            CREATE POLICY "%I_insert" ON %I FOR INSERT WITH CHECK (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role IN (''investigator'', ''analyst'', ''supervisor'', ''admin'') AND is_active = true)
            );
            CREATE POLICY "%I_update" ON %I FOR UPDATE USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role IN (''investigator'', ''analyst'', ''supervisor'', ''admin'') AND is_active = true)
            );
            CREATE POLICY "%I_delete" ON %I FOR DELETE USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role = ''admin'' AND is_active = true)
            );
        ', t, t, t, t, t, t, t, t);
    END LOOP;
END $$;

-- ============================================================================
-- INTELLIGENCE POLICIES
-- SELECT: active officer. INSERT/UPDATE: analyst, supervisor, admin. DELETE: admin.
-- Tables: relationships, mo_fingerprints, mo_similarities, evidence, evidence_links
-- ============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['relationships', 'mo_fingerprints', 'mo_similarities', 'evidence', 'evidence_links'])
    LOOP
        EXECUTE format('
            CREATE POLICY "%I_select" ON %I FOR SELECT USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND is_active = true)
            );
            CREATE POLICY "%I_insert" ON %I FOR INSERT WITH CHECK (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role IN (''analyst'', ''supervisor'', ''admin'') AND is_active = true)
            );
            CREATE POLICY "%I_update" ON %I FOR UPDATE USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role IN (''analyst'', ''supervisor'', ''admin'') AND is_active = true)
            );
            CREATE POLICY "%I_delete" ON %I FOR DELETE USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role = ''admin'' AND is_active = true)
            );
        ', t, t, t, t, t, t, t, t);
    END LOOP;
END $$;

-- ============================================================================
-- MODEL_OUTPUT POLICIES
-- SELECT: active officer. INSERT/UPDATE: NONE (backend only). DELETE: admin.
-- Tables: entityresolutionoutput, networkcommunity, linkpredictionoutput, anomalydetectionoutput, alerts, rolepredictionoutput, document_chunks, extraction_spans
-- ============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['entityresolutionoutput', 'networkcommunity', 'linkpredictionoutput', 'anomalydetectionoutput', 'alerts', 'rolepredictionoutput', 'document_chunks', 'extraction_spans'])
    LOOP
        EXECUTE format('
            CREATE POLICY "%I_select" ON %I FOR SELECT USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND is_active = true)
            );
            CREATE POLICY "%I_delete" ON %I FOR DELETE USING (
                EXISTS (SELECT 1 FROM officers WHERE auth_user_id = auth.uid() AND role = ''admin'' AND is_active = true)
            );
        ', t, t, t, t);
        -- Intentionally omitting INSERT and UPDATE policies, ensuring only the service_role key can write to these.
    END LOOP;
END $$;
