"""
LOGSCOPE - Live Log Generator
Generates realistic server and microservice logs every 2-3 seconds.
Outputs standard JSON lines to logs/app.log for Filebeat collection and Logstash ingestion.
"""

import os
import sys
import time
import json
import random
import uuid
import argparse
from datetime import datetime, timezone

# Ensure logs directory exists
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "app.log")

SERVICES = [
    "Authentication Service",
    "Payment Service",
    "API Gateway",
    "Database Service",
    "Web Server"
]

LEVELS = ["INFO", "DEBUG", "WARNING", "ERROR", "CRITICAL"]

# Realistic hostnames mapped to services
HOSTNAMES = {
    "Authentication Service": ["auth-node-01.prod.internal", "auth-node-02.prod.internal"],
    "Payment Service": ["payment-gw-01.prod.internal", "payment-gw-02.prod.internal"],
    "API Gateway": ["api-edge-proxy-01.prod.internal", "api-edge-proxy-02.prod.internal"],
    "Database Service": ["postgres-primary-01.db.internal", "redis-cache-01.db.internal"],
    "Web Server": ["web-nginx-front-01.dmz.internal", "web-nginx-front-02.dmz.internal"]
}

# Typical IP addresses
IP_ADDRESSES = [
    "192.168.1.104", "192.168.1.155", "10.0.12.44", "10.0.14.88",
    "172.16.20.10", "172.16.20.15", "198.51.100.24", "203.0.113.195",
    "49.207.180.12", "157.240.22.35", "142.250.190.46"
]

