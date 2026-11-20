"""
LOGSCOPE - Academic Prototype Supervisor
Runs the Flask Backend, React Frontend, and Live Log Generator concurrently.
Usage: python run_prototype.py
"""

import os
import sys
import time
import subprocess
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

processes = []

def cleanup(sig=None, frame=None):
    print("\n[!] Shutting down all LOGSCOPE prototype services...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=3)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    print("[+] All services stopped cleanly.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    print("=" * 70)
    print(" LOGSCOPE - CLOUD LOG ANALYSIS & MONITORING DASHBOARD (ELK STACK)")
    print(" Academic Demonstration Prototype")
    print("=" * 70)

    # 1. Start Flask Backend
    print("[1/3] Starting Flask Backend API on http://localhost:5000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=BACKEND_DIR,
        shell=False
    )
    processes.append(backend_proc)

    time.sleep(1.5)

    # 2. Start Live Log Generator
    print("[2/3] Starting Live Log Generator (every 2.5s -> logs/app.log)...")
    generator_proc = subprocess.Popen(
        [sys.executable, "generate_logs.py"],
        cwd=ROOT_DIR,
        shell=False
    )
    processes.append(generator_proc)

    # 3. Start React Frontend Dev Server
    print("[3/3] Starting React Dashboard on http://localhost:5173...")
    if os.name == "nt":
        frontend_proc = subprocess.Popen(
            ["cmd.exe", "/c", "npx vite --port 5173 --host"],
            cwd=FRONTEND_DIR,
            shell=False
        )
    else:
        frontend_proc = subprocess.Popen(
            ["npx", "vite", "--port", "5173", "--host"],
            cwd=FRONTEND_DIR,
            shell=False
        )
    processes.append(frontend_proc)

    print("\n" + "=" * 70)
    print(" [PROTOTYPE RUNNING SUCCESSFULLY]")
    print(" -> Frontend Dashboard:    http://localhost:5173")
    print(" -> Flask Backend Health:  http://localhost:5000/api/health")
    print(" -> Monitored Log Stream:  " + os.path.join(ROOT_DIR, "logs", "app.log"))
    print(" -> Docker Mode (ELK):     docker compose up --build -d")
    print("=" * 70)
    print("Press Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            for p in processes:
                if p.poll() is not None:
                    print(f"[!] Warning: Process {p.args} exited with code {p.returncode}")
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
