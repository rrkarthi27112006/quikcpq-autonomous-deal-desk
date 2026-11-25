import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function AgentTimeline({ executionTrace }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (!executionTrace || executionTrace.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-400">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="border-l border-gray-200 ml-1.5 pl-5 space-y-5">
        {executionTrace.map((trace, idx) => {
          const isOpen = openIdx === idx;
          const dotColor =
            trace.status === 'ESCALATED'
              ? 'bg-amber-500'
              : trace.status === 'AUTO_CORRECTED'
              ? 'bg-indigo-600'
              : 'bg-emerald-500';

          return (
            <div key={trace.step_number || idx} className="relative">
              <span
                className={`w-2 h-2 rounded-full ${dotColor} absolute -left-[24.5px] top-1.5 ring-4 ring-white`}
              />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">
                      {trace.agent_name}
                    </span>
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      {trace.latency_ms}ms
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {trace.reasoning}
                  </p>
                </div>

                {trace.tool_calls && trace.tool_calls.length > 0 && (
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 flex-shrink-0 cursor-pointer"
                  >
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Payload
                  </button>
                )}
              </div>

              {isOpen && trace.tool_calls && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-2.5 font-mono text-[11px] text-gray-700 space-y-2">
                  {trace.tool_calls.map((t, i) => (
                    <div key={i}>
                      <div className="font-semibold text-gray-900">{t.tool_name}()</div>
                      <pre className="text-[10px] text-gray-600 overflow-x-auto mt-1">
                        {JSON.stringify({ input: t.input, output: t.output }, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
