import React from 'react';
import { RefreshCw, Mail, FileText, Search, ShieldAlert, CheckCircle2, Send } from 'lucide-react';

export default function PipelineSidebar({
  quotes,
  selectedQuoteId,
  onSelectQuote,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onSyncInbox,
  isSyncing,
  syncNotice,
}) {
  const filters = [
    { id: 'ALL', label: 'All' },
    { id: 'ESCALATED', label: 'Needs Review' },
    { id: 'APPROVED', label: 'Ready' },
    { id: 'SENT', label: 'Sent' },
  ];

  const filteredQuotes = (quotes || []).filter((q) => {
    if (!searchQuery.trim()) return true;
    const s = searchQuery.toLowerCase();
    return (
      (q.customer_company || '').toLowerCase().includes(s) ||
      (q.customer_name || '').toLowerCase().includes(s) ||
      (q.customer_email || '').toLowerCase().includes(s) ||
      (q.quote_id || '').toLowerCase().includes(s)
    );
  });

  const getStatusPill = (q) => {
    if (q.delivery_status === 'SENT') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
          <Send className="w-2.5 h-2.5" /> Sent
        </span>
      );
    }
    if (q.guardrail_status === 'ESCALATED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
          <ShieldAlert className="w-2.5 h-2.5 text-amber-600" /> Escalated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
        <CheckCircle2 className="w-2.5 h-2.5" /> Approved
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Top Bar: Title + Sync Inbox */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Deal Desk Queue
          </h2>
          <p className="text-[11px] text-slate-400">Inbound client emails & quotes</p>
        </div>
        <button
          onClick={onSyncInbox}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          title="Check connected IMAP inbox for new client RFP emails"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Inbox'}
        </button>
      </div>

      {/* Optional Sync Feedback Notice */}
      {syncNotice && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
          {syncNotice}
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="p-3 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, email, or ID..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes List */}
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {filteredQuotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No matching quotes found. Click <strong>New Quote</strong> or <strong>Sync Inbox</strong> to process a client request.
          </div>
        ) : (
          filteredQuotes.map((q) => {
            const isSelected = selectedQuoteId === q.quote_id;
            const isInbound = q.source === 'email_inbound' || q.source === 'webhook';
            return (
              <button
                key={q.quote_id}
                onClick={() => onSelectQuote(q.quote_id)}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isInbound ? (
                      <Mail className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" title="Inbound Client Email" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" title="Quote Builder" />
                    )}
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {q.customer_company || q.customer_name}
                    </span>
                  </div>
                  {getStatusPill(q)}
                </div>

                <div className="text-[11px] text-slate-500 truncate mb-1.5">
                  {q.email_subject || `${q.seats} seats • ${(q.base_tier || '').toUpperCase()} Tier`}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-semibold text-slate-800">
                    ${(q.net_price_monthly || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo
                  </span>
                  <span className={`font-mono ${q.gross_margin_pct < 25 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    {Number(q.gross_margin_pct || 0).toFixed(1)}% margin
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
