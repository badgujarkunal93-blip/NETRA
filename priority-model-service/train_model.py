import os
import json
import argparse
import logging
from datetime import datetime

import numpy as np
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import root_mean_squared_error, mean_absolute_error, r2_score

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Train-Priority-Model")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
GROUND_TRUTH_PATH = os.path.join(PROJECT_ROOT, "data", "ground_truth", "priority_labels.json")
MODEL_DIR = os.path.join(BASE_DIR, "model")
FEATURE_ORDER_PATH = os.path.join(MODEL_DIR, "feature_order.json")
MODEL_OUTPUT_PATH = os.path.join(MODEL_DIR, "suspect_priority_model.joblib")

RMSE_THRESHOLD = 15.0  # Must beat this RMSE to save

def train_pipeline(dry_run: bool):
    logger.info("Starting Suspect Priority Model Training Pipeline...")
    
    # 1. Load Feature Order
    if not os.path.exists(FEATURE_ORDER_PATH):
        logger.error(f"Feature order configuration not found at {FEATURE_ORDER_PATH}")
        return
    
    with open(FEATURE_ORDER_PATH, "r", encoding="utf-8") as f:
        feature_order = json.load(f)
    
    logger.info(f"Loaded {len(feature_order)} features from configuration.")

    # 2. Load Ground Truth Data
    if not os.path.exists(GROUND_TRUTH_PATH):
        logger.error(f"Ground truth labels not found at {GROUND_TRUTH_PATH}")
        return
        
    with open(GROUND_TRUTH_PATH, "r", encoding="utf-8") as f:
        ground_truth_data = json.load(f)
        
    if not ground_truth_data:
        logger.error("Ground truth dataset is empty.")
        return

    logger.info(f"Loaded {len(ground_truth_data)} labeled samples from ground truth.")

    # 3. Build Feature Matrix (X) and Target Vector (y)
    X_list = []
    y_list = []
    
    for sample in ground_truth_data:
        features_dict = sample.get("features", {})
        target_score = sample.get("target_priority_score")
        
        if target_score is None:
            logger.warning(f"Skipping sample {sample.get('person_id')} - missing target_priority_score.")
            continue
            
        # Parse features strictly according to feature_order
        ordered_values = [features_dict.get(feat, 0.0) for feat in feature_order]
        
        X_list.append(ordered_values)
        y_list.append(target_score)
        
    if len(X_list) < 2:
        logger.error("Not enough valid samples to train the model.")
        return

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    
    logger.info(f"Feature matrix shape: {X.shape}")
    logger.info(f"Target vector shape: {y.shape}")

    # 4. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    logger.info(f"Training on {X_train.shape[0]} samples, evaluating on {X_test.shape[0]} samples.")

    # 5. Train XGBRegressor
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.9,
        random_state=42
    )
    
    logger.info("Training XGBRegressor model...")
    model.fit(X_train, y_train)
    
    # 6. Evaluate
    y_pred = model.predict(X_test)
    
    # Clip predictions to 0-100 logically
    y_pred_clipped = np.clip(y_pred, 0.0, 100.0)
    
    rmse = root_mean_squared_error(y_test, y_pred_clipped)
    mae = mean_absolute_error(y_test, y_pred_clipped)
    r2 = r2_score(y_test, y_pred_clipped)
    
    logger.info(f"Evaluation Metrics -> RMSE: {rmse:.2f}, MAE: {mae:.2f}, R²: {r2:.4f}")
    
    # 7. Save Condition
    if rmse > RMSE_THRESHOLD:
        logger.error(f"Model RMSE ({rmse:.2f}) exceeds threshold ({RMSE_THRESHOLD}). Model rejected.")
        return
        
    logger.info(f"Model meets quality threshold (RMSE {rmse:.2f} <= {RMSE_THRESHOLD}).")
    
    if dry_run:
        logger.info("[DRY RUN] Skipping model serialization.")
        return
        
    # Ensure directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Save Model
    joblib.dump(model, MODEL_OUTPUT_PATH)
    logger.info(f"Model successfully saved to {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the Suspect Priority XGBoost Model")
    parser.add_argument("--dry-run", action="store_true", help="Train and evaluate without overwriting the model file.")
    
    args = parser.parse_args()
    train_pipeline(dry_run=args.dry_run)
