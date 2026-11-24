import React from 'react';
import { X, Layers, ShieldCheck, Percent, DollarSign, CheckCircle2 } from 'lucide-react';

export default function CatalogModal({ isOpen, onClose, catalog }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">B2B SaaS Pricing Catalog & Guardrail Matrix</h2>
              <p className="text-xs text-slate-400">Rules applied deterministically by the Configurator and Pricing Agents</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Base Tiers */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Base Subscription Tiers
            </h3>
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-white">Starter</span>
                  <p className="text-[11px] text-slate-400">Essential CPQ & quote workflow</p>
                </div>
                <span className="font-bold text-emerald-400">$50<span className="text-[10px] text-slate-500">/seat/mo</span></span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-indigo-300">Pro</span>
                  <p className="text-[11px] text-slate-400">Workflow automation, CRM sync</p>
                </div>
                <span className="font-bold text-emerald-400">$120<span className="text-[10px] text-slate-500">/seat/mo</span></span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-purple-300">Enterprise</span>
                  <p className="text-[11px] text-slate-400">Dedicated tenant, SOC2 Type II</p>
                </div>
                <span className="font-bold text-emerald-400">$250<span className="text-[10px] text-slate-500">/seat/mo</span></span>
              </div>
            </div>
          </div>

          {/* Add-ons & Dependencies */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Add-ons & Bundle Prerequisites
            </h3>
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-white">Enterprise SSO</span>
                  <span className="font-bold text-emerald-400">$30<span className="text-[10px] text-slate-500">/seat/mo</span></span>
                </div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Requires: Pro or Enterprise Tier
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-white">Dedicated Support</span>
                  <span className="font-bold text-emerald-400">$1,500<span className="text-[10px] text-slate-500">/flat/mo</span></span>
                </div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Valid across all tiers (24/7 SLA)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-white">Custom AI Module</span>
                  <span className="font-bold text-emerald-400">$80<span className="text-[10px] text-slate-500">/seat/mo</span></span>
                </div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Requires: Enterprise Tier Only
                </span>
              </div>
            </div>
          </div>

          {/* Volume Discount Rules */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-400" />
              Standard Volume Discount Brackets
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-300">1 - 49 Seats</span>
                <span className="font-mono font-bold text-slate-400">0% Discount</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-300">50 - 199 Seats</span>
                <span className="font-mono font-bold text-emerald-400">10% Volume Discount</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-300">200+ Seats</span>
                <span className="font-mono font-bold text-emerald-400">15% Volume Discount</span>
              </div>
            </div>
          </div>

          {/* Financial Guardrails */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Autonomous Financial Guardrails
            </h3>
            <div className="space-y-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Base Cost of Goods Sold (COGS)</span>
                  <span className="font-mono font-bold text-slate-200">60% of List Price</span>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Minimum Gross Margin Floor</span>
                  <span className="font-mono font-bold text-emerald-400">&gt;= 25.0%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Deals with &lt; 25% margin automatically escalate to HITL</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Max Auto-Approved Discount</span>
                  <span className="font-mono font-bold text-amber-400">&lt;= 15.0%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Discounts &gt; 15% require HITL manager override or counter-offer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
