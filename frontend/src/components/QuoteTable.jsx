import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  Database
} from 'lucide-react';

export default function QuoteTable({ quote, onDownloadPDF, isDownloadingPDF }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'email' | 'audit'
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!quote) return null;

  const lineItems = quote.line_items || [];
  const fixes = quote.dependency_fixes || [];
  const approvalType = quote.approval_type || 'auto';

  const handleCopyEmail = () => {
    if (quote.client_email_draft) {
      navigator.clipboard.writeText(quote.client_email_draft);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs mb-8">
      {/* Tab Navigation Header */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'items'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Configured Items ({lineItems.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            Client Response Email
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            Audit Trail
          </button>
        </div>

        {/* Primary PDF Download Action */}
        <button
          onClick={onDownloadPDF}
          disabled={isDownloadingPDF}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          {isDownloadingPDF ? 'Generating...' : 'Download Official PDF Quote'}
        </button>
      </div>

      {/* Tab 1: Line Items Table */}
      {activeTab === 'items' && (
        <div className="p-5">
          {/* Bundle Auto-Fix Banner if applicable */}
          {fixes.length > 0 && (
            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">Intelligent Bundle Auto-Correction: </span>
                {fixes[0].action}
                <div className="text-[11px] text-indigo-700 mt-0.5">
                  Reason: Enterprise SSO requires Pro or Enterprise tier architecture to ensure SOC2 & SAML compliance.
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item / Service Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Monthly Total</th>
                  <th className="py-3 px-4 text-right">Annual Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        item.category === 'base_tier' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.category === 'base_tier' ? 'Base Tier' : 'Add-on'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ${item.subtotal_monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ${item.subtotal_annual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Deductions */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="text-slate-500">
              Contract Terms: <span className="font-semibold text-slate-800">Annual Advance Billing, Net 30</span>
              {approvalType === 'counter_offer_accepted' && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  24-Month Term Locked
                </span>
              )}
            </div>

            <div className="w-full sm:w-auto text-right space-y-1">
              <div className="flex justify-between sm:justify-end gap-6 text-slate-500">
                <span>Gross List Price:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  ${(quote.list_price_monthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-rose-600">
                <span>Discount ({quote.applied_discount_pct}%):</span>
                <span className="font-mono font-semibold">
                  -${((quote.list_price_monthly || 0) * (quote.applied_discount_pct / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-sm font-bold text-emerald-600 pt-1 border-t border-slate-200">
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
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">
              Synthesized by Proposal Closer Agent for <strong className="text-slate-800">{quote.customer_name}</strong>
            </span>
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Text'}
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap select-all">
            {quote.client_email_draft}
          </div>
        </div>
      )}

      {/* Tab 3: Governance & Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-5 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Quote Reference ID:</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{quote.quote_id}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">Audit DB Persistence:</span>
              <span className="font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Stored in backend/data/audit.db
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
            <div className="text-slate-800 font-semibold mb-1.5 font-sans">Policy Compliance Metadata:</div>
            <div>&bull; Max Auto-Approved Discount Ceiling: 15.0%</div>
            <div>&bull; Minimum Gross Margin Floor: 25.0%</div>
            <div>&bull; Calculated Margin: {quote.gross_margin_pct}%</div>
            <div>&bull; Guardrail Status: {quote.guardrail_status}</div>
            <div>&bull; Approval Mode: {quote.approval_type || 'auto'}</div>
            {quote.manager_notes && (
              <div className="text-amber-700 mt-1">&bull; Manager Notes: {quote.manager_notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
