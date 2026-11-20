import os
import sys
import time
import socket
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add root project directory to path so generate_logs can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from generate_logs import generate_single_log
except ImportError:
    generate_single_log = None

from config import Config
from log_storage import log_storage
from alert_engine import alert_engine
from es_client import es_client

app = Flask(__name__)
# Enable CORS for all routes (supports both Vite port 5173 and preview port 3000)
CORS(app, resources={r"/api/*": {"origins": "*"}})

START_TIME = time.time()

def check_logstash_port(host="localhost", port=5044, timeout=1.0):
    """Probes whether Logstash port is reachable."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

@app.route("/api/health", methods=["GET"])
def get_health():
    """
    GET /api/health
    Returns overall system health, component statuses, and connectivity.
    """
    es_health = es_client.get_health()
    uptime_sec = int(time.time() - START_TIME)
    
    # Check logstash connectivity
    logstash_host = "logstash" if os.path.exists("/.dockerenv") else "localhost"
    logstash_alive = check_logstash_port(host=logstash_host, port=5044)

    # Check file generator status
    log_file = log_storage.log_file_path
    log_file_exists = os.path.exists(log_file)
    log_count = len(log_storage.logs)

    overall_status = "OPERATIONAL" if es_health.get("connected") else "DEGRADED"

    return jsonify({
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_sec,
        "components": {
            "elasticsearch": {
                "name": "Elasticsearch",
                "status": "HEALTHY" if es_health.get("connected") else "DISCONNECTED",
                "connected": es_health.get("connected", False),
                "url": es_health.get("url"),
                "cluster_name": es_health.get("cluster_name", "N/A"),
                "version": es_health.get("version", "N/A"),
                "latency_ms": es_health.get("latency_ms", None),
                "note": "Primary log index & search engine"
            },
            "logstash": {
                "name": "Logstash",
                "status": "HEALTHY" if logstash_alive else "STANDBY / WAITING",
                "port": 5044,
                "listening": logstash_alive,
                "note": "Pipeline processing port 5044"
            },
            "filebeat": {
                "name": "Filebeat",
                "status": "ACTIVE" if log_file_exists else "PENDING",
                "harvesting_path": log_file,
                "note": "Monitors app.log file changes"
            },
            "backend_api": {
                "name": "Flask Backend API",
                "status": "HEALTHY",
                "version": "1.0.0",
                "uptime": f"{uptime_sec}s"
            },
            "log_generator": {
                "name": "Live Log Generator",
                "status": "ACTIVE" if log_count > 0 else "IDLE",
                "monitored_file": log_file,
                "total_indexed_logs": log_count
            }
        }
    }), 200

@app.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """
    GET /api/dashboard/stats
    Returns live statistics for the main dashboard overview.
    """
    try:
        stats = log_storage.get_dashboard_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/logs", methods=["GET"])
def get_logs():
    """
    GET /api/logs
    Query params: page, limit, level, service, search, time_range
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 25))
        level = request.args.get("level", "ALL")
        service = request.args.get("service", "ALL")
        search = request.args.get("search", None)
        time_range = request.args.get("time_range", "all")

        data = log_storage.get_logs(
            query=search,
            level=level,
            service=service,
            time_range=time_range,
            page=page,
            limit=limit
        )
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/logs/search", methods=["GET"])
def search_logs():
    """
    GET /api/logs/search
    Dedicated search endpoint.
    """
    try:
        q = request.args.get("q", "")
        level = request.args.get("level", "ALL")
        service = request.args.get("service", "ALL")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 25))

        data = log_storage.get_logs(
            query=q,
            level=level,
            service=service,
            page=page,
            limit=limit
        )
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    """
    GET /api/analytics
    Returns aggregations for log volume over time, error vs warning, distribution by level & service.
    """
    try:
        data = log_storage.get_analytics()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """
    GET /api/alerts
    Query params: status (ALL, ACTIVE, ACKNOWLEDGED), severity, service, limit
    """
    try:
        status = request.args.get("status", "ALL")
        severity = request.args.get("severity", "ALL")
        service = request.args.get("service", "ALL")
        limit = int(request.args.get("limit", 100))

        data = alert_engine.get_alerts(
            status=status,
            severity=severity,
            service=service,
            limit=limit
        )
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/alerts/<alert_id>/acknowledge", methods=["PATCH", "POST"])
def acknowledge_alert(alert_id):
    """
    PATCH /api/alerts/<id>/acknowledge
    Acknowledges an active alert.
    """
    try:
        user = request.json.get("user", "Console Operator") if request.is_json else "Console Operator"
        updated = alert_engine.acknowledge_alert(alert_id, user=user)
        if not updated:
            return jsonify({"error": f"Alert '{alert_id}' not found"}), 404
        return jsonify({"message": "Alert acknowledged successfully", "alert": updated}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/services", methods=["GET"])
def get_services():
    """
    GET /api/services
    Returns health status of the 5 microservices along with simulated CPU/RAM/Disk.
    """
    try:
        services = log_storage.get_services_status()
        return jsonify({"services": services}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/demo/generate-error", methods=["POST"])
def demo_generate_error():
    """
    POST /api/demo/generate-error
    Generates a real test ERROR log, writes it to the monitored log file,
    indexes it, triggers the alert engine, and returns the resulting event.
    """
    try:
        data = request.get_json(silent=True) or {}
        service = data.get("service")
        message = data.get("message")

        if generate_single_log:
            entry = generate_single_log(level="ERROR", service=service, message=message, filepath=log_storage.log_file_path)
            # Sync into storage immediately
            log_storage.sync_from_file()
        else:
            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "ERROR",
                "service": service or "Payment Service",
                "hostname": "pay-node-01.prod.internal",
                "ip_address": "192.168.1.104",
                "message": message or "Test ERROR event generated manually via Dashboard Demo trigger",
                "request_id": f"req-test-err-{int(time.time())}"
            }
            log_storage.append_log(entry)

        return jsonify({
            "success": True,
            "message": "Real test ERROR log generated and written to monitored log file",
            "log": entry
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/demo/generate-critical", methods=["POST"])
def demo_generate_critical():
    """
    POST /api/demo/generate-critical
    Generates a real test CRITICAL event, writes to monitored log file,
    indexes it, and triggers a Critical Alert.
    """
    try:
        data = request.get_json(silent=True) or {}
        service = data.get("service")
        message = data.get("message")

        if generate_single_log:
            entry = generate_single_log(level="CRITICAL", service=service, message=message, filepath=log_storage.log_file_path)
            log_storage.sync_from_file()
        else:
            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "CRITICAL",
                "service": service or "Database Service",
                "hostname": "db-cluster-primary.internal",
                "ip_address": "10.0.12.44",
                "message": message or "CRITICAL INCIDENT: Test storage partition corruption detected via Dashboard trigger",
                "request_id": f"req-test-crit-{int(time.time())}"
            }
            log_storage.append_log(entry)

        return jsonify({
            "success": True,
            "message": "Real test CRITICAL log generated and written to monitored log file",
            "log": entry
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print(f"[*] LOGSCOPE Flask Backend running on http://{Config.HOST}:{Config.PORT}")
    print(f"[*] Monitored log file: {log_storage.log_file_path}")
    print(f"[*] Initial logs in store: {len(log_storage.logs)}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
