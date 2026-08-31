import os
import json
import logging
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

import joblib
import numpy as np
import xgboost as xgb
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

try:
    from groq import Groq
    has_groq = True
except ImportError:
    has_groq = False

# Configure institutional logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("CIU-PriorityScorer")

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "suspect_priority_model.joblib")
FEATURE_ORDER_PATH = os.path.join(MODEL_DIR, "feature_order.json")

# Global state loaded once at startup
loaded_model = None
feature_order: List[str] = []
model_status = "OK"

ALLOW_HEURISTIC_FALLBACK = os.getenv("ALLOW_HEURISTIC_FALLBACK", "false").lower() == "true"
GROQ_REASONING_MODEL = os.getenv("GROQ_REASONING_MODEL", "llama-3.1-8b-instant")

FEATURE_HUMAN_LABELS = {
    "network_centrality": "network bridge centrality",
    "direct_connection_count": "direct graph connections",
    "observed_vs_inferred_ratio": "verified evidence ratio",
    "avg_relationship_confidence": "relationship confidence",
    "role_weight": "investigative role severity",
    "prior_case_count": "prior case involvements",
    "mo_case_match_flag": "modus operandi serial match",
    "evidence_count": "linked evidence logs",
    "alert_count": "active intelligence alerts",
    "avg_alert_confidence": "alert confidence score"
}

