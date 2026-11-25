import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, DollarSign, ShieldCheck, Layers, Percent } from 'lucide-react';

export default function CatalogAdminView({ catalog, onSaveCatalog, isSaving }) {
  const [draft, setDraft] = useState(catalog);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setDraft(catalog);
  }, [catalog]);

  if (!draft) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
        Loading product catalog...
      </div>
    );
  }

  const updateTierPrice = (idx, price) => {
    const next = structuredClone(draft);
    next.base_tiers[idx].price = Number(price) || 0;
    setDraft(next);
  };

  const updateAddonPrice = (idx, price) => {
    const next = structuredClone(draft);
    next.add_ons[idx].price = Number(price) || 0;
    setDraft(next);
  };

  const updateVolumeDiscount = (idx, pct) => {
    const next = structuredClone(draft);
    next.volume_discount_tiers[idx].discount_pct = Number(pct) || 0;
    setDraft(next);
  };

  const updateGuardrail = (field, val) => {
    const next = structuredClone(draft);
    next.financial_guardrails[field] = Number(val) || 0;
    setDraft(next);
  };

  const handleSave = async () => {
    const ok = await onSaveCatalog(draft);
    if (ok) {
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Product Catalog & Guardrail Policy Admin</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes saved here immediately govern all incoming client quotes and LangGraph pricing calculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedBanner && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Catalog
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Catalog & Rules'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Base Tiers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" /> Base Subscription Tiers ($/seat/mo)
          </h3>
          <div className="space-y-3">
            {draft.base_tiers.map((tier, idx) => (
              <div key={tier.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">{tier.name}</div>
                  <div className="text-[11px] text-slate-500">{tier.description}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTierPrice(idx, e.target.value)}
                    className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" /> Add-on Modules & Prerequisites
          </h3>
          <div className="space-y-3">
            {draft.add_ons.map((addon, idx) => (
              <div key={addon.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">{addon.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Requires: {addon.required_base_tier.join(' or ')} &bull; {addon.type === 'flat_fee' ? 'Flat/mo' : 'Per seat/mo'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={addon.price}
                    onChange={(e) => updateAddonPrice(idx, e.target.value)}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Discounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-600" /> Volume Discount Brackets (%)
          </h3>
          <div className="space-y-3">
            {draft.volume_discount_tiers.map((vt, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold text-slate-800">{vt.label}</div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={vt.discount_pct}
                    onChange={(e) => updateVolumeDiscount(idx, e.target.value)}
                    className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Guardrails */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Autonomous Financial Guardrails
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">Base COGS Ratio</div>
                <div className="text-[11px] text-slate-500">Cost of goods sold as fraction of list price (e.g. 0.60)</div>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.95"
                value={draft.financial_guardrails.cogs_ratio}
                onChange={(e) => updateGuardrail('cogs_ratio', e.target.value)}
                className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">Minimum Gross Margin Floor (%)</div>
                <div className="text-[11px] text-slate-500">Quotes below this margin escalate to HITL Manager</div>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="90"
                value={draft.financial_guardrails.min_gross_margin_pct}
                onChange={(e) => updateGuardrail('min_gross_margin_pct', e.target.value)}
                className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 text-right focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">Max Auto-Approved Discount (%)</div>
                <div className="text-[11px] text-slate-500">Discounts above this cap require Manager review</div>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="90"
                value={draft.financial_guardrails.max_auto_approved_discount_pct}
                onChange={(e) => updateGuardrail('max_auto_approved_discount_pct', e.target.value)}
                className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-700 text-right focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
