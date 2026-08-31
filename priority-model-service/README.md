# CIU Suspect Priority Scoring Microservice

Standalone XGBoost-based microservice and training pipeline for the NETRA Criminal Intelligence system.

---

## 1. Overview

The Suspect Priority Scoring Microservice evaluates suspect risk by analyzing 10 normalized graph and intelligence features. It is built using **FastAPI**, **scikit-learn**, **XGBoost**, and **Joblib**.

### Feature Schema (Strict Sequence)
Defined in `model/feature_order.json`:
1. `network_centrality` (float, `0.0` - `1.0`): Normalized graph centrality index.
2. `direct_connection_count` (int, `>= 0`): 1-hop graph neighbors in criminal intelligence network.
3. `observed_vs_inferred_ratio` (float, `0.0` - `1.0`): Ratio of verified observed edges to total edges.
4. `avg_relationship_confidence` (float, `0.0` - `100.0`): Average relationship edge confidence percentage.
5. `role_weight` (float, `0.0` - `1.0`): Categorical role weight (e.g. Mastermind `1.0`, Enforcer `0.85`, Courier `0.5`).
6. `prior_case_count` (int, `>= 0`): Count of historical FIR case involvements.
7. `mo_case_match_flag` (int, `0` or `1`): Binary indicator of active modus operandi pattern match.
8. `evidence_count` (float, `>= 0.0`): Direct physical/digital evidence logs linked.
9. `alert_count` (int, `>= 0`): Count of active anomaly or link-prediction alerts.
10. `avg_alert_confidence` (float, `0.0` - `100.0`): Mean confidence percentage of linked alerts.

---

## 2. Model Training Pipeline

The training pipeline trains an `XGBRegressor` on ground truth samples and verifies model performance against an institutional quality threshold (`RMSE <= 15.0`) before saving the serialized model.

### Dataset Location
- **Ground Truth**: `data/ground_truth/priority_labels.json`

### Running the Training Pipeline

#### Standard Training & Serialization
```bash
python train_model.py
```
This performs:
1. Feature sequence validation against `model/feature_order.json`.
2. Ground truth loading and validation.
3. 80/20 train/test split.
4. XGBoost training (`n_estimators=100`, `learning_rate=0.08`, `max_depth=4`, `subsample=0.9`).
5. Evaluation metrics calculation (RMSE, MAE, R²).
6. Verification against `RMSE <= 15.0` threshold.
7. Serialization to `model/suspect_priority_model.joblib`.

#### Dry Run Mode (Validation Without Overwriting)
```bash
python train_model.py --dry-run
```
Evaluates the current dataset and reports metrics without saving changes to disk.

---

## 3. Configuration & Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `ALLOW_HEURISTIC_FALLBACK` | `false` | When set to `true`, the `/score` and `/health` endpoints fall back to domain heuristic scoring if the model artifact is missing or corrupted. When `false`, returns strict `503 Service Unavailable`. |
| `PORT` | `8000` | Port for the FastAPI server. |
| `GROQ_API_KEY` | `""` | Groq API key required for suspect priority LLM reasoning (`/explain`). |
| `GROQ_REASONING_MODEL` | `"llama-3.1-8b-instant"` | Groq LLM model name for suspect priority explainability. Can be changed to `llama-3.3-70b-versatile`. |
| `GEMINI_API_KEY` | `""` | Google Gemini API key used for FIR LLM extraction pipeline. |

---

## 4. API Reference

### Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "service": "Suspect Priority Scoring Microservice",
  "model_loaded": true,
  "model_path": ".../model/suspect_priority_model.joblib",
  "feature_count": 10,
  "fallback_enabled": false,
  "groq_configured": true
}
```

### Suspect Priority Scoring
- **Endpoint**: `POST /score`
- **Request Body**:
```json
{
  "network_centrality": 0.85,
  "direct_connection_count": 12,
  "observed_vs_inferred_ratio": 0.90,
  "avg_relationship_confidence": 95.0,
  "role_weight": 1.0,
  "prior_case_count": 5,
  "mo_case_match_flag": 1,
  "evidence_count": 8.0,
  "alert_count": 4,
  "avg_alert_confidence": 90.0
}
```
- **Response Body**:
```json
{
  "priority_score": 93.4,
  "model_name": "CIU-XGBoost-Priority",
  "model_version": "1.0",
  "feature_version": "10",
  "generated_at": "2026-08-27T10:56:37.587000+00:00",
  "model_mode": "production"
}
```

### Suspect Priority Explanation (SHAP + LLM Reasoning)
- **Endpoint**: `POST /explain`
- **Request Body**:
```json
{
  "person_name": "Vikram Sethi",
  "role": "Accused",
  "priority_score": 82.5,
  "network_centrality": 0.85,
  "direct_connection_count": 12,
  "observed_vs_inferred_ratio": 0.90,
  "avg_relationship_confidence": 95.0,
  "role_weight": 1.0,
  "prior_case_count": 5,
  "mo_case_match_flag": 1,
  "evidence_count": 8.0,
  "alert_count": 4,
  "avg_alert_confidence": 90.0
}
```
- **Response Body**:
```json
{
  "priority_score": 82.5,
  "reasoning": "Ranked as elevated priority primarily due to central graph connectivity and a matching prior MO pattern.",
  "reasoning_source": "llm",
  "top_contributions": [
    {
      "feature": "observed_vs_inferred_ratio",
      "label": "verified evidence ratio",
      "shap_value": 23.59,
      "impact": "positive"
    },
    {
      "feature": "role_weight",
      "label": "investigative role severity",
      "shap_value": 4.08,
      "impact": "positive"
    }
  ],
  "generated_at": "2026-08-31T13:27:00.000000+00:00"
}
```

---

## 5. Running Tests

Run the test suite:
```bash
python -m unittest test_scoring.py
```
This tests:
- Startup artifact loading and feature alignment.
- Accurate prediction scores for high-risk and low-risk profiles.
- SHAP feature importance extraction and top contribution ranking.
- LLM-generated reasoning and fallback to deterministic feature summary.
- Strict `503 Service Unavailable` handling on model or key degradation.
- Safe heuristic fallback behavior when `ALLOW_HEURISTIC_FALLBACK=true`.
- Pydantic payload validation and error handling.

