import logging
import time
from datetime import datetime, timezone
from elasticsearch import Elasticsearch
from config import Config

logger = logging.getLogger(__name__)

class ElasticsearchClient:
    def __init__(self, es_url=Config.ELASTICSEARCH_URL):
        self.es_url = es_url
        self.client = None
        self._last_check_time = 0
        self._cached_connected = False
        self._cache_ttl = 5.0 # Check at most every 5 seconds
        self._init_client()

    def _init_client(self):
        try:
            self.client = Elasticsearch(
                hosts=[self.es_url],
                request_timeout=0.5,
                max_retries=0
            )
        except Exception as e:
            logger.warning(f"Could not initialize ES client: {e}")
            self.client = None

    def is_connected(self, force=False):
        """Checks if Elasticsearch is reachable with TTL caching to avoid blocking loops."""
        now = time.time()
        if not force and (now - self._last_check_time < self._cache_ttl):
            return self._cached_connected

        self._last_check_time = now
        try:
            if not self.client:
                self._init_client()
            if self.client and self.client.ping():
                self._cached_connected = True
                return True
        except Exception:
            pass

        self._cached_connected = False
        return False

    def get_health(self):
        """Returns cluster health details."""
        if not self.is_connected():
            return {
                "connected": False,
                "status": "unavailable",
                "message": "Elasticsearch service is not reachable",
                "url": self.es_url
            }
        try:
            t0 = time.time()
            info = self.client.info()
            health = self.client.cluster.health()
            latency_ms = round((time.time() - t0) * 1000, 2)
            return {
                "connected": True,
                "status": health.get("status", "green"),
                "cluster_name": health.get("cluster_name"),
                "number_of_nodes": health.get("number_of_nodes"),
                "version": info.get("version", {}).get("number"),
                "latency_ms": latency_ms,
                "url": self.es_url
            }
        except Exception as e:
            return {
                "connected": False,
                "status": "error",
                "message": str(e),
                "url": self.es_url
            }

    def index_log(self, entry):
        """Directly index a document to Elasticsearch."""
        if not self.is_connected():
            return False
        try:
            today = datetime.now(timezone.utc).strftime("%Y.%m.%d")
            index_name = f"logscope-logs-{today}"
            doc = {
                "@timestamp": entry.get("timestamp"),
                "timestamp": entry.get("timestamp"),
                "level": entry.get("level", "INFO").upper(),
                "service": entry.get("service"),
                "hostname": entry.get("hostname"),
                "ip_address": entry.get("ip_address"),
                "message": entry.get("message"),
                "request_id": entry.get("request_id")
            }
            self.client.index(index=index_name, document=doc)
            return True
        except Exception as e:
            logger.error(f"Failed to index log in ES: {e}")
            return False

    def search_logs(self, query=None, level=None, service=None, page=1, limit=25):
        """Searches logs with filters and pagination."""
        if not self.is_connected():
            return None
        try:
            must_clauses = []
            if level and level.upper() != "ALL":
                must_clauses.append({"term": {"level.keyword": level.upper()}})
            if service and service.upper() != "ALL":
                must_clauses.append({"term": {"service.keyword": service}})
            if query:
                must_clauses.append({
                    "multi_match": {
                        "query": query,
                        "fields": ["message", "service", "hostname", "request_id", "ip_address"]
                    }
                })

            body = {
                "query": {"bool": {"must": must_clauses}} if must_clauses else {"match_all": {}},
                "sort": [{"@timestamp": {"order": "desc"}}],
                "from": (page - 1) * limit,
                "size": limit
            }

            resp = self.client.search(index=Config.ES_INDEX_PREFIX, body=body)
            total = resp["hits"]["total"]["value"]
            logs = []
            for hit in resp["hits"]["hits"]:
                src = hit["_source"]
                logs.append({
                    "id": hit["_id"],
                    "timestamp": src.get("@timestamp") or src.get("timestamp"),
                    "level": src.get("level"),
                    "service": src.get("service"),
                    "hostname": src.get("hostname"),
                    "ip_address": src.get("ip_address"),
                    "message": src.get("message"),
                    "request_id": src.get("request_id")
                })
            return {
                "logs": logs,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": max(1, (total + limit - 1) // limit)
            }
        except Exception as e:
            logger.error(f"ES search error: {e}")
            return None

    def get_aggregations(self):
        """Runs aggregations for dashboard metrics."""
        if not self.is_connected():
            return None
        try:
            body = {
                "size": 0,
                "aggs": {
                    "levels": {"terms": {"field": "level.keyword"}},
                    "services": {"terms": {"field": "service.keyword", "size": 10}},
                    "volume_over_time": {
                        "date_histogram": {
                            "field": "@timestamp",
                            "fixed_interval": "1m",
                            "min_doc_count": 0
                        }
                    }
                }
            }
            resp = self.client.search(index=Config.ES_INDEX_PREFIX, body=body)
            total = resp["hits"]["total"]["value"]
            level_buckets = {b["key"]: b["doc_count"] for b in resp["aggregations"]["levels"]["buckets"]}
            service_buckets = {b["key"]: b["doc_count"] for b in resp["aggregations"]["services"]["buckets"]}
            timeline = resp["aggregations"]["volume_over_time"]["buckets"]

            return {
                "total_logs": total,
                "error_count": level_buckets.get("ERROR", 0),
                "warning_count": level_buckets.get("WARNING", 0),
                "critical_count": level_buckets.get("CRITICAL", 0),
                "info_count": level_buckets.get("INFO", 0),
                "debug_count": level_buckets.get("DEBUG", 0),
                "service_distribution": service_buckets,
                "timeline": timeline
            }
        except Exception as e:
            logger.error(f"ES aggregation error: {e}")
            return None

es_client = ElasticsearchClient()
