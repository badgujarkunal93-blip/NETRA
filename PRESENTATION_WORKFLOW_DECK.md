# NETRA — Mumbai Police Criminal Intelligence Command Center
## Comprehensive System Workflow & Presentation Deck (SIH 26189)

---

## Slide 1: Title & Executive Summary

* **Project Title:** **NETRA** (*Network Enabled Threat Recognition & Analytics*)
* **Sub-Title:** Next-Generation Criminal Intelligence Command Center & Multi-Jurisdictional Fusion Platform
* **Problem Statement ID:** SIH 26189
* **Pilot Deployment:** Mumbai Police Criminal Intelligence Unit (CIU)
* **Core Value Proposition:** Transforming unstructured First Information Reports (FIRs) and siloed police records into an interconnected, geospatial, AI-assisted investigation network with zero-hallucination guarantees and interactive tactical whiteboards.

---

## Slide 2: The Core Operational Problem

* **Unstructured FIR Data Silos:** Over 85% of crime intelligence is buried in multi-page scanned/digitized CCTNS Form II PDFs with unstructured narratives.
* **Alias & Identity Obfuscation:** Criminal operatives operate across police jurisdictions using phonetic aliases, burner phone SIMs, and shell logistics firms without centralized deduplication.
* **Disconnected Modus Operandi (MO):** Serial safe-cracking tool marks, cyber SIM swap scripts, and Hawala remittance paths remain isolated across precinct registries.
* **Lack of Hypothesis Whiteboards:** Officers lack digital workspaces to formulate working leads, capture evidence justifications, and contrast facts against speculations.

---

## Slide 3: End-to-End System Architecture

```
[Real Indian CCTNS Form II FIR PDFs] ──▶ [pdf-parse / Tesseract OCR Engine]
                                                        │
                                                        ▼
[Strict Zod Schema Validator] ◀──▶ [LLM Information Structurer (Zero Hallucination)]
            │
            ▼
[Entity Resolution Engine] ────▶ [Cross-Case Deduplication (Levenshtein + Shared Assets)]
            │
            ▼
[PostgreSQL / Supabase Layer] ──▶ [Local JSON Offline Datastore (Dual-Persistence)]
            │
            ├─────────────────────────────────────────────────────────────┐
            ▼                                                             ▼
[Graph Intelligence & ML Engine]                               [Interactive CIU Application]
  • Louvain Community Detection (336 Clusters)                   • Institutional Command Center (/dashboard)
  • Adamic-Adar Link Prediction (48 Edges)                       • Case & FIR Registry (/cases)
  • Weighted MO Similarity Matrix (500 Pairs)                    • Entity Profiles (/entities)
  • Z-Score Statistical Anomalies (170 Events)                   • Geospatial Network Map (/graph)
  • Provenance-Grounded Strategic Alerts                         • React Flow Case Canvas (/canvas)
                                                                 • MO Forensic Matrix (/mo-similarity)
                                                                 • In-App FIR Ingestor (FIRUploadModal)
```

---

## Slide 4: Automated FIR Extraction & Ingestion Pipeline

### 4-Stage Ingestion Workflow (`npm run extract-firs` / In-App Ingestion Modal)

1. **Dual-Mode Text Extraction (`pdf_extractor.js`):**
   * Primary parser extracts digital text streams directly from CCTNS Form II PDFs.
   * Automatic fallback to **Tesseract.js OCR engine** if digital text is fewer than 60 characters (scanned raster images).
2. **Strict LLM Structuring & Zero-Hallucination Policy (`llm_structurer.js`):**
   * Enforces strict JSON return schema with mandatory non-null fields (`crime_no`, `case_no`, `registered_date`, `police_station`, `brief_facts`).
   * Validated through strict `Zod` schemas with single-retry error feedback loops.
3. **Cross-Case Entity Resolution (`supabase_writer.js`):**
   * Queries existing person registry for matching `canonical_name` (case-insensitive) and alias overlap.
   * Deduplicates suspect profiles across cases and links burner phones, getaway vehicles, and 10-attribute MO fingerprints.
4. **Audit Run Logging (`data/pipeline_run_log.json`):**
   * Tracks processing speed (0.22s/batch), extraction methods, schema pass rates (100%), and new vs matched suspect ratios.

---

## Slide 5: Feature 1 — Institutional Command Center (`/dashboard`)

