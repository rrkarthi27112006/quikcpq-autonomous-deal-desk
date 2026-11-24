import React, { useState } from 'react';
import { 
  Sparkles, 
  Calculator, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Code2
} from 'lucide-react';

export default function AgentTimeline({ executionTrace, isRunning }) {
  const [expandedSteps, setExpandedSteps] = useState({ 1: true, 2: true, 3: true, 4: true });

  const toggleStep = (stepNumber) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const getAgentIcon = (agentName) => {
    if (agentName.includes("Intake")) return <Sparkles className="w-4 h-4 text-indigo-400" />;
    if (agentName.includes("Pricing")) return <Calculator className="w-4 h-4 text-cyan-400" />;
    if (agentName.includes("Guardrail")) return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-emerald-400" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3" /> SUCCESS
          </span>
        );
      case 'AUTO_CORRECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium animate-pulse">
            <Sparkles className="w-3 h-3 text-indigo-400" /> BUNDLE AUTO-FIX
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
            <AlertTriangle className="w-3 h-3" /> HITL ESCALATED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <ShieldCheck className="w-3 h-3" /> AUTO-APPROVED
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  if (!executionTrace || executionTrace.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 text-indigo-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Autonomous Reasoning Pipeline Ready</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Select an RFP scenario on the left and click "Run Autonomous Deal Desk" to observe real-time agent execution traces and deterministic tool calls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>Multi-Agent LangGraph Execution Trace</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
            {executionTrace.length} Steps
          </span>
        </h3>
        <button
          onClick={() => {
            const allExpanded = Object.values(expandedSteps).every(Boolean);
            const newState = {};
            executionTrace.forEach(t => { newState[t.step_number] = !allExpanded; });
            setExpandedSteps(newState);
          }}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
        >
          {Object.values(expandedSteps).every(Boolean) ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="space-y-2.5">
        {executionTrace.map((trace) => {
          const isExpanded = !!expandedSteps[trace.step_number];

          return (
            <div 
              key={trace.step_number}
              className="bg-slate-900/90 border border-slate-800/90 rounded-xl overflow-hidden transition-all shadow-sm hover:border-slate-700/80"
            >
              {/* Header Bar */}
              <div 
                onClick={() => toggleStep(trace.step_number)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                    {getAgentIcon(trace.agent_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">
                        {trace.agent_name}
                      </span>
                      {getStatusBadge(trace.status)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {trace.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {trace.latency_ms}ms
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/60 bg-slate-950/40 text-xs space-y-3">
                  {/* Reasoning Callout */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 text-xs leading-relaxed">
                    <span className="font-semibold text-slate-200">Agent Reasoning: </span>
                    {trace.reasoning}
                  </div>

                  {/* Tool Calls */}
                  {trace.tool_calls && trace.tool_calls.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Code2 className="w-3 h-3 text-cyan-400" />
                        Deterministic Python Tools Executed:
                      </div>
                      {trace.tool_calls.map((tool, idx) => (
                        <div key={idx} className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/80 font-mono text-[11px]">
                          <div className="text-cyan-400 font-semibold mb-1">
                            tool: {tool.tool_name}()
                          </div>
                          <div className="text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-500">Inputs: </span>
                              <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap mt-0.5">
                                {JSON.stringify(tool.input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-500">Output: </span>
                              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap mt-0.5">
                                {JSON.stringify(tool.output, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rule Checks Evaluated */}
                  {trace.rule_checks && trace.rule_checks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-medium">Compliance Rules Evaluated:</span>
                      {trace.rule_checks.map((rule, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/50"
                        >
                          &bull; {rule}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
