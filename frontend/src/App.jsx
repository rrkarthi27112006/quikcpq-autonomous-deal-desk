import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScenarioSelector from './components/ScenarioSelector';
import AgentTimeline from './components/AgentTimeline';
import KPICards from './components/KPICards';
import HITLEscalationBanner from './components/HITLEscalationBanner';
import QuoteTable from './components/QuoteTable';
import CatalogModal from './components/CatalogModal';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Clock, Check } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8010';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [rfpText, setRfpText] = useState('');
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [systemOnline, setSystemOnline] = useState(false);
  const [useMockMode, setUseMockMode] = useState(true);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('quikcpq_gemini_key') || '');

  // 1. Fetch Scenarios & Catalog on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/scenarios`)
      .then(res => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then(data => {
        setScenarios(data.scenarios || []);
        setCatalog(data.catalog || null);
        setSystemOnline(true);
        // Pre-select Scenario 1
        if (data.scenarios && data.scenarios.length > 0) {
          const first = data.scenarios[0];
          setSelectedScenarioId(first.id);
          setRfpText(first.rfp_text);
        }
      })
      .catch(err => {
        console.warn('Fallback to proxy /api/scenarios', err);
        fetch('/api/scenarios')
          .then(res => res.json())
          .then(data => {
            setScenarios(data.scenarios || []);
            setCatalog(data.catalog || null);
            setSystemOnline(true);
            if (data.scenarios && data.scenarios.length > 0) {
              const first = data.scenarios[0];
              setSelectedScenarioId(first.id);
              setRfpText(first.rfp_text);
            }
          })
          .catch(() => setSystemOnline(false));
      });
  }, []);

  // 2. Select Scenario
  const handleSelectScenario = (sc) => {
    setSelectedScenarioId(sc.id);
    setRfpText(sc.rfp_text);
  };

  // 3. Execute LangGraph Deal Desk Pipeline
  const handleRunCPQ = async () => {
    if (!rfpText.trim()) return;
    setIsRunning(true);
    try {
      let res;
      try {
        res = await fetch(`${API_BASE}/api/run-cpq`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rfp_text: rfpText,
            use_mock_mode: useMockMode,
            gemini_api_key: geminiKey || null,
            scenario_id: selectedScenarioId || null
          })
        });
      } catch (networkErr) {
        // Fallback to relative proxy
        res = await fetch('/api/run-cpq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rfp_text: rfpText,
            use_mock_mode: useMockMode,
            gemini_api_key: geminiKey || null,
            scenario_id: selectedScenarioId || null
          })
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned status ${res.status}`);
      }
      const data = await res.json();
      setCurrentQuote(data);
    } catch (err) {
      console.error('Failed to run CPQ pipeline:', err);
      alert(`Deal Desk Execution Note: ${err.message}\nPlease ensure the backend server is running on http://127.0.0.1:8010.`);
    } finally {
      setIsRunning(false);
    }
  };

  // 4. HITL Approval: Accept Counter-Offer
  const handleAcceptCounterOffer = async () => {
    if (!currentQuote) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch(`${API_BASE}/api/approve-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: currentQuote.quote_id,
          action: 'accept_counter_offer',
          manager_notes: 'Manager approved 24-month term with 15% compliant discount.'
        })
      });
      if (!res.ok) throw new Error(`Approval failed ${res.status}`);
      const updated = await res.json();
      setCurrentQuote(updated);
    } catch (err) {
      console.error('Counter-offer approval failed:', err);
      alert('Failed to accept counter-offer.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // 5. HITL Approval: Executive Manager Override
  const handleApproveOverride = async (managerNotes) => {
    if (!currentQuote) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch(`${API_BASE}/api/approve-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: currentQuote.quote_id,
          action: 'manager_override',
          manager_notes: managerNotes || 'Executive override authorized by Deal Desk Director.'
        })
      });
      if (!res.ok) throw new Error(`Override failed ${res.status}`);
      const updated = await res.json();
      setCurrentQuote(updated);
    } catch (err) {
      console.error('Override approval failed:', err);
      alert('Failed to apply manager override.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // 6. Download Official PDF Quote
  const handleDownloadPDF = async () => {
    if (!currentQuote) return;
    setIsDownloadingPDF(true);
    try {
      const res = await fetch(`${API_BASE}/api/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_state: currentQuote
        })
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QuikCPQ_Quote_${currentQuote.quote_id || 'Official'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download PDF failed:', err);
      alert('Failed to generate PDF quote.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        useMockMode={useMockMode}
        setUseMockMode={setUseMockMode}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        systemOnline={systemOnline}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Panel: RFP Intake & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <ScenarioSelector
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={handleSelectScenario}
              rfpText={rfpText}
              setRfpText={setRfpText}
              onRunCPQ={handleRunCPQ}
              isRunning={isRunning}
            />

            {/* Architecture Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-xs text-slate-600">
              <h4 className="font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Autonomous Guardrail Principles
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></span>
                  <span><strong className="text-slate-800">Deterministic Math:</strong> Financial pricing and gross margin calculations execute via strict Python tools—zero hallucinated arithmetic.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0"></span>
                  <span><strong className="text-slate-800">Dependency Validation:</strong> Automatically promotes base tiers to preserve SSO and architectural prerequisites.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0"></span>
                  <span><strong className="text-slate-800">HITL Escalation:</strong> Blocks discount &gt; 15% or gross margin &lt; 25% with automated multi-year counter-offers.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Agent Timeline & Quote Outputs (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* KPI Cards */}
            {currentQuote && <KPICards quote={currentQuote} />}

            {/* HITL Escalation Banner (If Escalated) */}
            {currentQuote && currentQuote.guardrail_status === 'ESCALATED' && (
              <HITLEscalationBanner
                quote={currentQuote}
                onApproveOverride={handleApproveOverride}
                onAcceptCounterOffer={handleAcceptCounterOffer}
                isProcessing={isProcessingApproval}
              />
            )}

            {/* LangGraph Multi-Agent Execution Timeline */}
            <AgentTimeline
              executionTrace={currentQuote ? currentQuote.execution_trace : []}
              isRunning={isRunning}
            />

            {/* Quote Table & Client Email Tabs */}
            {currentQuote && (
              <QuoteTable
                quote={currentQuote}
                onDownloadPDF={handleDownloadPDF}
                isDownloadingPDF={isDownloadingPDF}
              />
            )}
          </div>
        </div>
      </main>

      {/* Catalog & Guardrails Modal */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        catalog={catalog}
      />
    </div>
  );
}
