import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Check, ArrowRight, CornerDownRight, FileSignature } from 'lucide-react';

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
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 p-5 shadow-xl shadow-amber-950/20">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 animate-pulse">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-amber-300">
              Autonomous Guardrail Breach — Human-in-the-Loop (HITL) Escalation Required
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 uppercase">
              Deal Blocked
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            The deal parameters requested in this RFP violate enterprise financial governance rules and cannot be automatically finalized without Deal Desk Manager authorization.
          </p>

          {/* Policy Violations List */}
          <div className="mt-3 space-y-1.5">
            {violations.map((v, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-amber-200/90 bg-amber-950/40 border border-amber-900/60 rounded-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-amber-300">[{v.rule}] </span>
                  {v.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Synthesized Compliant Counter-Offer Card */}
      {counterOffer && (
        <div className="mt-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 text-indigo-400" />
              AI Agent Proposed Compliant Counter-Offer
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Preserves {counterOffer.proposed_gross_margin_pct}% Margin Floor
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            {counterOffer.executive_summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs mb-3 font-mono">
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Authorized Discount</span>
              <span className="font-bold text-indigo-300 text-sm">{counterOffer.proposed_discount_pct}%</span>
              <span className="text-[10px] text-slate-500 font-sans block">Policy max cap</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Counter Net Investment</span>
              <span className="font-bold text-emerald-400 text-sm">${counterOffer.proposed_net_monthly.toLocaleString()}/mo</span>
              <span className="text-[10px] text-slate-500 font-sans block">${counterOffer.proposed_net_annual.toLocaleString()}/year</span>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Required Contract Term</span>
              <span className="font-bold text-white text-sm">{counterOffer.required_commitment_months} Months</span>
              <span className="text-[10px] text-slate-500 font-sans block">Annual advance billing</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 mb-4">
            {counterOffer.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          {/* HITL Action Controls */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
            {!showOverrideInput ? (
              <button
                onClick={() => setShowOverrideInput(true)}
                disabled={isProcessing}
                className="px-3 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-600/40 rounded-lg transition-colors"
              >
                Request Manager Override...
              </button>
            ) : (
              <div className="w-full sm:w-auto flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter manager rationale / exception code..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs px-3 py-2 rounded-lg text-white w-64 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => onApproveOverride(overrideNotes)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  Grant Override
                </button>
                <button
                  onClick={() => setShowOverrideInput(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={onAcceptCounterOffer}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
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