def load_model_and_features():
    """Load model artifact and feature sequence once at application startup."""
    global loaded_model, feature_order, model_status

    # 1. Load Feature Order
    feature_paths = [
        os.path.join(MODEL_DIR, "feature_order.json"),
        os.path.join(BASE_DIR, "feature_order.json")
    ]
    for p in feature_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    feature_order = json.load(f)
                logger.info("✓ Loaded feature order configuration from %s (%d features)", p, len(feature_order))
                break
            except Exception as e:
                logger.warning("Could not parse %s (%s)", p, e)

    if not feature_order:
        logger.error("CRITICAL: feature_order.json not found or invalid.")
        model_status = "UNAVAILABLE"
        return

    # 2. Load Model Artifact (joblib)
    model_paths = [
        os.path.join(MODEL_DIR, "suspect_priority_model.joblib"),
        os.path.join(BASE_DIR, "suspect_priority_model.joblib")
    ]
    for p in model_paths:
        if os.path.exists(p):
            try:
                loaded_model = joblib.load(p)
                # Quick shape check if possible
                if hasattr(loaded_model, "n_features_in_") and loaded_model.n_features_in_ != len(feature_order):
                    logger.error("CRITICAL: Model expects %d features, but %d are provided in feature_order.json", 
                                 loaded_model.n_features_in_, len(feature_order))
                    loaded_model = None
                    model_status = "UNAVAILABLE"
                    return
                logger.info("✓ Successfully loaded Suspect Priority Model artifact from %s", p)
                break
            except Exception as e:
                logger.error("Failed to load model file at %s: %s", p, e)

    if loaded_model is None:
        logger.error("CRITICAL: Model artifact 'suspect_priority_model.joblib' not found or failed to load.")
        model_status = "UNAVAILABLE"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application Lifespan Event: Pre-load model & features at startup."""
    logger.info("Initializing Suspect Priority Score Microservice...")
    load_model_and_features()
    if model_status == "UNAVAILABLE" and not ALLOW_HEURISTIC_FALLBACK:
        logger.warning("Service starting in degraded UNAVAILABLE state with no heuristic fallback.")
    yield
    logger.info("Shutting down Suspect Priority Score Microservice.")


app = FastAPI(
    title="CIU Suspect Priority Scoring Microservice",
    description="Standalone XGBoost-based Suspect Priority Scoring API for NETRA Criminal Intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# -----------------------------------------------------------------------------
# CORS CONFIGURATION
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://netra-gilt.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from ingestion import router as ingestion_router
    app.include_router(ingestion_router)
    logger.info("✓ Mounted FIR Ingestion router")
except Exception as e:
    logger.warning("Could not mount ingestion router: %s", e)

try:
    from embedder import router as embedder_router
    app.include_router(embedder_router)
    logger.info("✓ Mounted MO Embedder router")
except Exception as e:
    logger.warning("Could not mount embedder router: %s", e)


# -----------------------------------------------------------------------------
# REQUEST / RESPONSE PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class SuspectScoreRequest(BaseModel):
    network_centrality: float = Field(
        ...,
        description="Graph centrality index (e.g. normalized degree or betweenness, 0.0 to 1.0)"
    )
    direct_connection_count: int = Field(
        ...,
        ge=0,
        description="Number of direct 1-hop connections in criminal intelligence graph"
    )
    observed_vs_inferred_ratio: float = Field(
        ...,
        ge=0.0,
        description="Ratio of verified observed relationships to total edges"
    )
    avg_relationship_confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Average confidence percentage across linked edges (0 to 100)"
    )
    role_weight: float = Field(
        ...,
        ge=0.0,
        description="Categorical role severity weight (e.g. Accused=1.0, Key Suspect=0.85, Associate=0.6)"
    )
    prior_case_count: int = Field(
        ...,
        ge=0,
        description="Historical FIR registered case involvements"
    )
    mo_case_match_flag: int = Field(
        ...,
        ge=0,
        le=1,
        description="Binary indicator: 1 if modus operandi matches active serial pattern, 0 otherwise"
    )
    evidence_count: float = Field(
        ...,
        ge=0.0,
        description="Total direct physical or digital evidence logs linked"
    )
    alert_count: int = Field(
        ...,
        ge=0,
        description="Count of active anomaly or link-prediction intelligence alerts"
    )
    avg_alert_confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Average confidence percentage of linked intelligence alerts (0 to 100)"
    )

    @field_validator("mo_case_match_flag")
    @classmethod
    def validate_binary_flag(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError("mo_case_match_flag must be strictly 0 or 1")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "network_centrality": 0.78,
                "direct_connection_count": 8,
                "observed_vs_inferred_ratio": 0.85,
                "avg_relationship_confidence": 92.0,
                "role_weight": 1.0,
                "prior_case_count": 4,
                "mo_case_match_flag": 1,
                "evidence_count": 6.0,
                "alert_count": 3,
                "avg_alert_confidence": 88.5
            }
        }
    }


class SuspectScoreResponse(BaseModel):
    priority_score: float = Field(
        ...,
        description="Calculated suspect priority score rounded to 1 decimal place (0.0 to 100.0)"
    )
    model_name: str = Field(..., description="Name of the model used to compute the score")
    model_version: str = Field(..., description="Version of the model")
    feature_version: str = Field(..., description="Version/Hash of the feature schema used")
    generated_at: str = Field(..., description="ISO-8601 timestamp of score generation")
    model_mode: str = Field(..., description="Either 'production' or 'fallback_heuristic'")


class SuspectExplainRequest(BaseModel):
    person_name: Optional[str] = Field("Suspect", description="Name or label of the person")
    role: Optional[str] = Field("Accused", description="Investigative role classification")
    priority_score: Optional[float] = Field(None, description="Score calculated by /score")
    network_centrality: float = Field(..., description="Graph centrality index")
    direct_connection_count: int = Field(..., ge=0, description="Direct 1-hop connections")
    observed_vs_inferred_ratio: float = Field(..., ge=0.0, description="Verified edges ratio")
    avg_relationship_confidence: float = Field(..., ge=0.0, le=100.0, description="Relationship confidence")
    role_weight: float = Field(..., ge=0.0, description="Role severity weight")
    prior_case_count: int = Field(..., ge=0, description="Historical FIR involvements")
    mo_case_match_flag: int = Field(..., ge=0, le=1, description="Modus operandi match flag")
    evidence_count: float = Field(..., ge=0.0, description="Linked physical/digital evidence")
    alert_count: int = Field(..., ge=0, description="Active anomaly alerts")
    avg_alert_confidence: float = Field(..., ge=0.0, le=100.0, description="Average alert confidence")
    shap_values: Optional[Dict[str, float]] = Field(None, description="Optional pre-computed SHAP values")

    @field_validator("mo_case_match_flag")
    @classmethod
    def validate_binary_flag(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError("mo_case_match_flag must be strictly 0 or 1")
        return v


class FeatureContribution(BaseModel):
    feature: str
    label: str
    shap_value: float
    impact: str  # "positive" | "negative"


class SuspectExplainResponse(BaseModel):
    priority_score: float = Field(..., description="Target priority score (0.0 to 100.0)")
    reasoning: str = Field(..., description="1-2 sentence plain English explanation")
    reasoning_source: str = Field(..., description="'llm' for AI-generated reasoning, 'feature_summary' for template fallback")
    top_contributions: List[FeatureContribution] = Field(default_factory=list, description="Top SHAP feature drivers")
    generated_at: str = Field(..., description="ISO-8601 timestamp")


# -----------------------------------------------------------------------------
# SHAP FEATURE IMPORTANCE COMPUTATION
# -----------------------------------------------------------------------------
def compute_shap_contributions(features_dict: dict, active_order: List[str]) -> Dict[str, float]:
    """
    Computes exact TreeSHAP feature contributions using XGBoost's native booster predict.
    Falls back to calibrated heuristic attribution if model is not loaded.
    """
    ordered_values = [features_dict.get(f, 0.0) for f in active_order]

    if loaded_model is not None and model_status == "OK":
        try:
            X = np.array([ordered_values], dtype=np.float32)
            booster = loaded_model.get_booster()
            dmatrix = xgb.DMatrix(X)
            # pred_contribs=True returns SHAP values for all features + bias term as the last element
            contribs = booster.predict(dmatrix, pred_contribs=True)[0]
            shap_dict = {}
            for i, feat in enumerate(active_order):
                shap_dict[feat] = round(float(contribs[i]), 2)
            return shap_dict
        except Exception as e:
            logger.warning("Error computing TreeSHAP contributions from XGBoost: %s", e)

    # Heuristic attribution fallback
    return {
        "network_centrality": round(float(features_dict.get("network_centrality", 0.0)) * 25.0, 2),
        "role_weight": round(float(features_dict.get("role_weight", 0.5)) * 20.0, 2),
        "prior_case_count": round(min(15.0, float(features_dict.get("prior_case_count", 0)) * 3.0), 2),
        "mo_case_match_flag": round(float(features_dict.get("mo_case_match_flag", 0)) * 10.0, 2),
        "direct_connection_count": round(min(15.0, float(features_dict.get("direct_connection_count", 0)) * 1.5), 2),
        "evidence_count": round(min(10.0, float(features_dict.get("evidence_count", 0.0)) * 1.2), 2),
        "alert_count": round(min(10.0, float(features_dict.get("alert_count", 0)) * 2.0), 2),
        "observed_vs_inferred_ratio": round(float(features_dict.get("observed_vs_inferred_ratio", 0.0)) * 5.0, 2),
        "avg_relationship_confidence": round((float(features_dict.get("avg_relationship_confidence", 50.0)) / 100.0) * 5.0, 2),
        "avg_alert_confidence": round((float(features_dict.get("avg_alert_confidence", 0.0)) / 100.0) * 5.0, 2)
    }


def generate_feature_summary(top_contributions: List[FeatureContribution], priority_score: float, person_name: str, role: str) -> str:
    """
    Deterministic fallback explanation built directly from the top SHAP features as a formatted sentence.
    """
    if not top_contributions:
        return f"{person_name} assigned a priority score of {priority_score} based on overall graph and case indicators."

    positive_drivers = [c.label for c in top_contributions if c.shap_value > 0]
    if positive_drivers:
        driver_str = ", ".join(positive_drivers[:3])
        return f"Top contributing factors: {driver_str}. Presents elevated investigative relevance based on graph patterns."
    else:
        driver_str = ", ".join([c.label for c in top_contributions[:3]])
        return f"Top contributing factors: {driver_str}."


def generate_llm_reasoning(
    person_name: str,
    role: str,
    priority_score: float,
    top_contributions: List[FeatureContribution]
) -> tuple[str, str]:
    """
    Calls Groq LLM to convert numeric SHAP contributions into 1-2 plain English sentences.
    Returns (reasoning_text, reasoning_source) where reasoning_source is 'llm' or 'feature_summary'.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    if not has_groq:
        raise ValueError("groq library is not installed.")

    # Format top contributions concisely for LLM prompt
    contrib_lines = []
    for c in top_contributions:
        sign = "+" if c.shap_value >= 0 else ""
        contrib_lines.append(f"- {c.feature} ({c.label}): {sign}{c.shap_value} pts")
    contrib_text = "\n".join(contrib_lines) if contrib_lines else "No dominant SHAP features"

    prompt = (
        "You are an objective criminal intelligence assistant analyzing investigative priority factors for a suspect node.\n\n"
        f"Subject: {person_name} ({role})\n"
        f"Assigned Priority Score: {priority_score}/100\n"
        f"Top Feature Contributions (SHAP importance):\n{contrib_text}\n\n"
        "TASK:\n"
        "Write exactly ONE or TWO plain English sentences explaining why this subject received their priority score based strictly on the contribution values provided above.\n\n"
        "CRITICAL RULES:\n"
        "1. Base your explanation ONLY on the provided numeric contributions and role. Do NOT hallucinate or invent outside facts, locations, or incidents.\n"
        "2. NEVER assign guilt, accuse of crimes, or make legal characterizations (do NOT say 'is guilty of', 'is a criminal', 'committed the crime').\n"
        "3. Use objective investigative language (e.g., 'warrants prioritized review due to...', 'shows a pattern consistent with...', 'reflects elevated network bridge centrality').\n"
        "4. Return plain text only. Do not use bullet points or markdown formatting."
    )

    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model=GROQ_REASONING_MODEL,
            temperature=0.1,
            max_tokens=150
        )
        raw_text = chat_completion.choices[0].message.content if chat_completion.choices else ""
        if raw_text and raw_text.strip():
            reasoning_text = raw_text.strip()
            return reasoning_text, "llm"
        else:
            logger.warning("Groq returned empty response text, using fallback feature summary.")
            return generate_feature_summary(top_contributions, priority_score, person_name, role), "feature_summary"
    except Exception as e:
        logger.error("Groq LLM reasoning generation failed: %s", e)
        return generate_feature_summary(top_contributions, priority_score, person_name, role), "feature_summary"


