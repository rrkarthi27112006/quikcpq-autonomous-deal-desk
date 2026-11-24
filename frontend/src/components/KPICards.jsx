import React from 'react';
import { DollarSign, Percent, TrendingUp, ShieldAlert, ShieldCheck } from 'lucide-react';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Gross List Price */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Gross List Price</span>
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ${listMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs font-normal text-slate-500">/mo</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ${listAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr catalog total
        </div>
      </div>

      {/* 2. Applied Discount */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Applied Discount</span>
          <div className={`p-1.5 rounded-lg ${discountPct > 15 ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold tracking-tight ${discountPct > 15 ? 'text-amber-600' : 'text-indigo-600'}`}>
            {discountPct.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 font-medium truncate max-w-[110px]" title={quote.discount_source}>
            ({quote.discount_source || 'Standard'})
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Save ${((listMonthly * discountPct) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
        </div>
      </div>

      {/* 3. Net Total Investment */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Contract Total</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-600 tracking-tight">
          ${netMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs font-normal text-slate-500">/mo</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ${netAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year net revenue
        </div>
      </div>

      {/* 4. Gross Margin % */}
      <div className={`rounded-2xl p-4 border transition-all ${
        isHealthyMargin 
          ? 'bg-white border-slate-200/90 shadow-xs' 
          : 'bg-rose-50/50 border-rose-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Gross Margin</span>
          <div className={`p-1.5 rounded-lg ${
            isHealthyMargin 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-rose-100 text-rose-600'
          }`}>
            {isHealthyMargin ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${
            isHealthyMargin ? 'text-slate-900' : 'text-rose-600'
          }`}>
            {grossMargin.toFixed(1)}%
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            isHealthyMargin 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-100 text-rose-700 border border-rose-300'
          }`}>
            {isHealthyMargin ? 'Floor Passed' : 'Floor Breach (< 25%)'}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          COGS ratio 60% (${(listMonthly * 0.6).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo)
        </div>
      </div>
    </div>
  );
}
