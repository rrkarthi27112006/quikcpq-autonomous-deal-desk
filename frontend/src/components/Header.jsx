import React from 'react';
import {
  Sparkles,
  Inbox,
  PlusCircle,
  ShieldAlert,
  Sliders,
  Plug,
} from 'lucide-react';

export default function Header({
  activeView,
  setActiveView,
  escalatedCount,
  totalQuotes,
  configStatus,
  onOpenIntegrations,
  systemOnline,
}) {
  const navItems = [
    { id: 'inbox', label: 'Inbox & Pipeline', icon: Inbox, badge: totalQuotes || null },
    { id: 'new_quote', label: 'New Quote', icon: PlusCircle, badge: null },
    { id: 'approvals', label: 'Approvals', icon: ShieldAlert, badge: escalatedCount > 0 ? escalatedCount : null, alert: escalatedCount > 0 },
    { id: 'catalog', label: 'Catalog & Rules', icon: Sliders, badge: null },
  ];

  const connectedCount = [
    configStatus?.gemini_configured,
    configStatus?.imap_configured,
    configStatus?.smtp_configured,
  ].filter(Boolean).length;

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center shadow-sm shadow-indigo-600/20 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Quik<span className="text-indigo-600">CPQ</span>
              </span>
              {systemOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Connecting...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Autonomous Deal Desk
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.alert
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Integrations */}
        <div className="flex items-center gap-2.5">
          {/* Integrations Status Button */}
          <button
            onClick={onOpenIntegrations}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Email & Gemini Integration Status"
          >
            <Plug className={`w-3.5 h-3.5 ${connectedCount === 3 ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <span className="hidden lg:inline">Integrations</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              connectedCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
            }`}>
              {connectedCount}/3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
