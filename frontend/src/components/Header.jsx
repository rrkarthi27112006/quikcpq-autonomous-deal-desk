import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Key, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck
} from 'lucide-react';

export default function Header({ 
  useMockMode, 
  setUseMockMode, 
  geminiKey, 
  setGeminiKey, 
  onOpenCatalog,
  systemOnline 
}) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(geminiKey || '');

  const handleSaveKey = () => {
    setGeminiKey(tempKey.trim());
    localStorage.setItem('quikcpq_gemini_key', tempKey.trim());
    setShowKeyModal(false);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Quik<span className="text-indigo-400">CPQ</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                  Deal Desk Agent
                </span>
              </h1>
              {systemOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LangGraph Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Connecting...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Autonomous B2B SaaS Quoting &bull; LangGraph Multi-Agent Engine &bull; Deterministic Guardrails
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Catalog Guide Button */}
          <button 
            onClick={onOpenCatalog}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Catalog & Guardrails
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setUseMockMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                useMockMode 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Demo Simulator
            </button>
            <button
              onClick={() => {
                setUseMockMode(false);
                if (!geminiKey) setShowKeyModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                !useMockMode 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Live Gemini Agent
            </button>
          </div>

          {/* API Key Config Button (Visible in Live Mode) */}
          {!useMockMode && (
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                geminiKey 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              {geminiKey ? 'API Key Set' : 'Enter API Key'}
            </button>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Google Gemini API Key</h3>
                <p className="text-xs text-slate-400">Used by LangGraph nodes for live multi-agent reasoning</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              In Live Agent mode, QuikCPQ uses Google's <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400">gemini-2.5-flash</code> via the official <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-400">google-genai</code> SDK for RFP extraction and client proposal synthesis. (Financial calculations remain 100% deterministic Python tools).
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Tip: If no key is set or you prefer offline testing, switch back to <strong>Demo Simulator</strong> anytime.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Save & Apply Key
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
