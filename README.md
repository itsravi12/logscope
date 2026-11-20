# LOGSCOPE: Cloud Log Analysis and Monitoring Dashboard Using ELK Stack

**Academic Project Demonstration & Implementation**  
**Course:** AI Cloud Practitioner / Cloud Computing & Distributed Systems  
**Institution:** East Point College of Engineering and Technology  
**Student:** Ravi Shankar Kumar  

---

## 1. Executive Summary

**LOGSCOPE** is an enterprise-grade cloud log observability and monitoring platform engineered using the **ELK Stack (Elasticsearch, Logstash, Kibana)** combined with a lightweight **Filebeat** log harvester, a **Flask RESTful API Backend**, and a **React + Vite** high-performance observability dashboard.

The system ingests, normalizes, indexes, and analyzes telemetry and access logs across five critical cloud microservices:
1. **Authentication Service** (`auth-node-*.prod.internal`)
2. **Payment Service** (`payment-gw-*.prod.internal`)
3. **API Gateway** (`api-edge-proxy-*.prod.internal`)
4. **Database Service** (`postgres-primary-*.db.internal`)
5. **Web Server** (`web-nginx-front-*.dmz.internal`)

---

## 2. System Architecture

```text
  +-----------------------------------------------------------------------------------+
  |                              APPLICATION LAYER                                    |
  |  [ Authentication ]  [ Payment ]  [ API Gateway ]  [ Database ]  [ Web Server ]   |
  +-----------------------------------------------------------------------------------+
                                            │
                                            ▼
                           [ generate_logs.py (2.5s stream) ]
                                            │
                                            ▼
                                   [ logs/app.log ]
                                            │
               ┌────────────────────────────┴─────────────────────────────┐
               ▼                                                          ▼
  +─────────────────────────+                                +─────────────────────────+
  |    FILEBEAT HARVESTER   |                                |   FLASK BACKEND ENGINE  |
  | (Monitors logs/app.log) |                                |  - Alert Engine (>5/60s)|
  +─────────────────────────+                                |  - Resilient Ingestion  |
               │                                             |  - Telemetry Endpoints  |
               ▼                                             +─────────────────────────+
  +─────────────────────────+                                             │
  |     LOGSTASH PIPELINE   |                                             │
  | (Port 5044 Beats Ingest)|                                             │
  | (JSON parsing & Grok)   |                                             │
  +─────────────────────────+                                             │
               │                                                          │
               ▼                                                          │
  +─────────────────────────+                                             │
  |  ELASTICSEARCH CLUSTER  | ◄───────────────────────────────────────────┤
  |  (Index: logscope-logs) |                                             │
  +─────────────────────────+                                             │
         │           │                                                    │
         ▼           ▼                                                    ▼
  +─────────────+  +───────────────────────────────────────────────────────────────+
  |  KIBANA UI  |  |                    REACT OBSERVABILITY UI                     |
  | (Port 5601) |  |  - Live Overview & Charts    - Live Logs Drawer & Search      |
  +─────────────+  |  - Alert Management Center   - Service Health & Hardware      |
                   +───────────────────────────────────────────────────────────────+
```

---

## 3. Key Components & Implementation Details

### 3.1 Live Log Generator (`generate_logs.py`)
- Emits structured JSON events every 2–3 seconds into `logs/app.log`.
- Log schema:
  - `timestamp`: UTC ISO-8601 string (`YYYY-MM-DDTHH:MM:SS.mmmmmm+00:00`)
  - `level`: `INFO`, `DEBUG`, `WARNING`, `ERROR`, `CRITICAL`
  - `service`: One of the 5 monitored services
  - `hostname`: Microservice instance hostname
  - `ip_address`: Client or internal network IP
  - `message`: Realistic microservice operational messages
  - `request_id`: Unique tracking identifier (`req-xxxxxxxx`)
- Programmatic API `generate_single_log(level, service, message)` allows manual triggering from both CLI and Dashboard.

### 3.2 Alert Detection Engine (`backend/alert_engine.py`)
Implements real-time stream evaluation matching academic specifications:
1. **Rule 1 (ERROR):** Any `ERROR` event generates an active error alert.
2. **Rule 2 (CRITICAL):** Any `CRITICAL` event generates an active critical incident alert.
3. **Rule 3 (Storm Detection):** If **more than 5 errors** occur from the same service within a **60-second sliding window**, a high-severity `CRITICAL` alert is triggered.
4. **Interactive Lifecycle:** Alerts can be acknowledged by operators in the UI, recording operator timestamp and audit trail.

### 3.3 Backend API (`backend/app.py`)
- `GET /api/health` — Full component health checks (Elasticsearch, Logstash, Filebeat, Flask, Log Generator).
- `GET /api/dashboard/stats` — Live counts, ingestion rate, timeline buckets, service distributions.
- `GET /api/logs` — Full pagination, multi-field search, level filtering, service filtering, time range filtering.
- `GET /api/logs/search` — Dedicated query search.
- `GET /api/analytics` — Aggregated distributions (volume over time, severity share, service share, error rankings).
- `GET /api/alerts` — Active and acknowledged alert states.
- `PATCH /api/alerts/<id>/acknowledge` — Transition alert state to Acknowledged.
- `GET /api/services` — Service health computed from real telemetry + transparent simulated hardware metrics.
- `POST /api/demo/generate-error` — Injects a real test ERROR log.
- `POST /api/demo/generate-critical` — Injects a real test CRITICAL event.

