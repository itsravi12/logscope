import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Server,
  User,
  Check,
  RefreshCw
} from 'lucide-react';
import { Alert, LogEntry } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface AlertsProps {
  onSelectLog?: (log: LogEntry) => void;
  onAlertUpdated?: () => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onSelectLog, onAlertUpdated }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [acknowledgedCount, setAcknowledgedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED'>('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAlerts({
        status: activeTab,
        severity: severityFilter,
        limit: 100
      });
      setAlerts(res.alerts || []);
      setActiveCount(res.active_count || 0);
      setAcknowledgedCount(res.acknowledged_count || 0);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeTab, severityFilter]);

  // Periodic polling for new alerts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, severityFilter]);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      await api.acknowledgeAlert(alertId, 'Operator (Faculty Demo)');
      await fetchAlerts();
      if (onAlertUpdated) onAlertUpdated();
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Alert Management Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule-based detection engine monitoring ERROR, CRITICAL incidents, and high-frequency storms (over 5 errors/60s)
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Rules Information Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200">Rule 1: Error Event</h2>
            <p className="text-[11px] text-slate-400 mt-1">Triggers immediately whenever any service emits an ERROR log.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200">Rule 2: Critical Incident</h2>
            <p className="text-[11px] text-slate-400 mt-1">Triggers on CRITICAL severity: outages, corruptions, or panic signals.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200">Rule 3: Storm Detection</h2>
            <p className="text-[11px] text-slate-400 mt-1">Triggers CRITICAL storm alert if more than 5 errors occur within 60 seconds.</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ACTIVE'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <span>Active Alerts</span>
            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded-full font-mono text-[10px]">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ACKNOWLEDGED')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ACKNOWLEDGED'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <span>Acknowledged</span>
            <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded-full font-mono text-[10px]">
              {acknowledgedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ALL'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <span>All Alerts</span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full font-mono text-[10px]">
              {activeCount + acknowledgedCount}
            </span>
          </button>
        </div>

        {/* Severity Filter Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Severities</option>
            <option value="ERROR">ERROR only</option>
            <option value="CRITICAL">CRITICAL only</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = alert.status === 'ACTIVE';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isActive
                    ? isCritical
                      ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                      : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-[#111827] border-slate-800 opacity-75'
                }`}
              >
                {/* Left: Alert Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge level={alert.severity} size="sm" />
                    <span className="text-xs font-semibold text-white tracking-wide">
                      {alert.rule_name}
                    </span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-1 text-xs text-sky-400 font-medium">
                      <Server className="w-3.5 h-3.5" />
                      <span>{alert.service}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-snug font-sans">
                    {alert.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{alert.timestamp}</span>
                    </div>

                    {alert.request_id && (
                      <span className="text-slate-500">
                        Req ID: {alert.request_id}
                      </span>
                    )}

                    {alert.acknowledged_at && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <User className="w-3.5 h-3.5" />
                        <span>Acked by {alert.acknowledged_by || 'Operator'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {alert.raw_log && onSelectLog && (
                    <button
                      onClick={() => onSelectLog(alert.raw_log!)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    >
                      View Source Log
                    </button>
                  )}

                  {isActive ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgingId === alert.id}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {acknowledgingId === alert.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-xl bg-[#111827] border border-slate-800 text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40 mb-2" />
            <p className="text-sm font-medium text-slate-400">No {activeTab.toLowerCase()} alerts matching current filters</p>
            <p className="text-xs text-slate-600 mt-1">All monitored systems are reporting within nominal tolerances.</p>
          </div>
        )}
      </div>

    </div>
  );
};
