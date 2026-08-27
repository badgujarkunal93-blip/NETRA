# Real FIR Ingestion & NLP Pipeline Implementation Plan

This plan outlines the architecture for replacing the mocked FIR ingestion pipeline with a robust, backend-driven NLP pipeline using FastAPI and LLM-based structured extraction.

## User Review Required

> [!IMPORTANT]
> - **LLM Integration:** I will implement the extraction using standard tools (e.g., `google-genai` or `openai` python package) to generate structured JSON from the FIR text. You will need to provide an API key in your `.env` for this to work end-to-end. If no key is provided, the backend will fail gracefully as per the requirements.
> - **Schema Updates:** The current `supabase_schema.sql` does not include tables for `document_chunks` or `extraction_spans` as requested in the requirements. I will append these tables to the schema and migration script to satisfy the Evidence Spans requirement.

## Open Questions

> [!WARNING]
> - Should I use `google-genai` or the `openai` python SDK for the LLM extraction logic in the backend?
> - For OCR on images, is it acceptable to use `pytesseract`, which requires the Tesseract system binary to be installed on the host?

## Proposed Changes

### Backend Architecture (`priority-model-service`)

#### [MODIFY] [main.py](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/main.py)
- Include a new router for `/api/fir/ingest`.
- Expose WebSocket or Server-Sent Events (SSE) endpoint `/api/fir/ingest/status` to stream real-time pipeline status (UPLOADING, EXTRACTING, ANALYZING, SAVING, COMPLETED, FAILED).

#### [NEW] [ingestion.py](file:///c:/Users/ASUS/Desktop/Netra%20ai/priority-model-service/ingestion.py)
- Handle file uploads (PDF, TXT, Image).
- Implement PDF extraction (via `pdfplumber` or `PyPDF2`).
- Implement OCR (via `pytesseract`).
- Define the `Pydantic` schema for the LLM output (matching Person, Phone, Vehicle, MO attributes, etc.).
- Implement LLM call with structured JSON output enforcement.
- Validate LLM output rigorously, rejecting malformed structures.
- Map extracted entities to the Supabase database (Cases, Persons, Roles, Evidence).
- Generate evidence spans and text snippets to link extracted entities back to the source text.

### Database Updates

#### [MODIFY] [supabase_schema.sql](file:///c:/Users/ASUS/Desktop/Netra%20ai/supabase_schema.sql)
- Append `document_chunks` and `extraction_spans` tables to track exact offsets and snippets for every extracted entity, satisfying the "Where did this entity come from?" requirement.

### Frontend Updates

#### [MODIFY] [FIRUploadModal.jsx](file:///c:/Users/ASUS/Desktop/Netra%20ai/src/components/ingestion/FIRUploadModal.jsx)
- Remove `setTimeout` fake delays.
- Change `handleProcessExtraction` to `POST` the raw text or uploaded file to the FastAPI backend using `FormData`.
- Listen to backend SSE/polling for real-time status updates instead of hardcoded state steps.
- Render the final result directly from the backend response.

## Verification Plan

### Automated Tests
- Create Python unit tests (`test_ingestion.py`) testing:
  - `test_fir_text_extraction`
  - `test_structured_extraction` (using mocked LLM JSON)
  - `test_invalid_llm_output` (ensuring Pydantic catches bad types)
  - `test_database_persistence`

### Manual Verification
- Upload a real test FIR via the UI.
- Verify the backend extracts the text, analyzes it via the LLM, saves it to Supabase, and the UI displays the structured result with 100% real data.