# -----------------------------------------------------------------------------
# FALLBACK HEURISTIC PREDICTOR
# -----------------------------------------------------------------------------
def fallback_priority_calculation(features_dict: dict) -> float:
    """
    Calibrated domain heuristic used when model.joblib has not yet been placed on disk.
    Computes a grounded composite priority score matching CIU risk assessment criteria.
    """
    c_net = float(features_dict.get("network_centrality", 0.0)) * 25.0
    c_deg = min(15.0, float(features_dict.get("direct_connection_count", 0)) * 1.5)
    c_role = float(features_dict.get("role_weight", 0.5)) * 20.0
    c_cases = min(15.0, float(features_dict.get("prior_case_count", 0)) * 3.0)
    c_mo = float(features_dict.get("mo_case_match_flag", 0)) * 10.0
    c_evi = min(10.0, float(features_dict.get("evidence_count", 0.0)) * 1.2)
    c_alrt = min(10.0, float(features_dict.get("alert_count", 0)) * 2.0)
    c_conf = (float(features_dict.get("avg_relationship_confidence", 50.0)) / 100.0) * 5.0

    raw_score = c_net + c_deg + c_role + c_cases + c_mo + c_evi + c_alrt + c_conf
    return float(np.clip(raw_score, 0.0, 99.5))


