import React from 'react';
import { Sparkles, Building2, ShieldAlert, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export default function ScenarioSelector({ 
  scenarios, 
  selectedScenarioId, 
  onSelectScenario,
  rfpText,
  setRfpText,
  onRunCPQ,
  isRunning
}) {
  return (
    <div className="space-y-4">
      {/* Scenario Selection Header & Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Pre-Loaded Test Scenarios
          </h2>
          <span className="text-[11px] text-slate-500">Hackathon Benchmark Suite</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {scenarios.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md shadow-indigo-950/30 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {sc.title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    sc.scenario_type === 'standard_approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : sc.scenario_type === 'dependency_autofix'
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {sc.badge}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {sc.expected_behavior}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer RFP Text Editor */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Customer RFP Email Text
          </label>
          <span className="text-[10px] text-slate-400">Editable natural language prompt</span>
        </div>

        <textarea
          rows={7}
          value={rfpText}
          onChange={(e) => setRfpText(e.target.value)}
          placeholder="Paste customer procurement email, seats, tiers, add-ons, or negotiation terms..."
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by LangGraph 4-Agent Pipeline
          </span>

          <button
            onClick={onRunCPQ}
            disabled={isRunning || !rfpText.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Executing Agents...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-300" />
                Run Autonomous Deal Desk
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
