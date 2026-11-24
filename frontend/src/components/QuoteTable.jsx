import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Sparkles,
  Database
} from 'lucide-react';

export default function QuoteTable({ quote, onDownloadPDF, isDownloadingPDF }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'email' | 'audit'
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!quote) return null;

  const lineItems = quote.line_items || [];
  const fixes = quote.dependency_fixes || [];
  const status = quote.guardrail_status || 'PENDING';
  const approvalType = quote.approval_type || 'auto';

  const handleCopyEmail = () => {
    if (quote.client_email_draft) {
      navigator.clipboard.writeText(quote.client_email_draft);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg mb-8">
      {/* Tab Navigation Header */}
      <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'items'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Configured Line Items ({lineItems.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'email'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Client Response Email
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'audit'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Audit Trail
          </button>
        </div>

        {/* Primary PDF Download Action */}
        <button
          onClick={onDownloadPDF}
          disabled={isDownloadingPDF}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {isDownloadingPDF ? 'Generating PDF...' : 'Download Official PDF Quote'}
        </button>
      </div>

      {/* Tab 1: Line Items Table */}
      {activeTab === 'items' && (
        <div className="p-4 sm:p-5">
          {/* Bundle Auto-Fix Banner if applicable */}
          {fixes.length > 0 && (
            <div className="mb-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-indigo-300">Intelligent Bundle Auto-Correction: </span>
                {fixes[0].action}
                <div className="text-[11px] text-indigo-300/80 mt-0.5">
                  Reason: Enterprise SSO requires Pro or Enterprise tier architecture to ensure SOC2 & SAML compliance.
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3.5">Item / Service Description</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5 text-right">Quantity</th>
                  <th className="py-2.5 px-3.5 text-right">Unit Price</th>
                  <th className="py-2.5 px-3.5 text-right">Monthly Total</th>
                  <th className="py-2.5 px-3.5 text-right">Annual Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3.5 font-medium text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono ${
                        item.category === 'base_tier' 
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono">{item.quantity}</td>
                    <td className="py-3 px-3.5 text-right font-mono">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-200">
                      ${item.subtotal_monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-200">
                      ${item.subtotal_annual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Deductions */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="text-slate-400">
              Contract Terms: <span className="font-semibold text-slate-200">Annual Advance Billing, Net 30</span>
              {approvalType === 'counter_offer_accepted' && (
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  24-Month Term Locked
                </span>
              )}
            </div>

            <div className="w-full sm:w-auto text-right space-y-1">
              <div className="flex justify-between sm:justify-end gap-6 text-slate-400">
                <span>Gross List Price:</span>
                <span className="font-mono text-slate-300 font-semibold">
                  ${(quote.list_price_monthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-rose-400">
                <span>Discount ({quote.applied_discount_pct}%):</span>
                <span className="font-mono font-semibold">
                  -${((quote.list_price_monthly || 0) * (quote.applied_discount_pct / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-sm font-bold text-emerald-400 pt-1 border-t border-slate-800">
                <span>Net Total:</span>
                <span className="font-mono">
                  ${(quote.net_price_monthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Client Response Email Draft */}
      {activeTab === 'email' && (
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              Synthesized by Proposal Closer Agent for <strong className="text-white">{quote.customer_name}</strong>
            </span>
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800/80 hover:bg-slate-800 px-3 py-1 rounded-lg transition-colors"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedEmail ? 'Copied!' : 'Copy Email Text'}
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600">
            {quote.client_email_draft}
          </div>
        </div>
      )}

      {/* Tab 3: Governance & Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-4 sm:p-5 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Quote Reference ID:</span>
              <span className="font-mono font-bold text-indigo-300 text-sm">{quote.quote_id}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Audit DB Persistence:</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Stored in backend/data/audit.db
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto">
            <div className="text-slate-300 font-semibold mb-1 font-sans">Policy Compliance Metadata:</div>
            <div>&bull; Max Auto-Approved Discount Ceiling: 15.0%</div>
            <div>&bull; Minimum Gross Margin Floor: 25.0%</div>
            <div>&bull; Evaluated Margin: {quote.gross_margin_pct}%</div>
            <div>&bull; Guardrail Status: {quote.guardrail_status}</div>
            <div>&bull; Approval Mode: {quote.approval_type || 'auto'}</div>
            {quote.manager_notes && (
              <div className="text-amber-300 mt-1">&bull; Manager Notes: {quote.manager_notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
