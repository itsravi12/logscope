import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Layers,
  Activity
} from 'lucide-react';
import { AnalyticsResponse } from '../types';
import { api } from '../services/api';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Activity className="w-6 h-6 animate-spin text-sky-400 mr-2" />
        <span>Computing analytics from Elasticsearch cluster...</span>
      </div>
    );
  }

  const maxVolume = Math.max(1, ...(data.volume_over_time || []).map(v => v.total));
  const totalSeverity = Math.max(1, (data.severity_distribution || []).reduce((acc, curr) => acc + curr.count, 0));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <span>ELK Telemetry Analytics & Distribution</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated statistical distribution across levels, time windows, and microservices
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Grid: Volume Over Time & Error vs Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Log Volume Over Time */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Log Volume Over Time</h2>
              <p className="text-xs text-slate-400">Total ingested records per 1-minute window</p>
            </div>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>

          <div className="h-60 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {data.volume_over_time.map((bucket, idx) => {
              const h = bucket.total > 0
                ? Math.max(12, Math.round((bucket.total / maxVolume) * 100))
                : 4;
              return (
                <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-10 z-20 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
                    {bucket.time}: {bucket.total} logs
                  </div>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                        bucket.total > 0
                          ? 'bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-500 group-hover:to-sky-300'
                          : 'bg-slate-800/40'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono scale-90 -rotate-45 origin-top-left shrink-0">
                    {bucket.time}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-3">
            <span>Historical T-15m</span>
            <span>Current Ingestion Stream</span>
          </div>
        </div>

        {/* Panel 2: Error vs Warning Ratio */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Failure Distribution</h2>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-xs text-slate-400 mb-6">Error vs Warning vs Critical proportion</p>

            <div className="space-y-4">
              {/* Errors */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-rose-400 font-medium">Standard Errors</span>
                  <span className="font-mono text-slate-300">{data.error_vs_warning.error_count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        (data.error_vs_warning.error_count /
                          Math.max(1, data.error_vs_warning.error_count + data.error_vs_warning.warning_count + data.error_vs_warning.critical_count)) *
                        100
                      }%`
                    }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>

              {/* Warnings */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-medium">System Warnings</span>
                  <span className="font-mono text-slate-300">{data.error_vs_warning.warning_count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        (data.error_vs_warning.warning_count /
                          Math.max(1, data.error_vs_warning.error_count + data.error_vs_warning.warning_count + data.error_vs_warning.critical_count)) *
                        100
                      }%`
                    }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              {/* Critical */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400 font-medium">Critical Failures</span>
                  <span className="font-mono text-slate-300">{data.error_vs_warning.critical_count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        (data.error_vs_warning.critical_count /
                          Math.max(1, data.error_vs_warning.error_count + data.error_vs_warning.warning_count + data.error_vs_warning.critical_count)) *
                        100
                      }%`
                    }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Ratio directly influences service operational triage.
          </div>
        </div>

      </div>

      {/* Grid: Severity Distribution & Top Error Generating Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 3: Severity Distribution */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Logs by Severity</h2>
            <PieChart className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xs text-slate-400 mb-6">Percentage share across all logging levels</p>

          <div className="space-y-3.5">
            {data.severity_distribution.map((item) => {
              const pct = Math.round((item.count / totalSeverity) * 100);
              return (
                <div key={item.level} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium">{item.level}</span>
                    <span className="text-slate-400">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 4: Top Services Generating Errors */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Top Services Generating Errors</h2>
            <Layers className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xs text-slate-400 mb-6">Ranked by cumulative ERROR + CRITICAL count</p>

          <div className="space-y-4">
            {data.top_error_services.map((srv, idx) => {
              const maxErr = Math.max(1, data.top_error_services[0]?.errors || 1);
              const errPct = Math.round((srv.errors / maxErr) * 100);

              return (
                <div key={srv.service} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">
                      #{idx + 1} {srv.service}
                    </span>
                    <span className="font-mono text-rose-400 font-bold">
                      {srv.errors} errors
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${errPct}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
