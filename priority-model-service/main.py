import os
import json
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

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

DEFAULT_FEATURE_ORDER = [
    "network_centrality",
    "direct_connection_count",
    "observed_vs_inferred_ratio",
    "avg_relationship_confidence",
    "role_weight",
    "prior_case_count",
    "mo_case_match_flag",
    "evidence_count",
    "alert_count",
    "avg_alert_confidence"
]


def load_model_and_features():
    """Load model artifact and feature sequence once at application startup."""
    global loaded_model, feature_order

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
        logger.info("feature_order.json not found, initializing default sequence")
        feature_order = DEFAULT_FEATURE_ORDER

    # 2. Load Model Artifact (joblib)
    model_paths = [
        os.path.join(MODEL_DIR, "suspect_priority_model.joblib"),
        os.path.join(BASE_DIR, "suspect_priority_model.joblib")
    ]
    for p in model_paths:
        if os.path.exists(p):
            try:
                loaded_model = joblib.load(p)
                logger.info("✓ Successfully loaded Suspect Priority Model artifact from %s", p)
                break
            except Exception as e:
                logger.error("Failed to load model file at %s: %s", p, e)

    if loaded_model is None:
        logger.warning(
            "Model artifact 'suspect_priority_model.joblib' not found in model/ or root. Running in calibrated fallback mode."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application Lifespan Event: Pre-load model & features at startup."""
    logger.info("Initializing Suspect Priority Score Microservice...")
    load_model_and_features()
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
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5200",
        "http://127.0.0.1:5200",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# REQUEST PYDANTIC SCHEMA
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
    return {
        "status": "ok",
        "service": "Suspect Priority Scoring Microservice",
        "model_loaded": bool(loaded_model is not None),
        "model_path": MODEL_PATH,
        "feature_count": len(feature_order) if feature_order else len(DEFAULT_FEATURE_ORDER)
    }


@app.post("/score", response_model=SuspectScoreResponse, status_code=status.HTTP_200_OK)
def compute_priority_score(payload: SuspectScoreRequest):
    """
    Compute suspect priority score from 10 feature values.
    Validates input schema and passes aligned feature vector to the loaded model.
    """
    features_dict = payload.model_dump()

    # Determine ordered feature vector
    active_order = feature_order if feature_order else DEFAULT_FEATURE_ORDER
    ordered_values = [features_dict[f] for f in active_order if f in features_dict]

    if len(ordered_values) != len(active_order):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing feature values. Expected {len(active_order)} features, got {len(ordered_values)}"
        )

    # Inference using loaded model artifact
    if loaded_model is not None:
        try:
            X = np.array([ordered_values], dtype=np.float32)
            prediction = loaded_model.predict(X)
            # If model returns array or scalar
            score_val = float(prediction[0]) if hasattr(prediction, "__getitem__") else float(prediction)
            final_score = float(np.clip(score_val, 0.0, 100.0))
        except Exception as e:
            logger.error("Error during model inference: %s. Falling back to calibrated computation.", e)
            final_score = fallback_priority_calculation(features_dict)
    else:
        final_score = fallback_priority_calculation(features_dict)

    return SuspectScoreResponse(priority_score=round(final_score, 1))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
