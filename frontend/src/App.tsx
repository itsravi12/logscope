import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LiveLogs } from './pages/LiveLogs';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { ServiceMonitoring } from './pages/ServiceMonitoring';
import { LogDetailDrawer } from './components/LogDetailDrawer';
import { DashboardStats, HealthResponse, LogEntry } from './types';
import { api } from './services/api';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isGeneratingError, setIsGeneratingError] = useState(false);
  const [isGeneratingCritical, setIsGeneratingCritical] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'critical' } | null>(null);

  const fetchGlobalData = async () => {
    setIsRefreshing(true);
    try {
      const [statsData, healthData, alertsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getHealth().catch(() => null),
        api.getAlerts({ status: 'ACTIVE' }).catch(() => null)
      ]);

      if (statsData) setStats(statsData);
      if (healthData) setHealth(healthData);
      if (alertsData) setActiveAlertsCount(alertsData.active_count || 0);
    } catch (err) {
      console.error('Failed to refresh global telemetry data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  // 5-second automatic telemetry polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchGlobalData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const showToast = (message: string, type: 'success' | 'critical' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleGenerateError = async () => {
    setIsGeneratingError(true);
    try {
      const res = await api.generateTestError();
      showToast(`Real test ERROR log appended to app.log (${res.log?.service})!`, 'success');
      await fetchGlobalData();
    } catch (err: any) {
      showToast(`Failed to generate error: ${err.message}`, 'critical');
    } finally {
      setIsGeneratingError(false);
    }
  };

  const handleGenerateCritical = async () => {
    setIsGeneratingCritical(true);
    try {
      const res = await api.generateCriticalEvent();
      showToast(`CRITICAL incident appended to app.log (${res.log?.service}) & Alert created!`, 'critical');
      await fetchGlobalData();
    } catch (err: any) {
      showToast(`Failed to generate critical event: ${err.message}`, 'critical');
    } finally {
      setIsGeneratingCritical(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium ${
            toast.type === 'critical'
              ? 'bg-purple-950/90 text-purple-200 border-purple-500/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
          }`}>
            {toast.type === 'critical' ? (
              <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        health={health}
        onRefresh={fetchGlobalData}
        isRefreshing={isRefreshing}
        onGenerateError={handleGenerateError}
        onGenerateCritical={handleGenerateCritical}
        isGeneratingError={isGeneratingError}
        isGeneratingCritical={isGeneratingCritical}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeAlertsCount={activeAlertsCount}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              onSelectLog={setSelectedLog}
              onViewAllLogs={() => setActiveTab('logs')}
            />
          )}

          {activeTab === 'logs' && (
            <LiveLogs onSelectLog={setSelectedLog} />
          )}

          {activeTab === 'alerts' && (
            <Alerts
              onSelectLog={setSelectedLog}
              onAlertUpdated={fetchGlobalData}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics />
          )}

          {activeTab === 'services' && (
            <ServiceMonitoring
              health={health}
              onRefreshHealth={fetchGlobalData}
            />
          )}
        </main>
      </div>

      {/* Slide-over Log Details Drawer */}
      <LogDetailDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />

    </div>
  );
};
export default App;
