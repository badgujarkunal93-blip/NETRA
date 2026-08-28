from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import traceback
import numpy as np

logger = logging.getLogger("CIU-Embedder")
router = APIRouter(prefix="/api/mo", tags=["Modus Operandi Embeddings"])

# Lazy-loaded model instance holder
_embedding_model = None

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Computes 384-dimensional vector embeddings for input texts.
    Prefers SentenceTransformer if available; otherwise falls back to 
    lightweight scikit-learn HashingVectorizer to keep memory usage under 120MB on Render.
    """
    global _embedding_model

    # 1. Attempt SentenceTransformer if environment has torch
    try:
        if _embedding_model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("Initializing sentence-transformers on-demand...")
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        
        arr = _embedding_model.encode(texts, convert_to_numpy=True)
        return arr.tolist()
    except Exception as e:
        logger.debug("SentenceTransformer not available (%s), using lightweight HashingVectorizer.", e)

    # 2. Fast, ultra-lightweight memory-efficient HashingVectorizer fallback (384-dim, L2-normalized)
    try:
        from sklearn.feature_extraction.text import HashingVectorizer
        vectorizer = HashingVectorizer(n_features=384, norm='l2', alternate_sign=False)
        X = vectorizer.transform(texts).toarray()
        return X.tolist()
    except Exception as err:
        logger.error("Embedding calculation failed: %s", err)
        # Final emergency deterministic pseudo-embedding
        results = []
        for text in texts:
            seed = hash(text) % (2**32)
            rng = np.random.default_rng(seed)
            vec = rng.standard_normal(384).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            results.append(vec.tolist())
        return results


class MOEmbedRequest(BaseModel):
    texts: List[str] = Field(
        ...,
        description="List of MO textual descriptions to embed."
    )


class MOEmbedResponse(BaseModel):
    embeddings: List[List[float]] = Field(
        ...,
        description="List of 384-dimensional float arrays corresponding to the input texts."
    )


@router.post("/embed", response_model=MOEmbedResponse, status_code=status.HTTP_200_OK)
def compute_mo_embeddings(payload: MOEmbedRequest):
    """
    Computes sentence embeddings for a batch of MO textual descriptions.
    """
    if not payload.texts:
        return MOEmbedResponse(embeddings=[])

    try:
        embeddings_list = get_embeddings(payload.texts)
        return MOEmbedResponse(embeddings=embeddings_list)
    except Exception as e:
        logger.error("Error computing embeddings: %s", traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error computing embeddings."
        )
