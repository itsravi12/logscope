import React from 'react';
import {
  Activity,
  AlertTriangle,
  Zap,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  health: HealthResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onGenerateError: () => void;
  onGenerateCritical: () => void;
  isGeneratingError: boolean;
  isGeneratingCritical: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onRefresh,
  isRefreshing,
  onGenerateError,
  onGenerateCritical,
  isGeneratingError,
  isGeneratingCritical,
  autoRefresh,
  onToggleAutoRefresh
}) => {
  const esConnected = health?.components?.elasticsearch?.connected ?? false;
  const esStatus = health?.components?.elasticsearch?.status ?? 'UNKNOWN';

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5">
      <div className="flex items-center justify-between">
        
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-mono">LOGSCOPE</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                ELK Stack v8
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Log Analysis & Monitoring Dashboard on Cloud
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-3">

          {/* Infrastructure Health Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Elasticsearch:</span>
            {esConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected ({esStatus})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium" title="Logs are being monitored via direct pipeline & local storage">
                <AlertCircle className="w-3.5 h-3.5" /> Degraded (Direct Monitored)
              </span>
            )}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={onToggleAutoRefresh}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Auto refresh every 5 seconds"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            Auto 5s {autoRefresh ? 'ON' : 'OFF'}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* DEMO BUTTON 1: GENERATE TEST ERROR */}
          <button
            onClick={onGenerateError}
            disabled={isGeneratingError}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 border border-rose-500 rounded-lg shadow-sm shadow-rose-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Simulate real microservice failure and verify live ELK ingestion"
          >
            {isGeneratingError ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>Generate Test Error</span>
          </button>

          {/* DEMO BUTTON 2: GENERATE CRITICAL EVENT */}
          <button
            onClick={onGenerateCritical}
            disabled={isGeneratingCritical}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-purple-700 hover:bg-purple-600 active:bg-purple-800 border border-purple-500 rounded-lg shadow-sm shadow-purple-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trigger critical incident alert"
          >
            {isGeneratingCritical ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Generate Critical Event</span>
            <span className="sm:hidden">Critical</span>
          </button>

        </div>

      </div>
    </header>
  );
};
