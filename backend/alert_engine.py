import time
import uuid
from datetime import datetime, timezone
from collections import defaultdict, deque

class AlertEngine:
    def __init__(self):
        self.alerts = []
        # Service error tracking: service -> deque of (timestamp_epoch, req_id)
        self.service_errors = defaultdict(deque)
        # Avoid duplicate high-frequency alert spam within cooldown window (e.g., 30s)
        self.last_high_freq_alert = {}

    def process_log(self, log_entry):
        """
        Evaluates a log entry against alert rules:
        Rule 1: Any ERROR generates an ERROR alert.
        Rule 2: Any CRITICAL generates a CRITICAL alert.
        Rule 3: >5 ERRORs from the same service within 60s generates a HIGH-FREQUENCY alert.
        """
        level = (log_entry.get("level") or "").upper()
        service = log_entry.get("service") or "Unknown Service"
        message = log_entry.get("message") or ""
        req_id = log_entry.get("request_id") or ""
        timestamp = log_entry.get("timestamp") or datetime.now(timezone.utc).isoformat()
        
        now = time.time()
        generated_alerts = []

        # Rule 1: ERROR alert
        if level == "ERROR":
            alert = {
                "id": f"alert-{uuid.uuid4().hex[:10]}",
                "rule_name": "Service Error Detected",
                "severity": "ERROR",
                "service": service,
                "message": f"Error reported by {service}: {message[:120]}",
                "timestamp": timestamp,
                "status": "ACTIVE",
                "acknowledged_at": None,
                "acknowledged_by": None,
                "request_id": req_id,
                "raw_log": log_entry
            }
            self.alerts.insert(0, alert)
            generated_alerts.append(alert)

            # Track service error for Rule 3
            q = self.service_errors[service]
            q.append((now, req_id))
            # Prune older than 60s
            while q and q[0][0] < now - 60:
                q.popleft()

            # Rule 3 check: > 5 errors in 60s
            if len(q) > 5:
                last_time = self.last_high_freq_alert.get(service, 0)
                if now - last_time > 30: # 30s cooldown per service
                    hf_alert = {
                        "id": f"alert-{uuid.uuid4().hex[:10]}",
                        "rule_name": "High-Frequency Error Storm (>5 errors in 60s)",
                        "severity": "CRITICAL",
                        "service": service,
                        "message": f"Alert Storm: {service} produced {len(q)} errors in the last 60 seconds!",
                        "timestamp": timestamp,
                        "status": "ACTIVE",
                        "acknowledged_at": None,
                        "acknowledged_by": None,
                        "request_id": req_id,
                        "raw_log": log_entry
                    }
                    self.alerts.insert(0, hf_alert)
                    generated_alerts.append(hf_alert)
                    self.last_high_freq_alert[service] = now

        # Rule 2: CRITICAL alert
        elif level == "CRITICAL":
            alert = {
                "id": f"alert-{uuid.uuid4().hex[:10]}",
                "rule_name": "Critical Infrastructure Failure",
                "severity": "CRITICAL",
                "service": service,
                "message": f"CRITICAL INCIDENT on {service}: {message[:140]}",
                "timestamp": timestamp,
                "status": "ACTIVE",
                "acknowledged_at": None,
                "acknowledged_by": None,
                "request_id": req_id,
                "raw_log": log_entry
            }
            self.alerts.insert(0, alert)
            generated_alerts.append(alert)

        return generated_alerts

    def acknowledge_alert(self, alert_id, user="Operator"):
        """Acknowledges an active alert."""
        for alert in self.alerts:
            if alert["id"] == alert_id:
                alert["status"] = "ACKNOWLEDGED"
                alert["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
                alert["acknowledged_by"] = user
                return alert
        return None

    def get_alerts(self, status=None, severity=None, service=None, limit=100):
        """Retrieves filtered alerts."""
        results = self.alerts
        if status and status.upper() != "ALL":
            results = [a for a in results if a["status"].upper() == status.upper()]
        if severity and severity.upper() != "ALL":
            results = [a for a in results if a["severity"].upper() == severity.upper()]
        if service and service.upper() != "ALL":
            results = [a for a in results if a["service"].lower() == service.lower()]

        active_count = sum(1 for a in self.alerts if a["status"] == "ACTIVE")
        ack_count = sum(1 for a in self.alerts if a["status"] == "ACKNOWLEDGED")

        return {
            "alerts": results[:limit],
            "total": len(results),
            "active_count": active_count,
            "acknowledged_count": ack_count
        }

alert_engine = AlertEngine()
