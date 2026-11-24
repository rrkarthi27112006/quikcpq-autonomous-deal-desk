import React from 'react';
import { X, Layers, ShieldCheck, Percent, DollarSign, CheckCircle2 } from 'lucide-react';

export default function CatalogModal({ isOpen, onClose, catalog }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">B2B SaaS Pricing Catalog & Policy Matrix</h2>
              <p className="text-xs text-slate-500">Rules applied deterministically by the Configurator and Pricing Agents</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Base Tiers */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Base Subscription Tiers
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="font-bold text-slate-900">Starter</span>
                  <p className="text-[11px] text-slate-500">Essential CPQ & quoting workflow</p>
                </div>
                <span className="font-bold text-emerald-600 font-mono text-sm">$50<span className="text-[10px] text-slate-400 font-sans">/seat/mo</span></span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="font-bold text-indigo-700">Pro</span>
                  <p className="text-[11px] text-slate-500">Workflow automation, dynamic pricing</p>
                </div>
                <span className="font-bold text-emerald-600 font-mono text-sm">$120<span className="text-[10px] text-slate-400 font-sans">/seat/mo</span></span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="font-bold text-purple-700">Enterprise</span>
                  <p className="text-[11px] text-slate-500">Dedicated tenant, SOC2 Type II, AI modules</p>
                </div>
                <span className="font-bold text-emerald-600 font-mono text-sm">$250<span className="text-[10px] text-slate-400 font-sans">/seat/mo</span></span>
              </div>
            </div>
          </div>

          {/* Add-ons & Dependencies */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Add-ons & Bundle Prerequisites
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Enterprise SSO</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">$30<span className="text-[10px] text-slate-400 font-sans">/seat/mo</span></span>
                </div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Prerequisite: Requires Pro or Enterprise Tier
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Dedicated Support</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">$1,500<span className="text-[10px] text-slate-400 font-sans">/flat/mo</span></span>
                </div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  Valid on any tier (24/7 TAM SLA)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Custom AI Module</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">$80<span className="text-[10px] text-slate-400 font-sans">/seat/mo</span></span>
                </div>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                  Prerequisite: Requires Enterprise Tier Only
                </span>
              </div>
            </div>
          </div>

          {/* Volume Discount Rules */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-600" />
              Standard Seat Volume Discount
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-600">1 - 49 Seats</span>
                <span className="font-mono font-bold text-slate-500">0.0% Discount</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-600">50 - 199 Seats</span>
                <span className="font-mono font-bold text-emerald-600">10.0% Discount</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-slate-600">200+ Seats</span>
                <span className="font-mono font-bold text-emerald-600">15.0% Discount</span>
              </div>
            </div>
          </div>

          {/* Financial Guardrails */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Autonomous Financial Guardrails
            </h3>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs flex justify-between items-center">
                <span className="text-slate-600">Cost of Goods Sold (COGS)</span>
                <span className="font-mono font-bold text-slate-900">60% of List Price</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Minimum Gross Margin Floor</span>
                  <span className="font-mono font-bold text-emerald-600">&gt;= 25.0%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Deals with &lt; 25% margin automatically escalate to HITL</p>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Max Auto-Approved Discount</span>
                  <span className="font-mono font-bold text-amber-600">&lt;= 15.0%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Discounts &gt; 15% require HITL manager approval or counter-offer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
