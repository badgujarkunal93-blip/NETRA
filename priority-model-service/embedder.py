from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List
import logging
import traceback

logger = logging.getLogger("CIU-Embedder")
router = APIRouter(prefix="/api/mo", tags=["Modus Operandi Embeddings"])

# Load model globally once
try:
    from sentence_transformers import SentenceTransformer
    # all-MiniLM-L6-v2 is small, fast, and yields a 384-dimensional vector
    logger.info("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("Successfully loaded 'all-MiniLM-L6-v2'.")
except Exception as e:
    logger.error(f"Failed to load sentence-transformers model: {e}")
    embedding_model = None


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
    Uses the globally loaded all-MiniLM-L6-v2 model.
    """
    if embedding_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model is not loaded."
        )

    if not payload.texts:
        return MOEmbedResponse(embeddings=[])

    try:
        # Compute embeddings (returns a numpy array)
        embeddings_array = embedding_model.encode(payload.texts, convert_to_numpy=True)
        # Convert numpy array to list of lists of floats
        embeddings_list = embeddings_array.tolist()
        return MOEmbedResponse(embeddings=embeddings_list)
    except Exception as e:
        logger.error(f"Error computing embeddings: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error computing embeddings."
        )
