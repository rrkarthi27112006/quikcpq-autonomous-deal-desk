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
    <div className="space-y-5">
      {/* Scenario Selection Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            1. Select Test Scenario
          </span>
          <span className="text-xs text-slate-400 font-medium">Pre-loaded customer RFPs</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {scenarios.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-600 shadow-xs ring-1 ring-indigo-600/30'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold tracking-tight ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-900'}`}>
                    {sc.title}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    sc.scenario_type === 'standard_approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : sc.scenario_type === 'dependency_autofix'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {sc.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {sc.expected_behavior}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer RFP Text Editor Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            2. Customer RFP Email Prompt
          </label>
          <span className="text-xs text-slate-400 font-medium">Editable natural language</span>
        </div>

        <textarea
          rows={7}
          value={rfpText}
          onChange={(e) => setRfpText(e.target.value)}
          placeholder="Paste or edit the customer RFP email..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder-slate-400 font-sans focus:outline-none focus:border-indigo-600 focus:bg-white leading-relaxed resize-none transition-colors"
        />

        <div className="mt-4 flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Powered by LangGraph 4-Agent Pipeline
          </span>

          <button
            onClick={onRunCPQ}
            disabled={isRunning || !rfpText.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing & Running Agents...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                Run Autonomous Deal Desk
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
