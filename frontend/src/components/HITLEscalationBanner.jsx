import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Check, CornerDownRight, FileSignature } from 'lucide-react';

export default function HITLEscalationBanner({ 
  quote, 
  onApproveOverride, 
  onAcceptCounterOffer,
  isProcessing 
}) {
  if (!quote || quote.guardrail_status !== 'ESCALATED') return null;

  const violations = quote.guardrail_violations || [];
  const counterOffer = quote.counter_offer;
  const [overrideNotes, setOverrideNotes] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  return (
    <div className="mb-6 rounded-2xl bg-amber-50/70 border border-amber-200/90 p-5 shadow-xs">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-amber-950">
              Financial Policy Escalation — Deal Desk Manager Review Required
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800 font-bold border border-amber-300 uppercase">
              Sending Blocked
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            The requested customer discount exceeds autonomous approval thresholds and breaches the company gross margin floor.
          </p>

          <div className="mt-3 space-y-1.5">
            {violations.map((v, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-amber-900 bg-white/80 border border-amber-200 rounded-lg p-2.5 shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-amber-950">[{v.rule}] </span>
                  {v.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Synthesized Compliant Counter-Offer Card */}
      {counterOffer && (
        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 text-indigo-600" />
              AI Agent Proposed Compliant Counter-Offer
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Restores Gross Margin to {counterOffer.proposed_gross_margin_pct}%
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            {counterOffer.executive_summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs mb-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Authorized Discount</span>
              <span className="font-bold text-indigo-600 text-sm">{counterOffer.proposed_discount_pct}%</span>
              <span className="text-[10px] text-slate-400 block">Policy maximum limit</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Counter Net Investment</span>
              <span className="font-bold text-emerald-600 text-sm">${counterOffer.proposed_net_monthly.toLocaleString()}/mo</span>
              <span className="text-[10px] text-slate-400 block">${counterOffer.proposed_net_annual.toLocaleString()}/yr</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Required Commitment</span>
              <span className="font-bold text-slate-900 text-sm">{counterOffer.required_commitment_months} Months</span>
              <span className="text-[10px] text-slate-400 block">Annual advance billing</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <div>
              {!showOverrideInput ? (
                <button
                  onClick={() => setShowOverrideInput(true)}
                  disabled={isProcessing}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Grant Override...
                </button>
              ) : (
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter manager rationale..."
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    className="bg-white border border-slate-300 text-xs px-3 py-2 rounded-lg text-slate-900 w-56 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    onClick={() => onApproveOverride(overrideNotes)}
                    disabled={isProcessing}
                    className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    Confirm Override
                  </button>
                  <button
                    onClick={() => setShowOverrideInput(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onAcceptCounterOffer}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Accept Compliant Counter-Offer (15% / 24-Mo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