* **Visual Design Language:** Deep navy (`#0A192F`), institutional gold (`#D4A017`), and crisp slate borders — built specifically for government intelligence workstations.
* **Live GIS Radar Telemetry:** Real-time terminal status (`UNIT CALLSIGN: CIU-OPS-01`, `LIVE TELEMETRY • 24ms`) with animated coordinate readouts across Mumbai hotspots.
* **7-Day Embedded Sparkline KPIs:** High-density metric tiles for Active Cases, Open Alerts, Tracked Entities, and Intelligence Health with embedded trend vectors.
* **Dominant Intelligence Queue:** Prioritizes High-Severity multi-jurisdiction threats with inline confidence meters and quick-action triage buttons.
* **Asymmetric AI Correlation Hero Card:** Visualizes multi-hop entity pathways (e.g. *Farhan Merchant ➔ Nariman Shell ➔ BKC Hawala Hub*) instead of generic repeated card grids.

---

## Slide 6: Feature 2 — Case & FIR Registry Dossier (`/cases`)

* **Master-Detail Layout:** Left scrollable case registry with instant search by Crime No, Police Station, and Acts; Right comprehensive case dossier.
* **10-Point MO Fingerprint Breakdown:** Displays target, timing window, entry method, tool signatures, transport patterns, and concealment techniques.
* **Linked Persons of Interest & Assets:** Displays accused, complainants, witnesses, tagged burner phone numbers, and vehicle registration hashes.
* **Interactive In-App Ingestor:** 1-click **"Ingest FIR PDF"** trigger allowing officers to drag-and-drop new FIRs or paste raw CCTNS text and watch real-time extraction progress.

---

## Slide 7: Feature 3 — Unified Entity Profiles (`/entities`)

* **Biographical & Risk Header:** Displays canonical suspect identity, known street aliases, confidence rating, risk rating, and last verified jurisdiction.
* **Asset & Involvement Summary Cards:** Quick count badges for registered cases, burner phones, getaway vehicles, and front organizations.
* **4-Tab Forensic Dossier:**
  1. **Timeline of Activity:** Chronological forensic event trail with police station tags and timestamps.
  2. **Observed vs Inferred Connections:** Direct documentary evidence (gold solid) contrasted against AI-inferred relationship predictions (amber dashed).
  3. **Linked FIRs & Offences:** All cases where the person is named as an accused or co-conspirator.
  4. **Evidence & Chain of Custody:** Documentary logs, seizure memos, CDR dumps, and FASTag logs.

---

## Slide 8: Feature 4 — Case-Scoped Geospatial Intelligence Network (`/graph`)

* **Real Map Canvas (React-Leaflet + CartoDB Dark Matter):** Replaces abstract floating node bubbles with a map of Mumbai.
* **Deterministic Crime Scene Pinning:** Pins the primary crime scene case anchor and related incident events at real geographic coordinates.
* **Entity Offset Orbiting:** Connected suspects, burner phones, and getaway vehicles dynamically orbit their associated event locations without overlapping.
* **Interactive Map-Walking Side Card:** Click any entity in the network sidebar to trigger smooth `map.flyTo` viewport transitions and highlight related Leaflet polylines.
* **Case Selector Filtering:** Scoped strictly per case to maintain zero visual clutter and maximum investigative relevance.

---

## Slide 9: Feature 5 — Investigative Case Canvas (`/canvas`)

* **Free-Form Investigative Whiteboard (React Flow):** An interactive digital workspace for investigators to formulate hypotheses by hand.
* **Custom Institutional Cards:**
  * **Person Card:** Suspect details, role tags, expandable theory notes, and database linking indicators.
  * **Evidence / Note Card:** Sticky note cards for physical evidence, crime scene observations, timestamps, and witness quotes.
  * **Entity Card:** Dynamic asset cards for Burner Phones, Vehicles, Shell Accounts, and Locations.
* **Verified vs Hypothesis State Toggle:** 1-click toggle marking cards as **Confirmed Verified Fact** (Emerald border) vs **Working Hypothesis** (Dashed Amber border).
* **Manual Edge Drawing with Justification Prompts:** Dragging a connection prompts the officer for relationship labels and **investigator justification text** (feeds the AI scoring model).
* **"Import KG Seeds" Button:** 1-click import of existing database facts into the whiteboard to seed the hypothesis map.
* **Milestone Snapshots & Narrative Drawer:** Capture and restore timestamped version history (*e.g., "Post-Interrogation Map"*) and write global case operational briefs.

---

## Slide 10: Feature 6 — Modus Operandi Similarity Matrix (`/mo-similarity`)

* **10-Attribute Forensic Comparison:** Target, Timing, Entry Method, Tools, Transport, Concealment, Action Sequence, Victim Interaction, Exit Method, and Group Behavior.
* **Weighted Jaccard Scoring:** Computes mathematical pattern similarity across registered cases without hallucination.
* **Comparative Checklist:** Side-by-side inspection showing matching vs divergent crime characteristics.
* **2D Spatial Scatter Plot:** Visualizes crime clusters mapped by weapon/tool marks vs spatial proximity across Mumbai.

---

## Slide 11: Feature 7 — Authentic Machine Learning & Graph Algorithms

