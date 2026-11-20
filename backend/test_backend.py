import unittest
import json
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app
from log_storage import log_storage
from alert_engine import alert_engine

class LogScopeBackendTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_01_health_endpoint(self):
        resp = self.app.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("status", data)
        self.assertIn("components", data)
        self.assertIn("elasticsearch", data["components"])
        self.assertIn("backend_api", data["components"])
        self.assertIn("logstash", data["components"])
        self.assertIn("filebeat", data["components"])

    def test_02_dashboard_stats(self):
        resp = self.app.get("/api/dashboard/stats")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("total_logs", data)
        self.assertIn("error_count", data)
        self.assertIn("warning_count", data)
        self.assertIn("critical_count", data)
        self.assertIn("activity_timeline", data)
        self.assertIn("service_distribution", data)

    def test_03_generate_error_and_alert(self):
        resp = self.app.post("/api/demo/generate-error", json={
            "service": "Payment Service",
            "message": "Unit test payment timeout failure"
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["log"]["level"], "ERROR")
        self.assertEqual(data["log"]["service"], "Payment Service")

        # Verify alert was created
        alert_resp = self.app.get("/api/alerts?severity=ERROR")
        self.assertEqual(alert_resp.status_code, 200)
        alerts_data = alert_resp.get_json()
        self.assertGreater(alerts_data["total"], 0)
        
        # Check active status
        active_alert = alerts_data["alerts"][0]
        self.assertEqual(active_alert["status"], "ACTIVE")

    def test_04_generate_critical_and_alert(self):
        resp = self.app.post("/api/demo/generate-critical", json={
            "service": "Database Service",
            "message": "Unit test database partition crash"
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["log"]["level"], "CRITICAL")

        # Verify alert was created
        alert_resp = self.app.get("/api/alerts?severity=CRITICAL")
        self.assertEqual(alert_resp.status_code, 200)
        alerts_data = alert_resp.get_json()
        self.assertGreater(alerts_data["total"], 0)

    def test_05_acknowledge_alert(self):
        # Fetch an active alert
        alert_resp = self.app.get("/api/alerts?status=ACTIVE")
        alerts = alert_resp.get_json()["alerts"]
        if alerts:
            target_id = alerts[0]["id"]
            ack_resp = self.app.patch(f"/api/alerts/{target_id}/acknowledge", json={"user": "Prof_Reviewer"})
            self.assertEqual(ack_resp.status_code, 200)
            ack_data = ack_resp.get_json()
            self.assertEqual(ack_data["alert"]["status"], "ACKNOWLEDGED")
            self.assertEqual(ack_data["alert"]["acknowledged_by"], "Prof_Reviewer")

    def test_06_logs_pagination_and_filters(self):
        resp = self.app.get("/api/logs?page=1&limit=5&level=ERROR")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("logs", data)
        self.assertIn("total", data)
        self.assertIn("pages", data)
        for l in data["logs"]:
            self.assertEqual(l["level"], "ERROR")

    def test_07_logs_search(self):
        resp = self.app.get("/api/logs/search?q=payment")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("logs", data)

    def test_08_analytics_endpoint(self):
        resp = self.app.get("/api/analytics")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("volume_over_time", data)
        self.assertIn("severity_distribution", data)
        self.assertIn("service_distribution", data)
        self.assertIn("top_error_services", data)

    def test_09_services_endpoint(self):
        resp = self.app.get("/api/services")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("services", data)
        self.assertEqual(len(data["services"]), 5)
        first_srv = data["services"][0]
        self.assertIn("name", first_srv)
        self.assertIn("status", first_srv)
        self.assertIn("simulated_hardware_metrics", first_srv)
        self.assertTrue(first_srv["simulated_hardware_metrics"]["is_simulated"])

    def test_10_high_frequency_error_alert_rule(self):
        # Trigger 6 quick errors for Authentication Service
        for i in range(6):
            self.app.post("/api/demo/generate-error", json={
                "service": "Authentication Service",
                "message": f"Burst authentication error #{i}"
            })
        
        # Verify high-frequency alert is triggered
        alert_resp = self.app.get("/api/alerts?severity=CRITICAL")
        alerts = alert_resp.get_json()["alerts"]
        high_freq_found = any("High-Frequency" in a["rule_name"] for a in alerts)
        self.assertTrue(high_freq_found, "High-Frequency alert should trigger on >5 errors in 60s")

if __name__ == "__main__":
    unittest.main()
