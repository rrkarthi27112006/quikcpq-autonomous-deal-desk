import React, { useState } from 'react';
import { Check, ExternalLink } from 'lucide-react';

export default function ApprovalsView({
  escalatedQuotes,
  onAcceptCounterOffer,
  onApproveOverride,
  onInspectQuote,
  isProcessing,
  onGoToInbox,
}) {
  const [overrideTargetId, setOverrideTargetId] = useState(null);
  const [overrideNotes, setOverrideNotes] = useState('');

  if (!escalatedQuotes || escalatedQuotes.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-lg p-12 text-center">
        <div className="text-sm font-semibold text-slate-900">No pending approvals</div>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          All quotes currently meet your discount and margin thresholds.
        </p>
        <button
          onClick={onGoToInbox}
          className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md cursor-pointer"
        >
          Back to Quotes
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Pending approvals ({escalatedQuotes.length})
        </h2>
      </div>

      {escalatedQuotes.map((q) => {
        const co = q.counter_offer;
        const violations = q.guardrail_violations || [];
        const isOverrideOpen = overrideTargetId === q.quote_id;

        return (
          <div
            key={q.quote_id}
            className="bg-white border border-gray-200 rounded-lg p-5 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {q.customer_company || q.customer_name}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">{q.quote_id}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 pl-4">
                  {q.customer_name} ({q.customer_email}) &bull; {q.seats} seats ({q.base_tier_name || q.base_tier})
                </p>
              </div>

              <button
                onClick={() => onInspectQuote(q.quote_id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Open quote <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="text-xs text-amber-800 bg-amber-50/60 border border-amber-200/80 rounded-md px-3 py-2 space-y-0.5">
              {violations.map((v, i) => (
                <div key={i}>&bull; {v.message}</div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="p-3.5 rounded-md border border-gray-200 bg-gray-50/60">
                <div className="text-[11px] font-medium text-gray-500 mb-2">
                  Client requested
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Discount</span>
                    <span className="font-semibold text-rose-600">{q.applied_discount_pct}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Net / mo</span>
                    <span className="font-semibold text-gray-900">
                      ${(q.net_price_monthly || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Margin</span>
                    <span className="font-semibold text-rose-600">{q.gross_margin_pct}%</span>
                  </div>
                </div>
              </div>

              {co && (
                <div className="p-3.5 rounded-md border border-gray-200 bg-white">
                  <div className="text-[11px] font-medium text-gray-500 mb-2">
                    Compliant counter-offer ({co.required_commitment_months}-mo term)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Discount</span>
                      <span className="font-semibold text-emerald-700">{co.proposed_discount_pct}%</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Net / mo</span>
                      <span className="font-semibold text-gray-900">
                        ${(co.proposed_net_monthly || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Margin</span>
                      <span className="font-semibold text-emerald-700">{co.proposed_gross_margin_pct}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
              {!isOverrideOpen ? (
                <button
                  onClick={() => {
                    setOverrideTargetId(q.quote_id);
                    setOverrideNotes('');
                  }}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
                >
                  Override
                </button>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="text"
                    placeholder="Override reason..."
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    className="bg-white border border-gray-300 text-xs px-2.5 py-1.5 rounded-md w-52 focus:outline-none focus:border-gray-500"
                  />
                  <button
                    onClick={() => {
                      onApproveOverride(q.quote_id, overrideNotes);
                      setOverrideTargetId(null);
                    }}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-md cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setOverrideTargetId(null)}
                    className="text-xs text-gray-500 hover:text-gray-800 px-1.5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {co && (
                <button
                  onClick={() => onAcceptCounterOffer(q.quote_id)}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept counter-offer
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
