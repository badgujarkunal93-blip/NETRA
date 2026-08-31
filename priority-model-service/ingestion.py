import os
import io
import json
import uuid
from typing import List, Optional, Dict
from datetime import datetime
import logging
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks

load_dotenv()

try:
    from supabase import create_client, Client
    has_supabase = True
except ImportError:
    has_supabase = False
    Client = None

try:
    import pdfplumber
    has_pdfplumber = True
except ImportError:
    has_pdfplumber = False

try:
    import pytesseract
    from PIL import Image
    has_ocr = True
except ImportError:
    has_ocr = False

try:
    from google import genai
    from google.genai import types
    has_genai = True
except ImportError:
    has_genai = False

logger = logging.getLogger("CIU-Ingestion")

router = APIRouter()

# -----------------------------------------------------------------------------
# SUPABASE CLIENT
# -----------------------------------------------------------------------------
def get_supabase():
    if not has_supabase:
        raise HTTPException(status_code=503, detail="Supabase library not available on server.")
    supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Missing Supabase credentials in server environment")
    return create_client(supabase_url, supabase_key)

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS FOR LLM EXTRACTION
# -----------------------------------------------------------------------------

class PersonSchema(BaseModel):
    name: str
    aliases: List[str] = []
    role: str = Field(description="One of: Accused, Key Suspect, Victim, Complainant, Witness, Co-conspirator, Person of Interest")
    confidence: int = Field(ge=0, le=100)

class PhoneSchema(BaseModel):
    number: str
    owner_name: Optional[str]
    confidence: int = Field(ge=0, le=100)

class VehicleSchema(BaseModel):
    registration: str
    make_model: Optional[str]
    color: Optional[str]
    owner_name: Optional[str]
    confidence: int = Field(ge=0, le=100)

class AccountSchema(BaseModel):
    account_number_or_hash: str
    institution: Optional[str]
    owner_name: Optional[str]
    confidence: int = Field(ge=0, le=100)

class OrganizationSchema(BaseModel):
    name: str
    type: str
    confidence: int = Field(ge=0, le=100)

class MOFingerprintSchema(BaseModel):
    target: str = Field(description="E.g., Bank vault, commercial truck, elderly person")
    timing: str = Field(description="E.g., Late night, business hours")
    entry_method: str = Field(description="E.g., Broken window, phishing, fake KYC")
    tools: str = Field(description="E.g., Blowtorch, burner SIM, malware")
    transport: str = Field(description="E.g., Stolen motorcycle, hired tempo")
    concealment: str = Field(description="E.g., Shell companies, masked faces")
    action_sequence: str = Field(description="Step by step sequence of the crime")
    victim_interaction: str = Field(description="How the victim was engaged")
    exit_method: str = Field(description="How they escaped or moved funds")
    group_behavior: str = Field(description="E.g., Highly organized, lone wolf")

class CaseSchema(BaseModel):
    crime_no: str
    police_station: str
    crime_category: str
    crime_major_head: str
    brief_facts: str
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777

class FIROutputSchema(BaseModel):
    case: CaseSchema
    persons: List[PersonSchema]
    phones: List[PhoneSchema]
    vehicles: List[VehicleSchema]
    accounts: List[AccountSchema]
    organizations: List[OrganizationSchema]
    mo_fingerprint: MOFingerprintSchema

# -----------------------------------------------------------------------------
# EXTRACTION LOGIC
# -----------------------------------------------------------------------------
def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().split('.')[-1]
    if ext == 'txt':
        return file_bytes.decode('utf-8', errors='ignore')
    elif ext == 'pdf':
        text = ""
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
        return text.strip()
    elif ext in ['png', 'jpg', 'jpeg']:
        try:
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            raise HTTPException(status_code=500, detail="OCR Failed. Make sure Tesseract is installed.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

def call_llm_for_extraction(text: str) -> FIROutputSchema:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    if not has_genai:
        raise ValueError("google-genai package is not installed.")

    client = genai.Client(api_key=api_key)
    
    prompt = (
        "Extract structured intelligence from the following First Information Report (FIR) text. "
        "Strictly adhere to the provided JSON schema. Ensure all confidences are integers between 0 and 100. "
        "If a specific field is not found in the text, use a reasonable default or empty string/list, but do not omit required fields. "
        f"FIR TEXT:\n\n{text}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FIROutputSchema,
            ),
        )
        data = json.loads(response.text)
        return FIROutputSchema(**data)
    except Exception as e:
        logger.error(f"LLM Extraction failed: {e}")
        raise ValueError(f"LLM Extraction failed: {e}")

# -----------------------------------------------------------------------------
# ENDPOINT
# -----------------------------------------------------------------------------