### 3.4 React Dashboard Frontend (`frontend/`)
- **Modern Observability UI:** Built with React 18, Vite, Tailwind CSS, Lucide icons.
- **Top Demonstration Action Buttons:**
  - `GENERATE TEST ERROR`
  - `GENERATE CRITICAL EVENT`
- **Auto-Refresh:** Telemetry polls automatically every 5 seconds.
- **Log Detail Inspection Drawer:** Click any log in the table to slide out complete formatted JSON details with a 1-click **Copy JSON** button.
- **Transparency Mode:** Distinctly tags actual service status vs simulated hardware utilization (CPU, RAM, Disk).

---

## 4. Setup & Running Instructions

### Option A: Direct Local Run on Laptop (Recommended for Quick Demo)

The project includes a standalone launcher `run_prototype.py` that starts the Flask API, React Frontend, and Live Log Generator concurrently on your laptop:

1. **Open PowerShell / Command Prompt** in the project root:
   ```powershell
   cd "D:\AI cloud project"
   ```

2. **Run the prototype:**
   ```powershell
   python run_prototype.py
   ```
   *(Or double-click `start_prototype.bat`)*

3. **Open the browser:**
   - **Dashboard UI:** [http://localhost:5173](http://localhost:5173)
   - **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option B: Full ELK Stack via Docker Compose

To run the complete 6-container stack (Elasticsearch, Logstash, Kibana, Filebeat, Flask, React):

1. **Start all services:**
   ```bash
   docker compose up --build -d
   ```

2. **Verify running containers:**
   ```bash
   docker compose ps
   ```

3. **Access points:**
   - **LOGSCOPE Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Kibana Interface:** [http://localhost:5601](http://localhost:5601)
   - **Elasticsearch API:** [http://localhost:9200](http://localhost:9200)
   - **Flask Backend API:** [http://localhost:5000](http://localhost:5000)

4. **Shutdown command:**
   ```bash
   docker compose down
   ```

---

## 5. Automated Testing

Run the comprehensive unit and integration test suite:

```powershell
python backend\test_backend.py
```
*(Or double-click `run_tests.bat`)*

### Test Coverage Checklist:
- `test_01_health_endpoint`: Probes cluster and component status.
- `test_02_dashboard_stats`: Validates metrics calculation and aggregations.
- `test_03_generate_error_and_alert`: Verifies demo ERROR injection and alert trigger.
- `test_04_generate_critical_and_alert`: Verifies demo CRITICAL injection and alert trigger.
- `test_05_acknowledge_alert`: Tests PATCH acknowledge workflow.
- `test_06_logs_pagination_and_filters`: Validates page bounds, limits, and level filters.
- `test_07_logs_search`: Verifies multi-attribute keyword search.
- `test_08_analytics_endpoint`: Tests severity and time-series histogram bucketing.
- `test_09_services_endpoint`: Verifies telemetry status calculation and simulated metrics.
- `test_10_high_frequency_error_alert_rule`: Verifies alert storm threshold (>5 errors/60s).

---

## 6. Faculty Demonstration Step-by-Step Script

Follow this sequence during your live presentation to the project guide:

1. **System Introduction:**
   - Open [http://localhost:5173](http://localhost:5173).
   - Point out the real-time counters: **Total Logs**, **Errors**, **Warnings**, **Critical Incidents**, and **Ingestion Rate (~0.40 logs/sec)**.
   - Explain how `generate_logs.py` continuously generates synthetic production traffic across the 5 microservices.

2. **Live Ingestion & Visualization:**
   - Show the **Real-Time Ingestion Timeline** updating every 5 seconds.
   - Show the **Service Share** breakdown displaying log proportions across Payment, Auth, Gateway, Database, and Web Server.

3. **Demonstrating "GENERATE TEST ERROR":**
   - Click the orange **`GENERATE TEST ERROR`** button in the top navigation bar.
   - Observe:
     1. Toast notification appears: *"Real test ERROR log appended to app.log!"*
     2. Total Error count on the overview card immediately increments.
     3. Navigate to **Live Logs**: The injected error is at the top of the table.
     4. Click the row to open the **Log Event Inspection Drawer**: Show the complete JSON payload, metadata, and click **Copy JSON**.
     5. Navigate to **Alerts**: Show the newly generated active error alert.

4. **Demonstrating "GENERATE CRITICAL EVENT":**
   - Click the purple **`GENERATE CRITICAL EVENT`** button.
   - Observe:
     1. Critical incident alert triggers in the Alerts page.
     2. Notice the severity indicator pulsing red.
     3. Click **Acknowledge**: Show how the alert transitions from Active to Acknowledged with operator metadata.

5. **Demonstrating Search & Filtering:**
   - On the **Live Logs** page, type `database` or `timeout` in the search bar.
   - Change the Level filter to `ERROR`.
   - Show that only matching logs are displayed.
   - Test pagination with Previous / Next.

6. **Demonstrating Service Monitoring & Analytics:**
   - Open **Service Monitoring**: Show the 5 microservices with their dynamic error rates, operational status, and clearly labeled simulated CPU/RAM/Disk gauges.
   - Open **Analytics**: Show the log volume over time, error vs warning proportions, and the ranked top error-generating services.

---

## 7. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| Port 5000 already in use | Previous Python instance still running | Run `Get-Process python \| Stop-Process -Force` in PowerShell |
| Port 5173 already in use | Vite dev server already open | Terminate previous terminal or Vite will automatically choose port 5174 |
| Elasticsearch unavailable | Docker container starting up | Backend automatically falls back to high-performance monitored log mode; once Docker ES is healthy, it connects automatically |
| Cannot run PowerShell scripts | Execution policy restriction | Run commands via `cmd.exe /c` or use `.bat` scripts provided |
