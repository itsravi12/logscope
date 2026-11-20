export type LogLevel = 'INFO' | 'DEBUG' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  hostname: string;
  ip_address: string;
  message: string;
  request_id: string;
}

export interface ComponentHealth {
  name: string;
  status: string;
  connected?: boolean;
  url?: string;
  cluster_name?: string;
  version?: string;
  latency_ms?: number | null;
  port?: number;
  listening?: boolean;
  harvesting_path?: string;
  monitored_file?: string;
  total_indexed_logs?: number;
  uptime?: string;
  note?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime_seconds: number;
  components: {
    elasticsearch: ComponentHealth;
    logstash: ComponentHealth;
    filebeat: ComponentHealth;
    backend_api: ComponentHealth;
    log_generator: ComponentHealth;
  };
}

export interface TimelineBucket {
  time: string;
  total: number;
  info: number;
  debug: number;
  warning: number;
  error: number;
  critical: number;
}

export interface ServiceDistributionItem {
  service: string;
  count: number;
  errors: number;
}

export interface DashboardStats {
  total_logs: number;
  error_count: number;
  warning_count: number;
  critical_count: number;
  info_count: number;
  debug_count: number;
  ingestion_rate: number;
  activity_timeline: TimelineBucket[];
  service_distribution: ServiceDistributionItem[];
  recent_logs: LogEntry[];
  elasticsearch: {
    connected: boolean;
    status: string;
    cluster_name?: string;
    version?: string;
    latency_ms?: number;
    url?: string;
  };
  storage_mode: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Alert {
  id: string;
  rule_name: string;
  severity: 'ERROR' | 'CRITICAL';
  service: string;
  message: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED';
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  request_id: string;
  raw_log?: LogEntry;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  active_count: number;
  acknowledged_count: number;
}

export interface AnalyticsResponse {
  volume_over_time: TimelineBucket[];
  severity_distribution: { level: string; count: number; color: string }[];
  service_distribution: ServiceDistributionItem[];
  error_vs_warning: {
    error_count: number;
    warning_count: number;
    critical_count: number;
  };
  top_error_services: ServiceDistributionItem[];
  total_logs: number;
}

export interface ServiceStatusItem {
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
  total_logs: number;
  error_count: number;
  critical_count: number;
  error_rate_percent: number;
  actual_health: {
    status: string;
    reason: string;
  };
  simulated_hardware_metrics: {
    is_simulated: boolean;
    note: string;
    cpu_usage_percent: number;
    memory_usage_percent: number;
    disk_usage_percent: number;
  };
}
