# NETRA Technical Audit Report (SIH 26189)

## A. Working Features
- Frontend React application with Vite, Tailwind CSS.
- Fast routing with `react-router-dom`.
- High-level layout components (AppShell).
- Python FastApi Priority Scoring service (`priority-model-service/main.py`) successfully handles requests and performs validations using Pydantic.

## B. Partially Working Features
- **Knowledge Graph UI (Canvas):** LocalStorage is used for saving snapshots, but it only syncs to Supabase if configured.
- **Priority Scoring Model (ML):** A fallback heuristic predictor is in place when `suspect_priority_model.joblib` fails to load, meaning it relies on simple mathematical formulas rather than real ML predictions.

## C. Mock/Hard-coded Features
- **Database (Supabase):** `src/services/db.js` contains hundreds of lines of hard-coded cases, persons, and graph relationships instead of pulling dynamically from Supabase.
- **FIR Ingestion/NLP Extraction:** `src/components/ingestion/FIRUploadModal.jsx` simulates processing steps using `setTimeout(r, 600)` to imitate AI. It pulls text from `SAMPLE_PRESETS` and uses `Math.random()` to generate IDs.
- **Priority Scores & Confidence:** Confidence scores in `src/services/db.js` are manually set integers (e.g., `confidence: 94`).
- **Graph Metrics:** Graph generation uses hard-coded coordinates (e.g. `x: 120 + idx * 520, y: 340`).
- **Alerts/Findings:** Hard-coded in the UI instead of dynamically generating anomalies.

## D. Missing Features
- Real LLM implementation for FIR parsing.
- Actual vector embedding or MO similarity implementations.
- Synthetic data generation module (not present in current repo).
- Real NLP ingestion of documents.
- Reporting/Exporting functionality is mocked/missing (`exports.zip` was deleted).
- Comprehensive test suite (Unit/Integration tests).

## E. Architecture Problems
- **Direct Database Definitions in UI layer:** `src/services/db.js` acts as an entire mock backend right within the frontend app instead of an API call.
- **Coupling of AI Logic:** The React frontend fakes AI extraction steps rather than calling a dedicated backend microservice for ingestion.

## F. Security Problems
- **Authentication/Authorization:** `src/pages/Login.jsx` has placeholders (`name@mumbaipolice.gov.in`) and uses a security token input, but real JWT/Supabase Auth handling isn't properly wired for secure routing. 
- **Dummy Keys:** `src/services/supabaseClient.js` falls back to `placeholder` or `dummy_key` if environmental variables are missing, potentially leading to unauthorized local access if not carefully guarded.

## G. Data Problems
- **Persistence:** FIRs ingested via `FIRUploadModal` are saved into local component state (`setExtractedResult(mockExtracted)`) but are not correctly persisted to a backend datastore.
- **Graph Evidence:** Graph edge justifications (provenance) are hard-coded text strings rather than links to verified, immutable evidence.

## H. ML Problems
- **No Active Retraining:** `priority-model-service` loads a `.joblib` model but has no pipelines to retrain it based on new CIU data.
- **Fake MO:** MO similarities rely on hard-coded heuristics (`src/services/suspectPriorityService.js`) rather than algorithmic text embeddings.

## I. Evidence/Provenance Problems
- **No True Data Lineage:** Entities lack proper tracking back to the original text chunk of the FIR. The "isExisting" flags in `FIRUploadModal.jsx` are arbitrarily assigned (e.g., checking if the raw text includes "Farhan").

## J. Performance Problems
- **Graph Rendering:** `CaseCanvas.jsx` renders hundreds of DOM nodes for the graph which can severely bottleneck the browser without virtualization if the dataset grows.
- **Data Load:** Storing the entire `db.js` mock object in the JavaScript bundle inflates the client-side load time. 

---

### Detailed Issue Log

**1. Fake FIR Extraction (P0)**
- **File:** `src/components/ingestion/FIRUploadModal.jsx` (Lines ~97-141)
- **Current Behavior:** Uses `setTimeout` to imitate processing, then parses `SAMPLE_PRESETS` and randomizes IDs.
- **Why it is a problem:** Core NLP pipeline is non-existent.
- **Recommended Fix:** Implement actual Python/FastAPI backend endpoint that uses an LLM (e.g., Gemini/GPT-4) to extract structured JSON from raw FIRs.

**2. Hardcoded Intelligence Graph / DB (P0)**
- **File:** `src/services/db.js` (Entire file)
- **Current Behavior:** Returns static arrays of objects for cases, persons, and edges.
- **Why it is a problem:** The application has no real state and operates purely on static demo data.
- **Recommended Fix:** Replace with actual Supabase `select()` queries and insert statements.

**3. Fallback Heuristic in Priority Model (P1)**
- **File:** `priority-model-service/main.py` (Line 214)
- **Current Behavior:** Computes a fake priority score if model file is missing or fails.
- **Why it is a problem:** Masking a missing ML model with arbitrary math defeats the purpose of ML predictions.
- **Recommended Fix:** Enforce model loading on startup and throw 500 errors if unavailable, triggering alerts rather than failing silently.

**4. Static Case Searches (P1)**
- **File:** `src/pages/CaseSearch.jsx` (Line ~129)
- **Current Behavior:** UI allows searching but filters against static client-side lists.
- **Why it is a problem:** Doesn't scale and doesn't represent real DB querying.
- **Recommended Fix:** Implement Supabase Full-Text Search.

**5. Placeholder Supabase Client (P0)**
- **File:** `src/services/supabaseClient.js`
- **Current Behavior:** Connects to `https://placeholder.supabase.co` if missing env vars.
- **Why it is a problem:** Breaks the app silently.
- **Recommended Fix:** Enforce environment variable presence at build-time.
