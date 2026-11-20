import urllib.request
import json
import sys

def run_probes():
    print("=== 1. Probing Vite Frontend on http://localhost:5173/ ===")
    with urllib.request.urlopen("http://localhost:5173/") as resp:
        html = resp.read().decode()
        print(f"Vite HTTP Status: {resp.status}")
        print(f"HTML Length: {len(html)} bytes")
        assert "root" in html, "Root div missing"
        assert "LOGSCOPE" in html, "LOGSCOPE title missing"
        print("Root div and LOGSCOPE title confirmed.")

    print("\n=== 2. Probing Vite Module Compilation on http://localhost:5173/src/main.tsx ===")
    with urllib.request.urlopen("http://localhost:5173/src/main.tsx") as resp:
        code = resp.read().decode()
        print(f"main.tsx HTTP Status: {resp.status}")
        print(f"Compiled module size: {len(code)} bytes")
        assert "render" in code, "main.tsx render missing"

    print("\n=== 3. Probing Vite Proxy to Backend /api/health ===")
    with urllib.request.urlopen("http://localhost:5173/api/health") as resp:
        data = json.loads(resp.read().decode())
        print(f"Proxy /api/health Status: {resp.status}")
        print(f"Backend Status: {data.get('status')}")
        print(f"Elasticsearch component: {data.get('components', {}).get('elasticsearch', {}).get('name')}")

    print("\n=== 4. Probing /api/dashboard/stats via Proxy ===")
    with urllib.request.urlopen("http://localhost:5173/api/dashboard/stats") as resp:
        data = json.loads(resp.read().decode())
        print(f"Total Ingested Logs: {data.get('total_logs')}")
        print(f"Errors Detected: {data.get('error_count')}")
        print(f"Ingestion Rate: {data.get('ingestion_rate')} logs/sec")
        print(f"Activity Timeline Buckets: {len(data.get('activity_timeline', []))}")
        print(f"Service Distribution Count: {len(data.get('service_distribution', []))}")

    print("\n=== 5. Probing /api/logs via Proxy ===")
    with urllib.request.urlopen("http://localhost:5173/api/logs?page=1&limit=5") as resp:
        data = json.loads(resp.read().decode())
        print(f"Logs returned: {len(data.get('logs', []))} out of total {data.get('total')}")
        if data.get("logs"):
            first = data["logs"][0]
            print(f"Latest log: [{first.get('level')}] {first.get('service')} - {first.get('message')[:60]}")

    print("\n=== 6. Probing /api/alerts via Proxy ===")
    with urllib.request.urlopen("http://localhost:5173/api/alerts") as resp:
        data = json.loads(resp.read().decode())
        print(f"Alerts Total: {data.get('total')}, Active: {data.get('active_count')}, Acked: {data.get('acknowledged_count')}")

    print("\n=== 7. Probing /api/services via Proxy ===")
    with urllib.request.urlopen("http://localhost:5173/api/services") as resp:
        data = json.loads(resp.read().decode())
        print(f"Monitored services: {len(data.get('services', []))}")
        for s in data.get("services", []):
            print(f"  * {s['name']:<24} -> Status: {s['status']:<11} | Errors: {s['error_count']}")

    print("\n" + "=" * 60)
    print(" [VERIFICATION RESULT] ALL LIVE PROBES PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_probes()
    except Exception as e:
        print(f"\n[FAIL] Error during probe: {e}")
        sys.exit(1)
