import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

export default function CatalogAdminView({ catalog, onSaveCatalog, isSaving }) {
  const [draft, setDraft] = useState(catalog);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setDraft(catalog);
  }, [catalog]);

  if (!draft) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
        Loading catalog...
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
    <div className="w-full space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Product catalog & pricing rules</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Updates apply immediately to all new quotes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {savedBanner && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold text-slate-900 mb-3">Base plans ($/seat/mo)</h3>
          <div className="divide-y divide-slate-100">
            {draft.base_tiers.map((tier, idx) => (
              <div key={tier.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-900">{tier.name}</div>
                  <div className="text-[11px] text-slate-500">{tier.description}</div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={tier.price}
                  onChange={(e) => updateTierPrice(idx, e.target.value)}
                  className="w-24 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs tabular-nums font-medium text-slate-900 text-right focus:outline-none focus:border-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold text-slate-900 mb-3">Add-ons</h3>
          <div className="divide-y divide-slate-100">
            {draft.add_ons.map((addon, idx) => (
              <div key={addon.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-900">{addon.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Requires {addon.required_base_tier.join(' or ')} &bull; {addon.type === 'flat_fee' ? 'flat/mo' : 'seat/mo'}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={addon.price}
                  onChange={(e) => updateAddonPrice(idx, e.target.value)}
                  className="w-24 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs tabular-nums font-medium text-slate-900 text-right focus:outline-none focus:border-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold text-slate-900 mb-3">Volume discounts (%)</h3>
          <div className="divide-y divide-slate-100">
            {draft.volume_discount_tiers.map((vt, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-700">{vt.label}</div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={vt.discount_pct}
                  onChange={(e) => updateVolumeDiscount(idx, e.target.value)}
                  className="w-24 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs tabular-nums font-medium text-slate-900 text-right focus:outline-none focus:border-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold text-slate-900 mb-3">Approval guardrails</h3>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-900">Base COGS ratio</div>
                <div className="text-[11px] text-slate-500">Fraction of list price (e.g. 0.60)</div>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.95"
                value={draft.financial_guardrails.cogs_ratio}
                onChange={(e) => updateGuardrail('cogs_ratio', e.target.value)}
                className="w-24 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs tabular-nums font-medium text-slate-900 text-right focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-900">Minimum gross margin (%)</div>
                <div className="text-[11px] text-slate-500">Floor before escalation</div>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="90"
                value={draft.financial_guardrails.min_gross_margin_pct}
                onChange={(e) => updateGuardrail('min_gross_margin_pct', e.target.value)}
                className="w-24 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs tabular-nums font-medium text-slate-900 text-right focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-900">Max auto-approved discount (%)</div>
                <div className="text-[11px] text-slate-500">Ceiling before escalation</div>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="90"
                value={draft.financial_guardrails.max_auto_approved_discount_pct}
                onChange={(e) => updateGuardrail('max_auto_approved_discount_pct', e.target.value)}
                className="w-24 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs tabular-nums font-medium text-slate-900 text-right focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
