import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    
    # Path resolution: If running inside Docker container vs running locally on Windows/Linux host
    raw_log_path = os.getenv("LOG_FILE_PATH", "")
    if os.path.exists("/.dockerenv") or (raw_log_path.startswith("/app/") and os.path.exists("/app")):
        LOG_FILE_PATH = raw_log_path or "/app/logs/app.log"
    else:
        # Local workspace resolution
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        LOG_FILE_PATH = os.path.join(root_dir, "logs", "app.log")

    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    ES_INDEX_PREFIX = "logscope-logs-*"
