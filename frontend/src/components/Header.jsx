import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Key, 
  BookOpen, 
  CheckCircle2,
  ChevronRight
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
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Quik<span className="text-indigo-600">CPQ</span>
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Deal Desk Agent
              </span>
              {systemOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Agent Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Connecting...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Autonomous B2B SaaS Quoting &bull; LangGraph Engine &bull; Financial Guardrails
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Catalog & Rules Button */}
          <button 
            onClick={onOpenCatalog}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            Pricing & Guardrails Matrix
          </button>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs">
            <button
              onClick={() => setUseMockMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                useMockMode 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              Demo Simulator
            </button>
            <button
              onClick={() => {
                setUseMockMode(false);
                if (!geminiKey) setShowKeyModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                !useMockMode 
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              Live Gemini Agent
            </button>
          </div>

          {/* API Key Modal Button */}
          {!useMockMode && (
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                geminiKey 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {geminiKey ? 'API Key Set' : 'Enter API Key'}
            </button>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Gemini API Configuration</h3>
                <p className="text-xs text-slate-500">Live multi-agent reasoning with Gemini 2.5 Flash</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              When enabled, customer emails are parsed and final proposal messages are synthesized by Google's Gemini models via <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded text-[11px]">google-genai</code>. All mathematical calculations and margin guardrails remain 100% deterministic Python tools.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Tip: You can use <strong>Demo Simulator</strong> mode anytime with zero setup.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
