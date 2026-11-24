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
  const status = quote.guardrail_status || 'PENDING';
  const isEscalated = quote.is_escalated;
  const isHealthyMargin = grossMargin >= 25.0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      {/* 1. Gross List Price */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Gross List Price</span>
          <div className="p-1 rounded-md bg-slate-800 text-slate-300">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-lg font-bold text-white tracking-tight">
          ${listMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[11px] font-normal text-slate-400">/mo</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          ${listAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year baseline
        </div>
      </div>

      {/* 2. Applied Discount */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Applied Discount</span>
          <div className={`p-1 rounded-md ${discountPct > 15 ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <Percent className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-bold tracking-tight ${discountPct > 15 ? 'text-amber-400' : 'text-indigo-300'}`}>
            {discountPct.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400 truncate max-w-[110px]" title={quote.discount_source}>
            ({quote.discount_source || 'Standard'})
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Save ${((listMonthly * discountPct) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
        </div>
      </div>

      {/* 3. Net Total Investment */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Net Revenue Total</span>
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-lg font-bold text-emerald-400 tracking-tight">
          ${netMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[11px] font-normal text-slate-400">/mo</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          ${netAnnual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year net contract
        </div>
      </div>

      {/* 4. Gross Margin % */}
      <div className={`rounded-xl p-3.5 border shadow-sm transition-all ${
        isHealthyMargin 
          ? 'bg-slate-900/90 border-slate-800' 
          : 'bg-rose-950/30 border-rose-800/60 shadow-rose-950/20'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Gross Margin %</span>
          <div className={`p-1 rounded-md ${
            isHealthyMargin 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-300 animate-pulse'
          }`}>
            {isHealthyMargin ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-bold tracking-tight ${
            isHealthyMargin ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {grossMargin.toFixed(1)}%
          </span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
            isHealthyMargin 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {isHealthyMargin ? 'Floor Passed (>= 25%)' : 'Floor Breach (< 25%)'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          COGS 60% of list price (${(listMonthly * 0.6).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo)
        </div>
      </div>
    </div>
  );
}
