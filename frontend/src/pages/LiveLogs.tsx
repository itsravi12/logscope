import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Terminal,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { LogEntry, LogLevel } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface LiveLogsProps {
  onSelectLog: (log: LogEntry) => void;
}

export const LiveLogs: React.FC<LiveLogsProps> = ({ onSelectLog }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('ALL');
  const [service, setService] = useState('ALL');
  const [timeRange, setTimeRange] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLogs({
        page,
        limit,
        level,
        service,
        search,
        time_range: timeRange
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when filters or page change
  useEffect(() => {
    fetchLogs();
  }, [page, limit, level, service, timeRange]);

  // Handle auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, limit, level, service, search, timeRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setLevel('ALL');
    setService('ALL');
    setTimeRange('all');
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-400" />
            <span>Live Logs Stream</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-text Elasticsearch search, multi-field filtering, and log payload inspector
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Auto-refresh {autoRefresh ? 'Enabled (5s)' : 'Paused'}
          </button>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          
          {/* Keyword Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs by keyword, message, request ID, host, or IP..."
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition"
          >
            Search Logs
          </button>

          {(search || level !== 'ALL' || service !== 'ALL' || timeRange !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
            >
              Reset Filters
            </button>
          )}
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          {/* Level Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Log Level
            </label>
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> Service
            </label>
            <select
              value={service}
              onChange={(e) => { setService(e.target.value); setPage(1); }}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Services</option>
              <option value="Authentication Service">Authentication Service</option>
              <option value="Payment Service">Payment Service</option>
              <option value="API Gateway">API Gateway</option>
              <option value="Database Service">Database Service</option>
              <option value="Web Server">Web Server</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Time</option>
              <option value="15m">Last 15 Minutes</option>
              <option value="1h">Last 1 Hour</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Page Limit
            </label>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="10">10 entries</option>
              <option value="25">25 entries</option>
              <option value="50">50 entries</option>
              <option value="100">100 entries</option>
            </select>
          </div>

        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Hostname</th>
                <th className="px-6 py-3">Log Message</th>
                <th className="px-4 py-3">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr
                    key={log.request_id || idx}
                    onClick={() => onSelectLog(log)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge level={log.level} />
                    </td>
                    <td className="px-4 py-3 text-sky-400 whitespace-nowrap font-sans font-medium">
                      {log.service}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {log.hostname}
                    </td>
                    <td className="px-6 py-3 text-slate-200 max-w-lg truncate group-hover:text-sky-300 font-sans transition">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {log.request_id}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {isLoading ? 'Loading logs from storage...' : 'No matching logs found for current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-mono">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="text-white font-mono">{Math.min(page * limit, total)}</span> of{' '}
            <span className="text-white font-mono font-bold">{total.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 font-mono text-slate-200 bg-[#0B0F19] rounded-md border border-slate-800">
              Page {page} of {pages}
            </span>

            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
