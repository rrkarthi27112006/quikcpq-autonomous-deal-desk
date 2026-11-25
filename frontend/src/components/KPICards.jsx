import React from 'react';

export default function KPICards({ quote }) {
  if (!quote) return null;

  const listMonthly = quote.list_price_monthly || 0;
  const listAnnual = quote.list_price_annual || listMonthly * 12;
  const discountPct = quote.applied_discount_pct || 0;
  const netMonthly = quote.net_price_monthly || 0;
  const netAnnual = quote.net_price_annual || netMonthly * 12;
  const grossMargin = quote.gross_margin_pct || 0;
  const isHealthyMargin = grossMargin >= 25.0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
      <div className="p-4">
        <div className="text-[11px] font-medium text-gray-500">List price</div>
        <div className="text-lg font-semibold text-gray-900 mt-0.5 tabular-nums">
          ${listMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs font-normal text-gray-400">/mo</span>
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
          ${listAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr
        </div>
      </div>

      <div className="p-4">
        <div className="text-[11px] font-medium text-gray-500">Discount</div>
        <div className={`text-lg font-semibold mt-0.5 tabular-nums ${discountPct > 15 ? 'text-amber-700' : 'text-gray-900'}`}>
          {discountPct.toFixed(1)}%
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5 truncate" title={quote.discount_source}>
          {quote.discount_source || 'Standard volume'}
        </div>
      </div>

      <div className="p-4">
        <div className="text-[11px] font-medium text-gray-500">Net total</div>
        <div className="text-lg font-semibold text-gray-900 mt-0.5 tabular-nums">
          ${netMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs font-normal text-gray-400">/mo</span>
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
          ${netAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr
        </div>
      </div>

      <div className="p-4">
        <div className="text-[11px] font-medium text-gray-500">Gross margin</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className={`text-lg font-semibold tabular-nums ${isHealthyMargin ? 'text-gray-900' : 'text-rose-600'}`}>
            {grossMargin.toFixed(1)}%
          </span>
          <span className={`text-[11px] font-medium ${isHealthyMargin ? 'text-emerald-700' : 'text-rose-600'}`}>
            {isHealthyMargin ? 'Compliant' : 'Below 25%'}
          </span>
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
          COGS ${(listMonthly * 0.6).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo
        </div>
      </div>
    </div>
  );
}
