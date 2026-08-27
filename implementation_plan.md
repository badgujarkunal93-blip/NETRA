# Priority Model Hardening & Training Pipeline Plan

This plan addresses the silent fallback issue in the Priority Model service by enforcing strict model loading constraints and introducing a reproducible training pipeline.

## Proposed Changes

### 1. Ground Truth Storage
Following the established pattern in the project, I will implement a dedicated JSON file for ground truth rather than overloading the database schema.
- **[NEW] `data/ground_truth/priority_labels.json`**: Will store an array of objects mapping `person_id` to a target `priority_score` (0-100) and the array of features for training.

### 2. Service Hardening (`priority-model-service/main.py`)
- **Startup Validation**: The application startup hook will validate the presence of `suspect_priority_model.joblib` and `feature_order.json`. If missing or corrupt, it will set an internal `model_status = "UNAVAILABLE"` state.
- **Strict Default Behavior**: If `model_status == "UNAVAILABLE"`, the `/score` endpoint will return an `HTTP 503` with `{"error": "MODEL_UNAVAILABLE", "message": "Priority model unavailable"}`.
- **Heuristic Fallback Configuration**: Introduce an environment variable `ALLOW_HEURISTIC_FALLBACK` (defaults to `false`). Only if explicitly set to `"true"`, the `/score` endpoint will use `fallback_priority_calculation()`.
- **Response Schema Enrichment**: `SuspectScoreResponse` will be expanded to include:
  - `priority_score`
  - `model_name` (e.g., "CIU-XGBoost-Priority")
  - `model_version` (e.g., "1.0")
  - `feature_version`
  - `generated_at` (ISO-8601 timestamp)
  - `model_mode` (will output `"fallback_heuristic"` if the fallback is active)

### 3. Training Pipeline (`priority-model-service/train_model.py`)
- **[NEW] `train_model.py`**: A dedicated Python script using `xgboost` and `scikit-learn` to:
  1. Load data from `data/ground_truth/priority_labels.json`.
  2. Parse features strictly according to `model/feature_order.json`.
  3. Perform an 80/20 train/test split.
  4. Train an `XGBRegressor`.
  5. Evaluate against a baseline RMSE (e.g., must be `< 15.0`).
  6. Serialize and save the model to `model/suspect_priority_model.joblib` *only* if the threshold is beaten and `--dry-run` is not active.

### 4. Documentation
- **[MODIFY] `priority-model-service/README.md`**: Add instructions on how to use `train_model.py` (including `--dry-run`), when to retrain (e.g., upon ground truth updates), and how to configure `ALLOW_HEURISTIC_FALLBACK` for local development.

## User Review Required
> [!IMPORTANT]
> - Ground truth labels will be stored in `data/ground_truth/priority_labels.json`. Does this path and format work for your CI/CD pipeline?
> - The minimum performance threshold for the model to be saved is proposed as an RMSE `< 15.0`. Is this acceptable, or would you prefer a different metric (like R² or MAE)?
