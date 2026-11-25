import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function HITLEscalationBanner({
  quote,
  onApproveOverride,
  onAcceptCounterOffer,
  isProcessing,
}) {
  if (!quote || quote.guardrail_status !== 'ESCALATED') return null;

  const violations = quote.guardrail_violations || [];
  const counterOffer = quote.counter_offer;
  const [overrideNotes, setOverrideNotes] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-amber-500 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-gray-900">
            Approval required before sending
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
            {violations.map((v, idx) => (
              <li key={idx}>&bull; {v.message}</li>
            ))}
          </ul>
        </div>
      </div>

      {counterOffer && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-semibold text-gray-900">
              Recommended counter-offer: {counterOffer.proposed_discount_pct}% discount &bull; {counterOffer.required_commitment_months}-month term
            </div>
            <div className="text-gray-500 mt-0.5 tabular-nums">
              ${counterOffer.proposed_net_monthly.toLocaleString()}/mo (${counterOffer.proposed_net_annual.toLocaleString()}/yr) &bull; Restores margin to {counterOffer.proposed_gross_margin_pct}%
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!showOverrideInput ? (
              <button
                onClick={() => setShowOverrideInput(true)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md cursor-pointer"
              >
                Override
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Override reason..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="bg-white border border-gray-300 text-xs px-2.5 py-1.5 rounded-md w-44 focus:outline-none focus:border-gray-500"
                />
                <button
                  onClick={() => onApproveOverride(overrideNotes)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-md cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowOverrideInput(false)}
                  className="text-xs text-gray-500 hover:text-gray-800 px-1.5 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={onAcceptCounterOffer}
              disabled={isProcessing}
              className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer disabled:opacity-50"
            >
              Accept counter-offer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