| AI / ML Engine | Computational Algorithm | Implementation Purpose |
| :--- | :--- | :--- |
| **MO Similarity Matrix** | Weighted Component Jaccard & Token Overlap | Discovers repeat offenders using identical tool marks and entry techniques across different police stations. |
| **Entity Resolution** | Levenshtein Distance + Shared Asset Co-occurrence | Detects duplicate suspect identities and merges multi-jurisdiction aliases. |
| **Community Detection** | Louvain Modularity Clustering | Uncovers organized crime syndicates, logistics conduits, and Hawala networks from relationship topology. |
| **Link Prediction** | Adamic-Adar Graph Structural Metric | Predicts hidden co-conspirators and unseen conduit connections based on mutual intermediary hubs. |
| **Anomaly Detection** | Statistical Z-Score ($> 2.5\sigma$) & Spatial Velocity | Flags high-degree telecom hubs and impossible travel timelines across distant precincts. |
| **Strategic Synthesis** | Provenance-Grounded LLM Reasoning | Generates natural-language intelligence summaries referencing verified underlying data IDs. |

---

## Slide 12: Verified Dataset & Integrity Metrics

* **CCTNS Import Scale:** **1,000 Cases, 5,000 Persons, 6,000 Phones, 2,500 Vehicles, 3,000 Accounts, 1,817 Relationships, 1,000 FIR Documents**.
* **Referential Integrity Audit:** **0 foreign key orphans** across all database tables.
* **Entity Resolution Ratio:** **1.20 cases/person average**, confirming active cross-case entity correlation.
* **Realistic Confidence Spread:** Healthy bell curve (Min: 54%, Max: 98%, Mean: 88.7%) across observed vs inferred tiers.
* **Automated Audit Suite:** Standalone verification runner (`npm run verify-pipeline` / `data/pipeline_verification_report.md`).

---

## Slide 13: Live Demonstration Flow (Recommended for PPT/Presentation)

1. **Step 1 — Login & Dashboard Overview (`/login` ➔ `/dashboard`)**:
   * Authenticate as Senior Intelligence Officer; showcase live telemetry, KPI sparklines, and dominant alert triage.
2. **Step 2 — In-App FIR Document Ingestion (`FIRUploadModal`)**:
   * Ingest a sample CCTNS Form II FIR PDF; observe real-time OCR extraction, Zod schema validation, and suspect entity resolution.
3. **Step 3 — Case Dossier Inspection (`/cases`)**:
   * Inspect extracted case facts, 10-attribute MO fingerprint, and linked phone/vehicle assets.
4. **Step 4 — Geospatial Case Network Map (`/graph`)**:
   * Select a case; observe crime scene anchor, orbiting suspect badges on Dark Matter Leaflet map, and test `map.flyTo` interactive navigation.
5. **Step 5 — Investigative Whiteboard (`/canvas`)**:
   * Open the Case Canvas; import KG seeds, add a working lead note, draw a justified link, toggle verified/hypothesis states, and run the AI Hypothesis Analyzer.
6. **Step 6 — Modus Operandi Matrix & Alerts (`/mo-similarity` ➔ `/alerts`)**:
   * Compare safe-cracking tool mark signatures across Colaba & Bandra; triage alerts with state transitions.

---

## Slide 14: Key Differentiators & Competitive Advantage

| Feature | Typical Hackathon Project | **NETRA (SIH 26189)** |
| :--- | :--- | :--- |
| **Design Language** | Generic consumer dashboard / neon gaming UI | **Institutional, calm, government-grade Command Console** |
| **Data Ingestion** | Hardcoded JSON mock files | **Dual Digital & OCR parser with strict Zod validation** |
| **Knowledge Graph** | Cluttered abstract 3D bubble soup | **Case-scoped geospatial React-Leaflet dark map with flyTo** |
| **Investigator Whiteboard** | None | **Interactive React Flow canvas with justification prompts & snapshots** |
| **AI Output Authenticity** | 100% LLM prompt hallucinations | **Genuine ML/Graph algorithms (Louvain, Adamic-Adar, Jaccard, Z-Score)** |
| **Database Persistence** | Session-only state | **Dual Supabase SQL & local JSON datastore with 0 orphans** |

---

## Slide 15: Future Roadmap & Scalability

* **Statewide Grid Integration:** Seamless scaling to all 36 Maharashtra districts via standard CCTNS XML/JSON feeds.
* **Biometric & Facial Recognition Interoperability:** Linking automated CCTV facial cluster IDs to suspect dossiers.
* **Voice-to-FIR Real-Time Transcription:** Multilingual Marathi/Hindi/English speech recognition for frontline station officers.
* **Predictive Patrol Heatmaps:** Integrating seasonal MO pattern forecasts into daily patrol dispatch rosters.
