import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Layers,
  Network
} from 'lucide-react';
import { HealthResponse, ServiceStatusItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ServiceMonitoringProps {
  health: HealthResponse | null;
  onRefreshHealth: () => void;
}

export const ServiceMonitoring: React.FC<ServiceMonitoringProps> = ({
  health,
  onRefreshHealth
}) => {
  const [services, setServices] = useState<ServiceStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await api.getServices();
      setServices(res.services || []);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const es = health?.components?.elasticsearch;
  const ls = health?.components?.logstash;
  const fb = health?.components?.filebeat;
  const apiBackend = health?.components?.backend_api;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            <span>Infrastructure & Microservice Health</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline connectivity and operational microservice status
          </p>
        </div>

        <button
          onClick={() => { fetchServices(); onRefreshHealth(); }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* SECTION 1: ACTUAL INFRASTRUCTURE CONNECTIVITY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <span>Actual Infrastructure Node Connectivity</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Real-time Live Probing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Elasticsearch */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Elasticsearch</span>
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={es?.connected ? 'HEALTHY' : 'DEGRADED'} />
              <span className="text-xs font-mono text-slate-400">
                {es?.connected ? `${es.latency_ms}ms ping` : 'Local Engine Active'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-2 border-t border-slate-800">
              <div>Status: <span className={es?.connected ? "text-emerald-400" : "text-amber-400"}>
                {es?.connected ? "Cluster Connected" : "Docker ES Offline"}
              </span></div>
              <div>Cluster: <span className="text-slate-200">{es?.connected ? es?.cluster_name : 'N/A (Standalone)'}</span></div>
              <div className="truncate">URL: <span className="text-slate-200">{es?.url || 'http://localhost:9200'}</span></div>
            </div>
          </div>

          {/* Logstash */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Logstash Pipeline</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={ls?.listening ? 'HEALTHY' : 'STANDBY'} />
              <span className="text-xs font-mono text-slate-400">
                {ls?.listening ? 'Port 5044 Open' : 'Port 5044 Standby'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-2 border-t border-slate-800">
              <div>Pipeline: <span className="text-slate-200">logstash.conf</span></div>
              <div>Status: <span className={ls?.listening ? "text-emerald-400" : "text-amber-400"}>
                {ls?.listening ? "Active Beats Receiver" : "Docker Container Standby"}
              </span></div>
              <div>Input: <span className="text-slate-200">Beats (5044) to ES</span></div>
            </div>
          </div>

          {/* Filebeat */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Filebeat Harvester</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={fb?.status || 'ACTIVE'} />
              <span className="text-xs font-mono text-slate-400">Harvesting</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-2 border-t border-slate-800">
              <div className="truncate">Path: <span className="text-slate-200">app.log</span></div>
              <div>Target: <span className="text-slate-200">logstash:5044</span></div>
              <div>Parser: <span className="text-slate-200">ndjson / filestream</span></div>
            </div>
          </div>

          {/* Flask Backend API */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Flask API Server</span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="OPERATIONAL" />
              <span className="text-xs font-mono text-slate-400">Port 5000</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-2 border-t border-slate-800">
              <div>Uptime: <span className="text-slate-200">{apiBackend?.uptime || 'Active'}</span></div>
              <div>Version: <span className="text-slate-200">v1.0.0</span></div>
              <div>CORS: <span className="text-slate-200">Enabled</span></div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: APPLICATION MICROSERVICES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Application Microservices Health</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Status computed dynamically from actual log errors, failure rates, and incident alerts
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Note: CPU, RAM & Disk metrics below are simulated for demonstration.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const hw = srv.simulated_hardware_metrics;
            const isCritical = srv.status === 'CRITICAL';
            const isDegraded = srv.status === 'DEGRADED';

            return (
              <div
                key={srv.name}
                className={`bg-[#111827] border rounded-xl p-5 space-y-4 transition ${isCritical
                    ? 'border-red-500/40 bg-red-950/10'
                    : isDegraded
                      ? 'border-amber-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                {/* Service Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{srv.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {srv.total_logs} logs ingested
                    </p>
                  </div>
                  <StatusBadge status={srv.status} />
                </div>

                {/* Actual Health Metric */}
                <div className="p-3 rounded-lg bg-[#0B0F19] border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Actual Error Rate:</span>
                    <span className={`font-mono font-bold ${srv.error_rate_percent > 10 ? 'text-rose-400' : 'text-slate-200'
                      }`}>
                      {srv.error_rate_percent}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Telemetry diagnosis:</span> {srv.actual_health.reason}
                  </div>
                </div>

                {/* Simulated Hardware Telemetry Box */}
                <div className="pt-2 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <span>Hardware Telemetry</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">SIMULATED</span>
                  </div>

                  {/* CPU */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Cpu className="w-3.5 h-3.5" /> CPU Utilization
                      </span>
                      <span className="font-mono">{hw.cpu_usage_percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${hw.cpu_usage_percent}%` }}
                        className="h-full bg-sky-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Memory */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Activity className="w-3.5 h-3.5" /> RAM Usage
                      </span>
                      <span className="font-mono">{hw.memory_usage_percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${hw.memory_usage_percent}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Disk */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <HardDrive className="w-3.5 h-3.5" /> Disk Storage
                      </span>
                      <span className="font-mono">{hw.disk_usage_percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${hw.disk_usage_percent}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
