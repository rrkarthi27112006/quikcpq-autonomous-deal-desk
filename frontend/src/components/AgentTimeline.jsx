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
  const [expandedSteps, setExpandedSteps] = useState({ 1: false, 2: false, 3: false, 4: false });

  const toggleStep = (stepNumber) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const getAgentIcon = (agentName) => {
    if (agentName.includes("Intake")) return <Sparkles className="w-4 h-4 text-indigo-600" />;
    if (agentName.includes("Pricing")) return <Calculator className="w-4 h-4 text-cyan-600" />;
    if (agentName.includes("Guardrail")) return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-emerald-600" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'AUTO_CORRECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Bundle Auto-Corrected
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Policy Breach (HITL)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auto-Approved
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {status}
          </span>
        );
    }
  };

  if (!executionTrace || executionTrace.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Agent Reasoning Engine Ready</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
          Select an RFP scenario on the left and click "Run Autonomous Deal Desk" to observe real-time agent execution traces and deterministic tool calls.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span>Multi-Agent LangGraph Reasoning Pipeline</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
              {executionTrace.length} Steps Executed
            </span>
          </h3>
        </div>
        <button
          onClick={() => {
            const allExpanded = Object.values(expandedSteps).every(Boolean);
            const newState = {};
            executionTrace.forEach(t => { newState[t.step_number] = !allExpanded; });
            setExpandedSteps(newState);
          }}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
        >
          {Object.values(expandedSteps).every(Boolean) ? 'Collapse Details' : 'Expand Details'}
        </button>
      </div>

      <div className="space-y-3">
        {executionTrace.map((trace) => {
          const isExpanded = !!expandedSteps[trace.step_number];

          return (
            <div 
              key={trace.step_number}
              className="bg-slate-50/80 border border-slate-200/80 rounded-xl overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Header Bar */}
              <div 
                onClick={() => toggleStep(trace.step_number)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {getAgentIcon(trace.agent_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {trace.agent_name}
                      </span>
                      {getStatusBadge(trace.status)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {trace.reasoning}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {trace.latency_ms}ms
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-200/70 bg-white text-xs space-y-3">
                  {/* Tool Calls */}
                  {trace.tool_calls && trace.tool_calls.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                        <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                        Deterministic Python Tools:
                      </div>
                      {trace.tool_calls.map((tool, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 font-mono text-[11px]">
                          <div className="text-indigo-600 font-semibold mb-1">
                            {tool.tool_name}()
                          </div>
                          <div className="text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400 font-sans font-semibold">Inputs: </span>
                              <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap mt-0.5 bg-white p-1.5 rounded border border-slate-200">
                                {JSON.stringify(tool.input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-400 font-sans font-semibold">Outputs: </span>
                              <pre className="text-emerald-700 overflow-x-auto whitespace-pre-wrap mt-0.5 bg-white p-1.5 rounded border border-slate-200">
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
                      <span className="text-[10px] text-slate-500 font-semibold">Policy Validations:</span>
                      {trace.rule_checks.map((rule, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium"
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
