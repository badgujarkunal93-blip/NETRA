import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from ingestion import extract_text_from_file, call_llm_for_extraction, FIROutputSchema
from pydantic import ValidationError

client = TestClient(app)

def test_extract_text_from_txt():
    # Test simple txt file
    text_bytes = b"Hello, this is a test FIR document."
    result = extract_text_from_file("test.txt", text_bytes)
    assert result == "Hello, this is a test FIR document."

@patch("ingestion.has_genai", True)
@patch("ingestion.genai.Client")
@patch.dict("os.environ", {"GEMINI_API_KEY": "fake_key"})
def test_call_llm_for_extraction(mock_client_class):
    mock_client = MagicMock()
    mock_client_class.return_value = mock_client
    
    mock_response = MagicMock()
    # Provide valid JSON output matching FIROutputSchema
    mock_response.text = '''{
        "case": {
            "crime_no": "CR/123/2026-BND",
            "police_station": "Bandra",
            "crime_category": "Theft",
            "crime_major_head": "IPC 379",
            "brief_facts": "Theft of mobile phone."
        },
        "persons": [],
        "phones": [],
        "vehicles": [],
        "accounts": [],
        "organizations": [],
        "mo_fingerprint": {
            "target": "Mobile Phone",
            "timing": "Night",
            "entry_method": "Pickpocketing",
            "tools": "None",
            "transport": "Walking",
            "concealment": "Crowd",
            "action_sequence": "Approached victim -> Stole phone -> Ran away",
            "victim_interaction": "Distraction",
            "exit_method": "Running",
            "group_behavior": "Lone wolf"
        }
    }'''
    mock_client.models.generate_content.return_value = mock_response
    
    result = call_llm_for_extraction("Theft of mobile phone at Bandra.")
    assert isinstance(result, FIROutputSchema)
    assert result.case.crime_no == "CR/123/2026-BND"

@patch("ingestion.has_genai", True)
@patch("ingestion.genai.Client")
@patch.dict("os.environ", {"GEMINI_API_KEY": "fake_key"})
def test_invalid_llm_output(mock_client_class):
    mock_client = MagicMock()
    mock_client_class.return_value = mock_client
    
    mock_response = MagicMock()
    # Missing required 'case' object
    mock_response.text = '''{
        "persons": []
    }'''
    mock_client.models.generate_content.return_value = mock_response
    
    with pytest.raises(ValueError):
        call_llm_for_extraction("Some text.")

@patch("ingestion.get_supabase")
@patch("ingestion.call_llm_for_extraction")
def test_ingest_fir_endpoint(mock_call_llm, mock_get_supabase):
    # Mock LLM response
    mock_data = FIROutputSchema(
        case={"crime_no": "123", "police_station": "Bandra", "crime_category": "Theft", "crime_major_head": "IPC 379", "brief_facts": "test"},
        persons=[], phones=[], vehicles=[], accounts=[], organizations=[],
        mo_fingerprint={"target": "Phone", "timing": "Day", "entry_method": "Snatch", "tools": "None", "transport": "Bike", "concealment": "Helmet", "action_sequence": "Snatch and run", "victim_interaction": "Force", "exit_method": "Fled on bike", "group_behavior": "Duo"}
    )
    mock_call_llm.return_value = mock_data
    
    # Mock Supabase
    mock_supabase = MagicMock()
    mock_get_supabase.return_value = mock_supabase
    
    response = client.post("/api/fir/ingest", data={"raw_text": "Test FIR text."})
    
    assert response.status_code == 200
    json_resp = response.json()
    assert json_resp["status"] == "COMPLETED"
    assert "case_id" in json_resp
    assert json_resp["extracted"]["case"]["crime_no"] == "123"