# -----------------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------------
@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Health check endpoint for monitoring, deployment, and status checks."""
    if model_status == "UNAVAILABLE" and not ALLOW_HEURISTIC_FALLBACK:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model unavailable")
        
    return {
        "status": "ok" if model_status == "OK" else "degraded",
        "service": "Suspect Priority Scoring Microservice",
        "model_loaded": bool(loaded_model is not None),
        "model_path": MODEL_PATH,
        "feature_count": len(feature_order) if feature_order else 0,
        "fallback_enabled": ALLOW_HEURISTIC_FALLBACK,
        "groq_configured": bool(os.environ.get("GROQ_API_KEY"))
    }


@app.post("/score", response_model=SuspectScoreResponse, status_code=status.HTTP_200_OK)
def compute_priority_score(payload: SuspectScoreRequest):
    """
    Compute suspect priority score from 10 feature values.
    Validates input schema and passes aligned feature vector to the loaded model.
    """
    if model_status == "UNAVAILABLE" and not ALLOW_HEURISTIC_FALLBACK:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "MODEL_UNAVAILABLE", "message": "Priority model unavailable"}
        )

    features_dict = payload.model_dump()
    active_order = feature_order
    
    if not active_order:
        active_order = list(features_dict.keys())

    ordered_values = [features_dict.get(f, 0.0) for f in active_order]

    model_mode = "production"
    final_score = 0.0

    # Inference using loaded model artifact
    if loaded_model is not None and model_status == "OK":
        try:
            X = np.array([ordered_values], dtype=np.float32)
            prediction = loaded_model.predict(X)
            score_val = float(prediction[0]) if hasattr(prediction, "__getitem__") else float(prediction)
            final_score = float(np.clip(score_val, 0.0, 100.0))
        except Exception as e:
            logger.error("Error during model inference: %s.", e)
            if ALLOW_HEURISTIC_FALLBACK:
                logger.warning("Falling back to calibrated computation.")
                final_score = fallback_priority_calculation(features_dict)
                model_mode = "fallback_heuristic"
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={"error": "MODEL_INFERENCE_FAILED", "message": "Failed to compute score."}
                )
    else:
        # Fallback explicitly allowed
        final_score = fallback_priority_calculation(features_dict)
        model_mode = "fallback_heuristic"

    return SuspectScoreResponse(
        priority_score=round(final_score, 1),
        model_name="CIU-XGBoost-Priority",
        model_version="1.0" if model_mode == "production" else "fallback",
        feature_version=str(len(active_order)),
        generated_at=datetime.now(timezone.utc).isoformat(),
        model_mode=model_mode
    )


@app.post("/explain", response_model=SuspectExplainResponse, status_code=status.HTTP_200_OK)
def explain_priority_score(payload: SuspectExplainRequest):
    """
    Generate natural language reasoning for a suspect priority score using SHAP feature importances and Groq LLM.
    Returns plain English sentences grounded strictly in the top SHAP contributions.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "GROQ_API_KEY_MISSING", "message": "GROQ_API_KEY is not configured for reasoning generation"}
        )

    features_dict = payload.model_dump()
    active_order = feature_order if feature_order else [
        "network_centrality", "direct_connection_count", "observed_vs_inferred_ratio",
        "avg_relationship_confidence", "role_weight", "prior_case_count",
        "mo_case_match_flag", "evidence_count", "alert_count", "avg_alert_confidence"
    ]

    # Calculate score if not provided
    score = payload.priority_score
    if score is None:
        if loaded_model is not None and model_status == "OK":
            ordered_values = [features_dict.get(f, 0.0) for f in active_order]
            X = np.array([ordered_values], dtype=np.float32)
            prediction = loaded_model.predict(X)
            score = round(float(np.clip(prediction[0], 0.0, 100.0)), 1)
        else:
            score = round(fallback_priority_calculation(features_dict), 1)

    # Compute or use SHAP contributions
    if payload.shap_values:
        shap_dict = payload.shap_values
    else:
        shap_dict = compute_shap_contributions(features_dict, active_order)

    # Extract top 3-4 contributors by magnitude
    sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_contributions: List[FeatureContribution] = []
    for feat_name, shap_val in sorted_features[:4]:
        human_label = FEATURE_HUMAN_LABELS.get(feat_name, feat_name.replace("_", " "))
        top_contributions.append(FeatureContribution(
            feature=feat_name,
            label=human_label,
            shap_value=shap_val,
            impact="positive" if shap_val >= 0 else "negative"
        ))

    # Generate reasoning using Groq LLM (with fallback to feature summary on LLM error)
    reasoning_text, reasoning_source = generate_llm_reasoning(
        person_name=payload.person_name or "Suspect",
        role=payload.role or "Accused",
        priority_score=score,
        top_contributions=top_contributions
    )

    return SuspectExplainResponse(
        priority_score=score,
        reasoning=reasoning_text,
        reasoning_source=reasoning_source,
        top_contributions=top_contributions,
        generated_at=datetime.now(timezone.utc).isoformat()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
