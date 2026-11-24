import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScenarioSelector from './components/ScenarioSelector';
import AgentTimeline from './components/AgentTimeline';
import KPICards from './components/KPICards';
import HITLEscalationBanner from './components/HITLEscalationBanner';
import QuoteTable from './components/QuoteTable';
import CatalogModal from './components/CatalogModal';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

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
    fetch('/api/scenarios')
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
        console.warn('Fallback: Backend connecting or offline', err);
        setSystemOnline(false);
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
      const res = await fetch('/api/run-cpq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfp_text: rfpText,
          use_mock_mode: useMockMode,
          gemini_api_key: geminiKey || null,
          scenario_id: selectedScenarioId || null
        })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setCurrentQuote(data);
    } catch (err) {
      console.error('Failed to run CPQ pipeline:', err);
      alert('Error running CPQ Agent. Please check backend connection.');
    } finally {
      setIsRunning(false);
    }
  };

  // 4. HITL Approval: Accept Counter-Offer
  const handleAcceptCounterOffer = async () => {
    if (!currentQuote) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch('/api/approve-deal', {
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
      const res = await fetch('/api/approve-deal', {
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
      const res = await fetch('/api/export-pdf', {
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        useMockMode={useMockMode}
        setUseMockMode={setUseMockMode}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        systemOnline={systemOnline}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: RFP Intake & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <ScenarioSelector
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={handleSelectScenario}
              rfpText={rfpText}
              setRfpText={setRfpText}
              onRunCPQ={handleRunCPQ}
              isRunning={isRunning}
            />

            {/* Architecture Overview Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Autonomous Guardrail Principles
              </h4>
              <ul className="space-y-1.5 text-[11px] leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">&bull;</span>
                  <span><strong>Zero Hallucinated Math:</strong> Pricing and margins run on deterministic Python tools, never LLM arithmetic.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">&bull;</span>
                  <span><strong>Dependency Correction:</strong> Automatic base-tier promotion when enterprise features are requested.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">&bull;</span>
                  <span><strong>HITL Escalation:</strong> Hard stops on discount &gt; 15% or gross margin &lt; 25% with automated counter-offers.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Agent Timeline & Quote Outputs (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
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