MESSAGES = {
    "Authentication Service": {
        "INFO": [
            "User session established successfully for user_id={user_id}",
            "OAuth2 token validated for client_id={client_id}",
            "Multi-factor authentication challenge completed for session_{sess_id}",
            "User permissions cached in Redis key user:perm:{user_id}"
        ],
        "DEBUG": [
            "Password hash verification completed in {ms}ms",
            "Parsing bearer token from Authorization header",
            "Refreshing expired JWT refresh token token_ref_{sess_id}"
        ],
        "WARNING": [
            "Failed login attempt detected from IP {ip} for user_id={user_id}",
            "Expired authentication token presented by client {client_id}",
            "Rate limit approaching for IP {ip}: 45/50 requests in 60s"
        ],
        "ERROR": [
            "LDAP directory service timeout while authenticating user_{user_id}",
            "Failed to decrypt user credentials: RSA key invalid or corrupted",
            "Authentication service failed to reach auth-cache store"
        ],
        "CRITICAL": [
            "Brute-force attack threshold exceeded from IP {ip}: 25 failed logins in 10s",
            "Secret key decryption master key integrity check failed",
            "Auth service token signing service completely unreachable"
        ]
    },
    "Payment Service": {
        "INFO": [
            "Payment transaction tx_{tx_id} completed successfully: amount=${amount}",
            "Stripe webhook charge.succeeded processed for invoice_inv_{tx_id}",
            "Payment method card_ending_{card_digits} verified for customer_{user_id}",
            "Refund ref_{tx_id} successfully issued to original payment source"
        ],
        "DEBUG": [
            "Constructing idempotency key for payment order_{tx_id}",
            "Calling bank partner settlement gateway api.bankpartner.com",
            "PCI-DSS compliance token masked successfully for card token"
        ],
        "WARNING": [
            "Payment gateway API response latency exceeded 1500ms (actual: {ms}ms)",
            "Card issuer declined payment tx_{tx_id}: Insufficient funds",
            "Currency conversion rate stale for EUR/USD, using cached fallback"
        ],
        "ERROR": [
            "Payment processor timeout after 5000ms for transaction tx_{tx_id}",
            "Bank settlement API returned HTTP 502 Bad Gateway for payment tx_{tx_id}",
            "Payment audit ledger write failed: connection pool exhausted"
        ],
        "CRITICAL": [
            "Payment gateway webhook verification failure: potential spoofed callback",
            "Database deadlock detected during multi-party transaction settlement",
            "Payment double-spend detection triggered for transaction tx_{tx_id}"
        ]
    },
    "API Gateway": {
        "INFO": [
            "HTTP GET /api/v1/orders returned 200 OK in {ms}ms",
            "HTTP POST /api/v1/checkout routed to Payment Service in {ms}ms",
            "HTTP GET /api/v1/products returned 200 OK (size: {bytes} bytes)",
            "Incoming request from {ip} matched rate limit tier: Standard"
        ],
        "DEBUG": [
            "Header X-Correlation-ID injected: {req_id}",
            "Upstream health check succeeded for target group web-cluster",
            "TLS 1.3 handshake completed with cipher TLS_AES_256_GCM_SHA384"
        ],
        "WARNING": [
            "Upstream service latency spike: Payment Service took {ms}ms (>1000ms threshold)",
            "Client {ip} requested unknown route /wp-login.php (HTTP 404)",
            "Request payload size {bytes} bytes exceeds optimal 1MB compression guideline"
        ],
        "ERROR": [
            "Upstream connection failed: 504 Gateway Timeout on /api/v1/analytics",
            "Circuit breaker tripped for upstream service: Database Service (open state)",
            "TLS certificate validation failed for partner endpoint webhook.partner.com"
        ],
        "CRITICAL": [
            "DDoS mitigation engaged: incoming request flood exceeding 50,000 req/sec",
            "All upstream nodes in service pool Payment Service reported UNHEALTHY",
            "API Gateway memory threshold exceeded (>95% buffer allocation)"
        ]
    },
    "Database Service": {
        "INFO": [
            "Query SELECT * FROM orders executed in {ms}ms, returned 12 rows",
            "Automated VACUUM completed on table orders_partition_2026",
            "Database connection pool active: 18/50 connections in use",
            "Write-Ahead Log (WAL) segment 000000010000001B archived"
        ],
        "DEBUG": [
            "Index scan on idx_orders_customer_id used index condition",
            "Buffer cache hit ratio: 99.4% over past 10 minutes",
            "Replication lag on read-replica db-rep-01: 4ms"
        ],
        "WARNING": [
            "Slow query detected: query on customer_activity took {ms}ms (>2000ms)",
            "Connection pool usage at 85% capacity (42/50 connections)",
            "Disk space on database volume /var/lib/postgresql/data at 82% capacity"
        ],
        "ERROR": [
            "Transaction rollback: deadlock detected with process id 28419",
            "Connection refused to read replica postgres-replica-02:5432",
            "Unique constraint violation: duplicate key value violates unique index users_email_key"
        ],
        "CRITICAL": [
            "Corrupt data page detected in tablespace pg_default block 49102",
            "PostgreSQL primary database failed to accept writes: Read-Only filesystem mounted",
            "Storage volume /var/lib/postgresql/data reached 99.8% capacity: OOM panic imminent"
        ]
    },
    "Web Server": {
        "INFO": [
            "Nginx access: \"GET /dashboard HTTP/1.1\" 200 4812 \"Mozilla/5.0\"",
            "Static asset /static/bundle.min.js served from HTTP cache (304 Not Modified)",
            "Worker process 4120 resumed normal keep-alive cycle",
            "Nginx SSL configuration reloaded successfully with zero downtime"
        ],
        "DEBUG": [
            "Client keep-alive connection retained: timeout set to 65s",
            "Gzip compression saved 68% bandwidth on HTML payload",
            "Proxy buffer allocated 64k for upstream response headers"
        ],
        "WARNING": [
            "Client closed connection prematurely while reading response body",
            "404 Not Found: Request for /apple-touch-icon.png from IP {ip}",
            "Nginx worker process connection limit warning: 900/1024 connections active"
        ],
        "ERROR": [
            "Worker process 4120 terminated with signal 11 (Segmentation fault)",
            "502 Bad Gateway: connect() to unix:/var/run/flask.sock failed (Connection refused)",
            "Failed to open file /var/www/html/assets/app.chunk.js: Permission denied"
        ],
        "CRITICAL": [
            "Zero web server workers available: Nginx emergency stop initiated",
            "SSL private key file /etc/ssl/certs/server.key unreadable or tampered",
            "SYN flood attack detected on port 443 from botnet subnet 185.220.101.0/24"
        ]
    }
}

