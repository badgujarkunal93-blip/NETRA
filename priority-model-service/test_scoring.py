import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
import main

class TestPriorityScoringService(unittest.TestCase):
    def setUp(self):
        # Reload model state for clean test baseline
        main.load_model_and_features()
        self.client = TestClient(main.app)

    def test_health_endpoint_healthy(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["model_loaded"])
        self.assertEqual(data["feature_count"], 10)

    def test_score_endpoint_success(self):
        payload = {
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
        response = self.client.post("/score", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn("priority_score", data)
        self.assertGreaterEqual(data["priority_score"], 0.0)
        self.assertLessEqual(data["priority_score"], 100.0)
        self.assertEqual(data["model_name"], "CIU-XGBoost-Priority")
        self.assertEqual(data["model_version"], "1.0")
        self.assertEqual(data["model_mode"], "production")
        self.assertEqual(data["feature_version"], "10")
        self.assertIn("generated_at", data)
        
        # High risk profile should receive a high priority score
        self.assertGreater(data["priority_score"], 75.0)

    def test_score_endpoint_low_risk(self):
        payload = {
            "network_centrality": 0.05,
            "direct_connection_count": 1,
            "observed_vs_inferred_ratio": 0.10,
            "avg_relationship_confidence": 20.0,
            "role_weight": 0.1,
            "prior_case_count": 0,
            "mo_case_match_flag": 0,
            "evidence_count": 0.0,
            "alert_count": 0,
            "avg_alert_confidence": 0.0
        }
        response = self.client.post("/score", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLess(data["priority_score"], 40.0)

    def test_score_validation_error_invalid_binary_flag(self):
        payload = {
            "network_centrality": 0.5,
            "direct_connection_count": 2,
            "observed_vs_inferred_ratio": 0.5,
            "avg_relationship_confidence": 50.0,
            "role_weight": 0.5,
            "prior_case_count": 1,
            "mo_case_match_flag": 5,  # Invalid: must be 0 or 1
            "evidence_count": 1.0,
            "alert_count": 0,
            "avg_alert_confidence": 0.0
        }
        response = self.client.post("/score", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_score_model_unavailable_strict_503(self):
        # Simulate model unavailable with ALLOW_HEURISTIC_FALLBACK = False
        with patch.object(main, "model_status", "UNAVAILABLE"), \
             patch.object(main, "ALLOW_HEURISTIC_FALLBACK", False):
            payload = {
                "network_centrality": 0.5,
                "direct_connection_count": 2,
                "observed_vs_inferred_ratio": 0.5,
                "avg_relationship_confidence": 50.0,
                "role_weight": 0.5,
                "prior_case_count": 1,
                "mo_case_match_flag": 0,
                "evidence_count": 1.0,
                "alert_count": 0,
                "avg_alert_confidence": 0.0
            }
            response = self.client.post("/score", json=payload)
            self.assertEqual(response.status_code, 503)
            data = response.json()
            self.assertEqual(data["detail"]["error"], "MODEL_UNAVAILABLE")

    def test_score_model_unavailable_heuristic_fallback(self):
        # Simulate model unavailable with ALLOW_HEURISTIC_FALLBACK = True
        with patch.object(main, "model_status", "UNAVAILABLE"), \
             patch.object(main, "ALLOW_HEURISTIC_FALLBACK", True):
            payload = {
                "network_centrality": 0.5,
                "direct_connection_count": 2,
                "observed_vs_inferred_ratio": 0.5,
                "avg_relationship_confidence": 50.0,
                "role_weight": 0.5,
                "prior_case_count": 1,
                "mo_case_match_flag": 0,
                "evidence_count": 1.0,
                "alert_count": 0,
                "avg_alert_confidence": 0.0
            }
            response = self.client.post("/score", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["model_mode"], "fallback_heuristic")
            self.assertEqual(data["model_version"], "fallback")
            self.assertGreater(data["priority_score"], 0.0)

if __name__ == "__main__":
    unittest.main()
