import React from 'react';
import {
  LayoutDashboard,
  ScrollText,
  AlertOctagon,
  BarChart3,
  ServerCog,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export type NavTab = 'dashboard' | 'logs' | 'alerts' | 'analytics' | 'services';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeAlertsCount
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs' as NavTab, label: 'Live Logs', icon: ScrollText },
    {
      id: 'alerts' as NavTab,
      label: 'Alerts',
      icon: AlertOctagon,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null
    },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'services' as NavTab, label: 'Service Monitoring', icon: ServerCog },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      
      {/* Navigation Links */}
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Observability
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cloud & Academic Project Info Box */}
      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="bg-[#111827] rounded-xl p-3 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Academic Demonstration</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            ELK Stack (Elasticsearch 8.11, Logstash, Kibana, Filebeat) with Flask & React.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Kibana UI</span>
            <a
              href="http://localhost:5601"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline flex items-center gap-1"
            >
              :5601 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

    </aside>
  );
};
