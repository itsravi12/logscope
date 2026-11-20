import React from 'react';
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  Zap,
  Activity,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';
import { DashboardStats, LogEntry } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardProps {
  stats: DashboardStats | null;
  onSelectLog: (log: LogEntry) => void;
  onViewAllLogs: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onSelectLog,
  onViewAllLogs
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Activity className="w-6 h-6 animate-spin text-sky-400 mr-2" />
        <span>Loading live ELK telemetry...</span>
      </div>
    );
  }

  // Calculate maximum total in activity timeline for relative bar heights
  const maxTimelineTotal = Math.max(1, ...(stats.activity_timeline || []).map(b => b.total));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner / Storage Engine Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Overview Telemetry Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-service log ingestion, error detection and cluster health metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-xs">
            <span className="text-slate-500 mr-1.5">Storage Engine:</span>
            <span className="font-mono text-sky-400 font-semibold">{stats.storage_mode}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-xs">
            <span className="text-slate-500 mr-1.5">Ingestion Rate:</span>
            <span className="font-mono text-emerald-400 font-bold">{stats.ingestion_rate} logs/sec</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ingested Logs"
          value={stats.total_logs.toLocaleString()}
          subtitle="All microservice events"
          icon={FileText}
          variant="blue"
        />
        <StatCard
          title="Errors Detected"
          value={stats.error_count.toLocaleString()}
          subtitle="HTTP 500s & service faults"
          icon={AlertTriangle}
          variant="rose"
          pulse={stats.error_count > 0}
        />
        <StatCard
          title="Warnings Logged"
          value={stats.warning_count.toLocaleString()}
          subtitle="Latency spikes & retries"
          icon={AlertCircle}
          variant="amber"
        />
        <StatCard
          title="Critical Incidents"
          value={stats.critical_count.toLocaleString()}
          subtitle="Outages & severe failures"
          icon={Zap}
          variant="purple"
          pulse={stats.critical_count > 0}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Activity Timeline Chart */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Real-Time Ingestion Timeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">Events per 1-minute bucket (Last 15 minutes)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded bg-sky-500" /> Total
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Error
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Warning
              </span>
            </div>
          </div>

          {/* Custom SVG Bar Chart */}
          <div className="h-56 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {stats.activity_timeline.map((bucket, idx) => {
              const heightPercent = bucket.total > 0
                ? Math.max(12, Math.round((bucket.total / maxTimelineTotal) * 100))
                : 4;
              const hasErrors = bucket.error > 0;
              const hasWarnings = bucket.warning > 0;

              let barColor = 'bg-sky-500 hover:bg-sky-400';
              if (hasErrors) barColor = 'bg-rose-500 hover:bg-rose-400';
              else if (hasWarnings) barColor = 'bg-amber-500 hover:bg-amber-400';

              return (
                <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-12 z-20 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
                    <div>{bucket.time}: {bucket.total} logs</div>
                    {bucket.error > 0 && <div className="text-rose-400">{bucket.error} errors</div>}
                    {bucket.warning > 0 && <div className="text-amber-400">{bucket.warning} warnings</div>}
                  </div>

                  {/* Bar */}
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                        bucket.total > 0 ? barColor : 'bg-slate-800/40'
                      }`}
                    />
                  </div>
                  {/* Time label */}
                  <span className="text-[10px] text-slate-500 font-mono scale-90 -rotate-45 origin-top-left shrink-0">
                    {bucket.time}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-4">
            <span>15 mins ago</span>
            <span>Current window</span>
          </div>
        </div>

        {/* Service-wise Distribution */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Service Share</h2>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-400 mb-6">Log distribution across monitored microservices</p>

          <div className="space-y-4">
            {stats.service_distribution.map((srv) => {
              const totalLogs = Math.max(1, stats.total_logs);
              const percentage = Math.round((srv.count / totalLogs) * 100);
              return (
                <div key={srv.service} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{srv.service}</span>
                    <span className="text-slate-400 font-mono">
                      {srv.count} <span className="text-slate-600">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`rounded-full ${
                        srv.errors > 0 ? 'bg-gradient-to-r from-sky-500 to-rose-500' : 'bg-sky-500'
                      }`}
                    />
                  </div>
                  {srv.errors > 0 && (
                    <div className="text-[10px] text-rose-400 font-mono">
                      {srv.errors} errors recorded
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Log Events Stream Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Recent Ingested Logs</h2>
            <p className="text-xs text-slate-400">Click any row to inspect complete Elasticsearch JSON details</p>
          </div>
          <button
            onClick={onViewAllLogs}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            <span>View Full Log Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-6 py-3">Message</th>
                <th className="px-4 py-3">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stats.recent_logs && stats.recent_logs.length > 0 ? (
                stats.recent_logs.map((log, i) => (
                  <tr
                    key={log.request_id || i}
                    onClick={() => onSelectLog(log)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge level={log.level} />
                    </td>
                    <td className="px-4 py-3 text-slate-200 whitespace-nowrap font-sans font-medium">
                      {log.service}
                    </td>
                    <td className="px-6 py-3 text-slate-300 max-w-md truncate group-hover:text-sky-300 transition font-sans">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {log.request_id}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No log events found. Ingestion in progress...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
