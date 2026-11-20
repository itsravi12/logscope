import urllib.request
import json
import sys

def test_actions():
    print("\n=== Testing 'GENERATE TEST ERROR' through Vite Proxy ===")
    req = urllib.request.Request(
        "http://localhost:5173/api/demo/generate-error",
        data=json.dumps({"service": "Payment Service", "message": "Live Verified Test Error"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print(f"Status: {resp.status}, Success: {data.get('success')}, Level: {data.get('log', {}).get('level')}")
        assert data.get('success') is True

    print("\n=== Testing 'GENERATE CRITICAL EVENT' through Vite Proxy ===")
    req2 = urllib.request.Request(
        "http://localhost:5173/api/demo/generate-critical",
        data=json.dumps({"service": "Database Service", "message": "Live Verified Critical Outage"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req2) as resp:
        data2 = json.loads(resp.read().decode())
        print(f"Status: {resp.status}, Success: {data2.get('success')}, Level: {data2.get('log', {}).get('level')}")
        assert data2.get('success') is True

    print("\n=== Testing 'Acknowledge Alert' through Vite Proxy ===")
    with urllib.request.urlopen("http://localhost:5173/api/alerts?status=ACTIVE") as resp:
        alerts = json.loads(resp.read().decode()).get("alerts", [])
        if alerts:
            alert_id = alerts[0]["id"]
            req3 = urllib.request.Request(
                f"http://localhost:5173/api/alerts/{alert_id}/acknowledge",
                data=json.dumps({"user": "Faculty Reviewer"}).encode(),
                headers={"Content-Type": "application/json"},
                method="PATCH"
            )
            with urllib.request.urlopen(req3) as ack_resp:
                ack_data = json.loads(ack_resp.read().decode())
                print(f"Acknowledge Status: {ack_resp.status}, Status: {ack_data.get('alert', {}).get('status')}")
                assert ack_data.get("alert", {}).get("status") == "ACKNOWLEDGED"

    print("\n[SUCCESS] ALL PROXY ACTIONS AND DEMO BUTTONS VERIFIED OPERATIONAL!")

if __name__ == "__main__":
    test_actions()