def format_message(template, service, level):
    """Interpolates realistic parameters into the log message."""
    user_id = random.randint(1001, 9999)
    client_id = f"client_{random.randint(100, 999)}"
    sess_id = uuid.uuid4().hex[:8]
    tx_id = uuid.uuid4().hex[:10].upper()
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    card_digits = random.randint(1000, 9999)
    amount = f"{random.uniform(12.50, 489.99):.2f}"
    ms = random.randint(15, 3400) if level in ["WARNING", "ERROR"] else random.randint(3, 140)
    bytes_val = random.randint(512, 1048576)
    ip = random.choice(IP_ADDRESSES)

    msg = template.format(
        user_id=user_id,
        client_id=client_id,
        sess_id=sess_id,
        tx_id=tx_id,
        req_id=req_id,
        card_digits=card_digits,
        amount=amount,
        ms=ms,
        bytes=bytes_val,
        ip=ip
    )
    return msg

def generate_log_entry(service=None, level=None, custom_message=None):
    """Creates a single dictionary adhering to the required LOGSCOPE schema."""
    if not service:
        service = random.choice(SERVICES)
    if not level:
        # Weighted distribution: mostly INFO/DEBUG, some WARNING, occasional ERROR, rare CRITICAL
        level = random.choices(
            LEVELS,
            weights=[55, 20, 14, 8, 3],
            k=1
        )[0]

    hostname = random.choice(HOSTNAMES.get(service, ["host-node-01.internal"]))
    ip_address = random.choice(IP_ADDRESSES)
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    if custom_message:
        message = custom_message
    else:
        templates = MESSAGES.get(service, {}).get(level, ["Standard system operation log event"])
        template = random.choice(templates)
        message = format_message(template, service, level)

    return {
        "timestamp": timestamp,
        "level": level,
        "service": service,
        "hostname": hostname,
        "ip_address": ip_address,
        "message": message,
        "request_id": req_id
    }

def write_log(entry, filepath=LOG_FILE):
    """Appends the log entry as a clean single-line JSON to the log file."""
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
        f.flush()

def generate_single_log(level="ERROR", service=None, message=None, filepath=LOG_FILE):
    """Direct callable interface for Manual Test Buttons and Backend API."""
    if not service:
        service = random.choice(SERVICES)
    entry = generate_log_entry(service=service, level=level, custom_message=message)
    write_log(entry, filepath)
    return entry

def main():
    parser = argparse.ArgumentParser(description="LOGSCOPE Live Log Generator")
    parser.add_argument("--interval", type=float, default=2.5, help="Seconds between log generation (default 2.5s)")
    parser.add_argument("--count", type=int, default=0, help="Number of logs to generate (0 = infinite)")
    parser.add_argument("--level", type=str, default=None, choices=LEVELS, help="Force specific log level")
    parser.add_argument("--service", type=str, default=None, choices=SERVICES, help="Force specific service")
    parser.add_argument("--once", action="store_true", help="Generate single log and exit")
    args = parser.parse_args()

    print(f"[*] LOGSCOPE Log Generator started.")
    print(f"[*] Writing logs to: {os.path.abspath(LOG_FILE)}")

    if args.once:
        entry = generate_single_log(level=args.level or "INFO", service=args.service)
        print(f"[+] Generated 1 log: {entry['level']} | {entry['service']} | {entry['message']}")
        return

    count = 0
    try:
        while True:
            # Vary interval slightly between 2.0 and 3.0 seconds as specified in requirement 3
            entry = generate_log_entry(service=args.service, level=args.level)
            write_log(entry)
            count += 1
            print(f"[{entry['timestamp']}] {entry['level']:<8} | {entry['service']:<22} | {entry['message'][:60]}...")
            
            if args.count > 0 and count >= args.count:
                print(f"[*] Finished generating {count} logs.")
                break
                
            sleep_time = random.uniform(2.0, 3.0) if args.interval == 2.5 else args.interval
            time.sleep(sleep_time)
    except KeyboardInterrupt:
        print("\n[*] Log generator stopped by user.")

if __name__ == "__main__":
    main()
