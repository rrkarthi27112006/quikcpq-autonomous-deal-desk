import React from 'react';
import { RefreshCw, Search, Mail, FileText } from 'lucide-react';

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
    { id: 'ESCALATED', label: 'Needs review' },
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

  const getStatusIndicator = (q) => {
    if (q.delivery_status === 'SENT') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Sent
        </span>
      );
    }
    if (q.guardrail_status === 'ESCALATED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Needs review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Approved
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-900">Requests</span>
        <button
          onClick={onSyncInbox}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing' : 'Sync inbox'}
        </button>
      </div>

      {syncNotice && (
        <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600">
          {syncNotice}
        </div>
      )}

      {/* Search + Clean Tab Filters */}
      <div className="p-2.5 border-b border-gray-200 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by company or email..."
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-1 border-b border-gray-100 -mx-2.5 px-2.5 pt-0.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2 py-1.5 text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
        {filteredQuotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No quotes match this filter.
          </div>
        ) : (
          filteredQuotes.map((q) => {
            const isSelected = selectedQuoteId === q.quote_id;
            const isInbound = q.source === 'email_inbound' || q.source === 'webhook';
            return (
              <button
                key={q.quote_id}
                onClick={() => onSelectQuote(q.quote_id)}
                className={`w-full text-left px-3.5 py-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50/60 border-l-2 border-l-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="flex items-center gap-1.5 min-w-0">
                    {isInbound ? (
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-[13px] font-semibold text-gray-900 truncate">
                      {q.customer_company || q.customer_name}
                    </span>
                  </span>
                  {getStatusIndicator(q)}
                </div>

                <div className="text-xs text-gray-500 truncate pl-5">
                  {q.email_subject || `${q.seats} seats • ${(q.base_tier || '').toUpperCase()}`}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5 pl-5 tabular-nums">
                  <span className="font-medium text-gray-900">
                    ${(q.net_price_monthly || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo
                  </span>
                  <span className={q.gross_margin_pct < 25 ? 'text-rose-600 font-medium' : ''}>
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
