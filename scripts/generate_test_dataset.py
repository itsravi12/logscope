"""
LOGSCOPE - Comprehensive Test Dataset Generator for Academic Demonstration
Generates a rich, realistic set of 500+ microservice logs spanning recent time up to the current minute.
Guarantees all dashboard KPI cards, ingestion timelines, service distributions, and alert rules
(including High-Frequency error storms and Critical incidents) are actively visible for presentation.
"""

import os
import sys
import json
import random
import uuid
from datetime import datetime, timezone, timedelta

# Import message definitions from generate_logs
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

from generate_logs import SERVICES, LEVELS, HOSTNAMES, IP_ADDRESSES, MESSAGES, format_message

LOGS_DIR = os.path.join(ROOT_DIR, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
APP_LOG_PATH = os.path.join(LOGS_DIR, "app.log")
SHOWCASE_LOG_PATH = os.path.join(LOGS_DIR, "test_showcase_logs.json")

def generate_showcase_dataset(total_logs=450):
    now = datetime.now(timezone.utc)
    entries = []

    # 1. Distribute logs over the past 2 hours with higher concentration in the last 15 minutes
    # This guarantees the real-time timeline chart is beautifully populated.
    for i in range(total_logs - 50):
        # Time distribution: 70% in last 15 mins, 30% in past 2 hours
        if random.random() < 0.70:
            seconds_ago = random.randint(5, 900) # 5 seconds to 15 minutes ago
        else:
            seconds_ago = random.randint(900, 7200) # 15 mins to 2 hours ago

        ts = (now - timedelta(seconds=seconds_ago)).isoformat()
        service = random.choice(SERVICES)
        level = random.choices(LEVELS, weights=[50, 22, 14, 10, 4], k=1)[0]
        
        hostname = random.choice(HOSTNAMES.get(service, ["srv-node-01.internal"]))
        ip = random.choice(IP_ADDRESSES)
        req_id = f"req-{uuid.uuid4().hex[:8]}"

        templates = MESSAGES.get(service, {}).get(level, ["Standard system execution log event"])
        template = random.choice(templates)
        msg = format_message(template, service, level)

        entries.append({
            "id": f"log-demo-{len(entries)+1}",
            "timestamp": ts,
            "level": level,
            "service": service,
            "hostname": hostname,
            "ip_address": ip,
            "message": msg,
            "request_id": req_id
        })

    # 2. Add an intentional "High-Frequency Error Storm" for Payment Service (6 errors within 45s)
    # This triggers Rule 3: High-Frequency Error Storm (>5 errors in 60s)
    storm_service = "Payment Service"
    for j in range(7):
        storm_ts = (now - timedelta(seconds=random.randint(10, 50))).isoformat()
        entries.append({
            "id": f"log-demo-storm-{j+1}",
            "timestamp": storm_ts,
            "level": "ERROR",
            "service": storm_service,
            "hostname": HOSTNAMES[storm_service][0],
            "ip_address": "10.0.12.44",
            "message": f"Payment gateway API timeout after 5000ms: settlement transaction failure batch #{j+1001}",
            "request_id": f"req-storm-pay-{j+1}"
        })

    # 3. Add intentional CRITICAL incidents across Database Service & Web Server
    entries.append({
        "id": "log-demo-crit-1",
        "timestamp": (now - timedelta(seconds=120)).isoformat(),
        "level": "CRITICAL",
        "service": "Database Service",
        "hostname": "postgres-primary-01.db.internal",
        "ip_address": "10.0.12.44",
        "message": "Storage volume /var/lib/postgresql/data reached 99.8% capacity: OOM panic imminent",
        "request_id": "req-crit-db-001"
    })

    entries.append({
        "id": "log-demo-crit-2",
        "timestamp": (now - timedelta(seconds=240)).isoformat(),
        "level": "CRITICAL",
        "service": "Web Server",
        "hostname": "web-nginx-front-01.dmz.internal",
        "ip_address": "198.51.100.24",
        "message": "SYN flood attack detected on port 443 from botnet subnet 185.220.101.0/24: Rate 75,000 req/s",
        "request_id": "req-crit-web-002"
    })

    entries.append({
        "id": "log-demo-crit-3",
        "timestamp": (now - timedelta(seconds=400)).isoformat(),
        "level": "CRITICAL",
        "service": "API Gateway",
        "hostname": "api-edge-proxy-01.prod.internal",
        "ip_address": "172.16.20.10",
        "message": "DDoS mitigation engaged: incoming request flood exceeding 50,000 req/sec on route /api/v1/checkout",
        "request_id": "req-crit-gw-003"
    })

    # Sort chronologically by timestamp
    entries.sort(key=lambda x: x["timestamp"])

    # Write out to app.log (active log monitored by backend & Filebeat)
    with open(APP_LOG_PATH, "w", encoding="utf-8") as f:
        for item in entries:
            f.write(json.dumps(item) + "\n")

    # Also save as pretty JSON showcase file
    with open(SHOWCASE_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)

    print("=" * 70)
    print(" LOGSCOPE - TEST DATASET GENERATED SUCCESSFULLY FOR TEACHER DEMO")
    print("=" * 70)
    print(f" [+] Total logs generated:      {len(entries)}")
    print(f" [+] Output monitored log:     {APP_LOG_PATH}")
    print(f" [+] Showcase JSON file:       {SHOWCASE_LOG_PATH}")
    print(f" [+] Services covered:         {', '.join(SERVICES)}")
    print(f" [+] Timestamp window:         {(now - timedelta(hours=2)).strftime('%H:%M:%S')} -> {now.strftime('%H:%M:%S')} (UTC)")
    print(" [+] Pre-configured scenarios:")
    print("     - High-Frequency Error Storm: Payment Service (7 errors in 50s)")
    print("     - Critical Storage Incident: Database Service OOM warning")
    print("     - DDoS & SYN Flood Attacks: Web Server & API Gateway")
    print("     - Multi-level balance: INFO (50%), DEBUG (22%), WARN (14%), ERROR (11%), CRITICAL (3%)")
    print("=" * 70)

if __name__ == "__main__":
    generate_showcase_dataset()
