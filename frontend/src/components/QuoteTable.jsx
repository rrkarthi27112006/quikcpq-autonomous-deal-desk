import React, { useState, useEffect } from 'react';
import { Download, Send, Save, Copy, Check } from 'lucide-react';
import AgentTimeline from './AgentTimeline';

export default function QuoteTable({
  quote,
  onDownloadPDF,
  isDownloadingPDF,
  onSaveDraft,
  onSendEmail,
  isSendingEmail,
  deliveryFeedback,
}) {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'email' | 'activity'
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (quote) {
      setEmailDraft(quote.client_email_draft || '');
      setRecipientEmail(quote.customer_email || '');
    }
  }, [quote?.quote_id, quote?.client_email_draft, quote?.customer_email]);

  if (!quote) return null;

  const lineItems = quote.line_items || [];
  const fixes = quote.dependency_fixes || [];
  const approvalType = quote.approval_type || 'auto';
  const isEscalated = quote.guardrail_status === 'ESCALATED';
  const isSent = quote.delivery_status === 'SENT';

  const handleCopyEmail = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(emailDraft);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSave = async () => {
    if (onSaveDraft) {
      await onSaveDraft(quote.quote_id, emailDraft);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }
  };

  const tabs = [
    { id: 'items', label: `Line items (${lineItems.length})` },
    { id: 'email', label: 'Email reply' },
    { id: 'activity', label: `Activity (${(quote.execution_trace || []).length})` },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 py-2">
          <button
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            {isDownloadingPDF ? 'Generating...' : 'Download PDF'}
          </button>

          <button
            onClick={() => onSendEmail(quote.quote_id, recipientEmail, emailDraft)}
            disabled={isEscalated || isSendingEmail}
            title={
              isEscalated
                ? 'Approve or accept counter-offer before sending'
                : `Send quote & PDF to ${recipientEmail}`
            }
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {isSendingEmail ? 'Sending...' : isSent ? 'Resend email' : 'Send quote'}
          </button>
        </div>
      </div>

      {/* Delivery Notice */}
      {(isSent || deliveryFeedback) && (
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{deliveryFeedback || `Sent to ${quote.sent_to || quote.customer_email}`}</span>
          {quote.sent_at && (
            <span className="text-[11px] text-emerald-700 tabular-nums">
              {new Date(quote.sent_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Tab 1: Invoice-Style Line Items */}
      {activeTab === 'items' && (
        <div className="p-5">
          {fixes.length > 0 && (
            <div className="mb-4 border-l-2 border-indigo-500 bg-indigo-50/50 px-3.5 py-2.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-900">Plan adjusted: </span>
              {fixes[0].action}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-medium text-gray-500">
                  <th className="py-2.5 pr-4">Item</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit price</th>
                  <th className="py-2.5 px-4 text-right">Monthly</th>
                  <th className="py-2.5 pl-4 text-right">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {item.category === 'base_tier' ? 'Base subscription' : 'Add-on'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-3 px-4 text-right tabular-nums">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-gray-900">
                      ${item.subtotal_monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 pl-4 text-right tabular-nums text-gray-600">
                      ${item.subtotal_annual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="text-gray-500">
              Billing: <span className="text-gray-800 font-medium">Annual advance, Net 30</span>
              {approvalType === 'counter_offer_accepted' && (
                <span className="ml-2 text-emerald-700 font-medium">&bull; 24-month term</span>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 tabular-nums">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>
                  ${(quote.list_price_monthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Discount ({quote.applied_discount_pct}%)</span>
                <span>
                  -${((quote.list_price_monthly || 0) * (quote.applied_discount_pct / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 text-sm pt-1.5 border-t border-gray-200">
                <span>Total due</span>
                <span>
                  ${(quote.net_price_monthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Email Composer */}
      {activeTab === 'email' && (
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">To</span>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs text-gray-900 w-64 focus:outline-none focus:border-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md cursor-pointer"
              >
                {draftSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 text-gray-400" />}
                {draftSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md cursor-pointer"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                {copiedEmail ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <textarea
            rows={13}
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            className="w-full bg-gray-50 p-3.5 rounded-md border border-gray-200 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-gray-400 focus:bg-white resize-y"
          />
        </div>
      )}

      {/* Tab 3: Activity Log */}
      {activeTab === 'activity' && (
        <AgentTimeline executionTrace={quote.execution_trace || []} />
      )}
    </div>
  );
}
