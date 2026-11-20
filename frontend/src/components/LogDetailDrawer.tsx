import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Server, Calendar, Hash, Globe } from 'lucide-react';
import { LogEntry } from '../types';
import { StatusBadge } from './StatusBadge';

interface LogDetailDrawerProps {
  log: LogEntry | null;
  onClose: () => void;
}

export const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border-l border-slate-800 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Log Event Inspection</h2>
              <p className="text-xs text-slate-400 font-mono">ID: {log.request_id || log.id || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1E293B]/50 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Timestamp (UTC)</span>
              </div>
              <div className="text-sm font-mono text-slate-200">{log.timestamp}</div>
            </div>

            <div className="bg-[#1E293B]/50 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Severity Level</span>
              </div>
              <StatusBadge level={log.level} size="md" />
            </div>

            <div className="bg-[#1E293B]/50 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Service Name</span>
              </div>
              <div className="text-sm font-medium text-sky-400">{log.service}</div>
            </div>

            <div className="bg-[#1E293B]/50 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Host & IP</span>
              </div>
              <div className="text-sm font-mono text-slate-300">
                {log.hostname} <span className="text-slate-500">({log.ip_address})</span>
              </div>
            </div>
          </div>

          {/* Message Banner */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message Payload</h3>
            <div className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800 font-mono text-sm text-slate-100 whitespace-pre-wrap break-words">
              {log.message}
            </div>
          </div>

          {/* Raw JSON Tree */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raw Elasticsearch Document</h3>
              <span className="text-xs text-slate-500 font-mono">application/json</span>
            </div>
            <pre className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#111827] flex items-center justify-between text-xs text-slate-400">
          <span>Schema: LOGSCOPE-ELK-Standard v1</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
