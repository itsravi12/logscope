import {
  DashboardStats,
  LogsResponse,
  AlertsResponse,
  AnalyticsResponse,
  HealthResponse,
  ServiceStatusItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error(`Failed to load stats: ${res.statusText}`);
    return res.json();
  },

  async getLogs(params: {
    page?: number;
    limit?: number;
    level?: string;
    service?: string;
    search?: string;
    time_range?: string;
  } = {}): Promise<LogsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.level && params.level !== 'ALL') query.set('level', params.level);
    if (params.service && params.service !== 'ALL') query.set('service', params.service);
    if (params.search) query.set('search', params.search);
    if (params.time_range) query.set('time_range', params.time_range);

    const res = await fetch(`${API_BASE}/logs?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load logs: ${res.statusText}`);
    return res.json();
  },

  async searchLogs(q: string, params: { level?: string; service?: string; page?: number; limit?: number } = {}): Promise<LogsResponse> {
    const query = new URLSearchParams({ q });
    if (params.level) query.set('level', params.level);
    if (params.service) query.set('service', params.service);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/logs/search?${query.toString()}`);
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    return res.json();
  },

  async getAnalytics(): Promise<AnalyticsResponse> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error(`Failed to load analytics: ${res.statusText}`);
    return res.json();
  },

  async getAlerts(params: {
    status?: string;
    severity?: string;
    service?: string;
    limit?: number;
  } = {}): Promise<AlertsResponse> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.severity && params.severity !== 'ALL') query.set('severity', params.severity);
    if (params.service && params.service !== 'ALL') query.set('service', params.service);
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load alerts: ${res.statusText}`);
    return res.json();
  },

  async acknowledgeAlert(alertId: string, user: string = 'Console Operator'): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.statusText}`);
    return res.json();
  },

  async getServices(): Promise<{ services: ServiceStatusItem[] }> {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error(`Failed to load services: ${res.statusText}`);
    return res.json();
  },

  async generateTestError(service?: string, message?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/generate-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, message })
    });
    if (!res.ok) throw new Error(`Failed to generate test error: ${res.statusText}`);
    return res.json();
  },

  async generateCriticalEvent(service?: string, message?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/generate-critical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, message })
    });
    if (!res.ok) throw new Error(`Failed to generate critical event: ${res.statusText}`);
    return res.json();
  }
};
