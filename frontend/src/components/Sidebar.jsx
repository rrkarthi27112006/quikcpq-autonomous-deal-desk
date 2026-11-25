import React from 'react';
import {
  Inbox,
  Plus,
  AlertCircle,
  Package,
  Settings,
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  escalatedCount,
  totalQuotes,
  configStatus,
  onOpenIntegrations,
  systemOnline,
}) {
  const navItems = [
    { id: 'inbox', label: 'Quotes & Inbox', icon: Inbox, count: totalQuotes },
    { id: 'approvals', label: 'Approvals', icon: AlertCircle, count: escalatedCount, highlight: escalatedCount > 0 },
    { id: 'new_quote', label: 'New Quote', icon: Plus },
    { id: 'catalog', label: 'Product Catalog', icon: Package },
  ];

  const connectedCount = [
    configStatus?.gemini_configured,
    configStatus?.imap_configured,
    configStatus?.smtp_configured,
  ].filter(Boolean).length;

  return (
    <aside className="w-full md:w-56 md:min-h-screen bg-[#0f172a] text-slate-300 flex flex-col justify-between flex-shrink-0">
      <div>
        {/* Brand */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center tracking-tight">
              Q
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              QuikCPQ
            </span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}
            title={systemOnline ? 'API Connected' : 'Connecting...'}
          />
        </div>

        {/* Navigation */}
        <nav className="p-2.5 flex md:flex-col gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-medium tabular-nums ${
                      item.highlight
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Integrations Link */}
      <div className="hidden md:block p-3 border-t border-slate-800">
        <button
          onClick={onOpenIntegrations}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 font-medium">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Integrations
          </span>
          <span className="text-[11px] font-medium text-emerald-400 tabular-nums">
            {connectedCount}/3
          </span>
        </button>
        {configStatus?.imap_user && (
          <div className="px-2.5 mt-1 text-[11px] text-slate-500 truncate" title={configStatus.imap_user}>
            {configStatus.imap_user}
          </div>
        )}
      </div>
    </aside>
  );
}