@router.post("/api/fir/ingest")
async def ingest_fir(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    """
    Real FIR Ingestion Pipeline.
    """
    if not file and not raw_text:
        raise HTTPException(status_code=400, detail="Must provide either file or raw_text")

    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 1. TEXT EXTRACTION
    text_content = ""
    if raw_text:
        text_content = raw_text
    else:
        file_bytes = await file.read()
        text_content = extract_text_from_file(file.filename, file_bytes)

    if not text_content:
        raise HTTPException(status_code=400, detail="No text could be extracted from the input")

    # 2. NLP LLM EXTRACTION
    try:
        structured_data = call_llm_for_extraction(text_content)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 3. SAVE TO DATABASE
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"

    # Document
    supabase.table("cases").upsert({
        "id": case_id,
        "crime_no": structured_data.case.crime_no,
        "case_no": f"FIR-{uuid.uuid4().hex[:4].upper()}",
        "crime_category": structured_data.case.crime_category,
        "crime_major_head": structured_data.case.crime_major_head,
        "crime_minor_head": "Ingested",
        "status": "Under Investigation",
        "registered_date": datetime.utcnow().date().isoformat(),
        "incident_from": datetime.utcnow().isoformat(),
        "latitude": structured_data.case.latitude or 19.0760,
        "longitude": structured_data.case.longitude or 72.8777,
        "police_station": structured_data.case.police_station,
        "brief_facts": structured_data.case.brief_facts
    }).execute()

    supabase.table("fir_documents").upsert({
        "id": doc_id,
        "case_id": case_id,
        "document_type": "FIR",
        "raw_text": text_content
    }).execute()

    # Document Chunk
    chunk_id = f"CHK-{uuid.uuid4().hex[:8].upper()}"
    supabase.table("document_chunks").upsert({
        "id": chunk_id,
        "document_id": doc_id,
        "chunk_index": 0,
        "start_offset": 0,
        "end_offset": len(text_content),
        "chunk_text": text_content[:1000] # truncate for safety in demo
    }).execute()

    person_map = {}
    
    # Save Persons and generate Evidence Spans
    for p in structured_data.persons:
        pid = f"PER-{uuid.uuid4().hex[:8].upper()}"
        person_map[p.name] = pid
        supabase.table("persons").upsert({
            "id": pid,
            "canonical_name": p.name,
            "aliases": p.aliases,
            "status_tag": "Person of Interest",
            "confidence_score": p.confidence
        }).execute()

        supabase.table("person_case_roles").upsert({
            "id": f"ROLE-{uuid.uuid4().hex[:8].upper()}",
            "person_id": pid,
            "case_id": case_id,
            "role_type": p.role if p.role in ['Accused', 'Key Suspect', 'Victim', 'Complainant', 'Witness', 'Co-conspirator'] else 'Witness'
        }).execute()
        
        # Evidence Span
        supabase.table("extraction_spans").upsert({
            "id": f"SPAN-{uuid.uuid4().hex[:8].upper()}",
            "document_id": doc_id,
            "chunk_id": chunk_id,
            "start_offset": max(0, text_content.find(p.name)),
            "end_offset": max(0, text_content.find(p.name)) + len(p.name),
            "text_snippet": p.name,
            "entity_type": "Person",
            "entity_value": pid,
            "extraction_method": "google-genai-gemini-2.5-flash",
            "confidence": p.confidence
        }).execute()

    # Save Phones
    for ph in structured_data.phones:
        ph_id = f"PH-{uuid.uuid4().hex[:8].upper()}"
        supabase.table("phones").upsert({
            "id": ph_id,
            "normalized_number_hash": ph.number,
            "owner_person_id": person_map.get(ph.owner_name) if ph.owner_name else None,
            "first_seen": datetime.utcnow().date().isoformat(),
            "last_seen": datetime.utcnow().date().isoformat()
        }).execute()

    # Save Vehicles
    for v in structured_data.vehicles:
        v_id = f"VEH-{uuid.uuid4().hex[:8].upper()}"
        supabase.table("vehicles").upsert({
            "id": v_id,
            "registration_hash": v.registration,
            "vehicle_type": v.make_model or "Unknown",
            "owner_person_id": person_map.get(v.owner_name) if v.owner_name else None,
            "make_model": v.make_model,
            "color": v.color
        }).execute()
        
    # MO Fingerprint
    supabase.table("mo_fingerprints").upsert({
        "id": f"MO-{uuid.uuid4().hex[:8].upper()}",
        "case_id": case_id,
        "target": structured_data.mo_fingerprint.target,
        "timing": structured_data.mo_fingerprint.timing,
        "entry_method": structured_data.mo_fingerprint.entry_method,
        "tools": structured_data.mo_fingerprint.tools,
        "transport": structured_data.mo_fingerprint.transport,
        "concealment": structured_data.mo_fingerprint.concealment,
        "action_sequence": structured_data.mo_fingerprint.action_sequence,
        "victim_interaction": structured_data.mo_fingerprint.victim_interaction,
        "exit_method": structured_data.mo_fingerprint.exit_method,
        "group_behavior": structured_data.mo_fingerprint.group_behavior,
        "confidence": 90
    }).execute()

    return {
        "status": "COMPLETED",
        "case_id": case_id,
        "extracted": structured_data.model_dump()
    }
