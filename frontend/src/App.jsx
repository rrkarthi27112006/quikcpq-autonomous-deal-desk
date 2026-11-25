import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PipelineSidebar from './components/PipelineSidebar';
import NewQuoteView from './components/NewQuoteView';
import CatalogAdminView from './components/CatalogAdminView';
import AgentTimeline from './components/AgentTimeline';
import KPICards from './components/KPICards';
import HITLEscalationBanner from './components/HITLEscalationBanner';
import QuoteTable from './components/QuoteTable';
import IntegrationsModal from './components/IntegrationsModal';
import {
  Mail,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Send,
  Inbox,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8010';

export default function App() {
  const [activeView, setActiveView] = useState('inbox'); // 'inbox' | 'new_quote' | 'approvals' | 'catalog'
  const [systemOnline, setSystemOnline] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  // Data state
  const [scenarios, setScenarios] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [quotesList, setQuotesList] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_quotes: 0,
    total_arr: 0,
    avg_margin: 0,
    escalated_count: 0,
    approved_count: 0,
    sent_count: 0,
  });
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [currentQuote, setCurrentQuote] = useState(null);

  // Filters & UI state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [deliveryFeedback, setDeliveryFeedback] = useState('');
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  const fetchQuotesPipeline = useCallback(async (filterOverride = null, autoSelectId = null) => {
    const activeFilter = filterOverride || statusFilter;
    const url =
      activeFilter && activeFilter !== 'ALL'
        ? `${API_BASE}/api/quotes?status=${activeFilter}`
        : `${API_BASE}/api/quotes`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setQuotesList(data.quotes || []);
      if (data.analytics) setAnalytics(data.analytics);

      const targetId = autoSelectId || selectedQuoteId;
      if (targetId) {
        await loadQuoteDetail(targetId);
      } else if (data.quotes && data.quotes.length > 0) {
        await loadQuoteDetail(data.quotes[0].quote_id);
      } else {
        setCurrentQuote(null);
        setSelectedQuoteId(null);
      }
    } catch (err) {
      console.error('Failed to fetch quotes pipeline:', err);
    }
  }, [statusFilter, selectedQuoteId]);

  const loadQuoteDetail = async (quoteId) => {
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}`);
      if (!res.ok) return;
      const detail = await res.json();
      setSelectedQuoteId(quoteId);
      setCurrentQuote(detail);
      setDeliveryFeedback('');
    } catch (err) {
      console.error('Failed to load quote detail:', err);
    }
  };

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/scenarios`).then((r) => r.json()),
      fetch(`${API_BASE}/api/config-status`).then((r) => r.json()),
      fetch(`${API_BASE}/api/quotes`).then((r) => r.json()),
    ])
      .then(([scData, cfgData, qData]) => {
        setScenarios(scData.scenarios || []);
        setCatalog(scData.catalog || null);
        setConfigStatus(cfgData);
        setQuotesList(qData.quotes || []);
        if (qData.analytics) setAnalytics(qData.analytics);
        setSystemOnline(true);

        if (qData.quotes && qData.quotes.length > 0) {
          loadQuoteDetail(qData.quotes[0].quote_id);
        }
      })
      .catch((err) => {
        console.warn('Backend connecting or offline:', err);
        setSystemOnline(false);
      });
  }, []);

  // Re-fetch when filter or view changes
  useEffect(() => {
    if (!systemOnline) return;
    if (activeView === 'approvals') {
      setStatusFilter('ESCALATED');
      fetchQuotesPipeline('ESCALATED');
    } else if (activeView === 'inbox') {
      fetchQuotesPipeline(statusFilter);
    }
  }, [activeView, statusFilter, systemOnline]);

  // Sync IMAP Inbox
  const handleSyncInbox = async () => {
    setIsSyncing(true);
    setSyncNotice('');
    try {
      const res = await fetch(`${API_BASE}/api/emails/sync`, { method: 'POST' });
      const data = await res.json();
      setSyncNotice(data.message || 'Inbox sync completed.');
      if (data.quotes && data.quotes.length > 0) {
        await fetchQuotesPipeline('ALL', data.quotes[0].quote_id);
      }
      if (!data.configured) {
        setIsIntegrationsOpen(true);
      }
    } catch (err) {
      setSyncNotice('Error syncing inbox. Check backend connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit from Deal Builder
  const handleSubmitDealBuilder = async (payload) => {
    setIsRunning(true);
    try {
      const useMock = !(configStatus?.gemini_configured);
      const res = await fetch(`${API_BASE}/api/run-cpq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          use_mock_mode: useMock,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const quote = await res.json();
      setStatusFilter('ALL');
      setActiveView('inbox');
      await fetchQuotesPipeline('ALL', quote.quote_id);
    } catch (err) {
      alert(`Failed to create quote: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit from Inbound Email Webhook Simulator
  const handleSubmitInboundEmail = async (payload) => {
    setIsRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/inbound-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.quote) {
        setStatusFilter('ALL');
        setActiveView('inbox');
        await fetchQuotesPipeline('ALL', data.quote.quote_id);
      }
    } catch (err) {
      alert(`Failed to process inbound email: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // HITL: Accept Counter-Offer
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
          manager_notes: 'Counter-offer accepted (15% discount, 24-month commitment).',
        }),
      });
      if (!res.ok) throw new Error(`Approval failed ${res.status}`);
      const updated = await res.json();
      setCurrentQuote(updated);
      await fetchQuotesPipeline(statusFilter, updated.quote_id);
    } catch (err) {
      alert('Failed to accept counter-offer.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // HITL: Manager Override
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
          manager_notes: managerNotes || 'Executive override authorized by Deal Desk Manager.',
        }),
      });
      if (!res.ok) throw new Error(`Override failed ${res.status}`);
      const updated = await res.json();
      setCurrentQuote(updated);
      await fetchQuotesPipeline(statusFilter, updated.quote_id);
    } catch (err) {
      alert('Failed to apply manager override.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Save edited email draft
  const handleSaveDraft = async (quoteId, emailDraft) => {
    const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/update-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_email_draft: emailDraft }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCurrentQuote(updated);
    }
  };

  // Send Quote Email + PDF to Client
  const handleSendEmail = async (quoteId, toEmail, emailBody) => {
    setIsSendingEmail(true);
    setDeliveryFeedback('');
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: toEmail,
          email_body: emailBody,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Send failed ${res.status}`);
      }
      const data = await res.json();
      setCurrentQuote(data.quote);
      setDeliveryFeedback(data.delivery?.message || 'Quote sent!');
      await fetchQuotesPipeline(statusFilter, quoteId);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!currentQuote) return;
    setIsDownloadingPDF(true);
    try {
      const res = await fetch(`${API_BASE}/api/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_state: currentQuote }),
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
      alert('Failed to generate PDF quote.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Save Catalog Admin Changes
  const handleSaveCatalog = async (updatedCatalog) => {
    setIsSavingCatalog(true);
    try {
      const res = await fetch(`${API_BASE}/api/catalog`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCatalog),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setCatalog(data.catalog);
      return true;
    } catch (err) {
      alert('Failed to save catalog changes.');
      return false;
    } finally {
      setIsSavingCatalog(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        escalatedCount={analytics.escalated_count}
        totalQuotes={analytics.total_quotes}
        configStatus={configStatus}
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
        systemOnline={systemOnline}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Pipeline Analytics Strip (shown on Inbox & Approvals) */}
        {(activeView === 'inbox' || activeView === 'approvals') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Pipeline ARR</span>
                <span className="text-lg font-bold text-slate-900">
                  ${(analytics.total_arr || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><TrendingUp className="w-4 h-4" /></div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Avg Gross Margin</span>
                <span className="text-lg font-bold text-emerald-600">{analytics.avg_margin || 0}%</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><ShieldCheck className="w-4 h-4" /></div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Pending Review</span>
                <span className="text-lg font-bold text-amber-600">{analytics.escalated_count || 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><ShieldAlert className="w-4 h-4" /></div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Sent to Clients</span>
                <span className="text-lg font-bold text-slate-900">{analytics.sent_count || 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><Send className="w-4 h-4" /></div>
            </div>
          </div>
        )}

        {/* View 1 & 3: Inbox & Pipeline / Approvals Queue */}
        {(activeView === 'inbox' || activeView === 'approvals') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <PipelineSidebar
                quotes={quotesList}
                selectedQuoteId={selectedQuoteId}
                onSelectQuote={loadQuoteDetail}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSyncInbox={handleSyncInbox}
                isSyncing={isSyncing}
                syncNotice={syncNotice}
              />
            </div>

            <div className="lg:col-span-8 space-y-5">
              {currentQuote ? (
                <>
                  {/* Selected Deal Context Banner */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900">
                            {currentQuote.customer_company || currentQuote.customer_name}
                          </h2>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {currentQuote.quote_id}
                          </span>
                          {(currentQuote.source === 'email_inbound' || currentQuote.source === 'webhook') && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                              <Mail className="w-3 h-3" /> Inbound Client Email
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Contact: <strong className="text-slate-700">{currentQuote.customer_name}</strong> ({currentQuote.customer_email})
                          {currentQuote.email_subject ? ` • Subject: "${currentQuote.email_subject}"` : ''}
                        </p>
                      </div>
                    </div>

                    {currentQuote.rfp_text && (
                      <details className="mt-3 pt-3 border-t border-slate-100 text-xs">
                        <summary className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-800 select-none">
                          View Original Client Request / Email
                        </summary>
                        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {currentQuote.rfp_text}
                        </div>
                      </details>
                    )}
                  </div>

                  <KPICards quote={currentQuote} />

                  {currentQuote.guardrail_status === 'ESCALATED' && (
                    <HITLEscalationBanner
                      quote={currentQuote}
                      onApproveOverride={handleApproveOverride}
                      onAcceptCounterOffer={handleAcceptCounterOffer}
                      isProcessing={isProcessingApproval}
                    />
                  )}

                  <AgentTimeline
                    executionTrace={currentQuote.execution_trace || []}
                    isRunning={isRunning}
                  />

                  <QuoteTable
                    quote={currentQuote}
                    onDownloadPDF={handleDownloadPDF}
                    isDownloadingPDF={isDownloadingPDF}
                    onSaveDraft={handleSaveDraft}
                    onSendEmail={handleSendEmail}
                    isSendingEmail={isSendingEmail}
                    deliveryFeedback={deliveryFeedback}
                  />
                </>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Deal Selected</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                    {activeView === 'approvals'
                      ? 'No deals are currently escalated for manager approval.'
                      : 'Select a quote from the queue, sync your connected email inbox, or create a new quote.'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveView('new_quote')}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Create New Quote
                    </button>
                    <button
                      onClick={handleSyncInbox}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Sync Inbox
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 2: New Quote Builder & Inbound Email Intake */}
        {activeView === 'new_quote' && (
          <NewQuoteView
            scenarios={scenarios}
            catalog={catalog}
            onSubmitDealBuilder={handleSubmitDealBuilder}
            onSubmitInboundEmail={handleSubmitInboundEmail}
            isRunning={isRunning}
          />
        )}

        {/* View 4: Catalog & Rules Admin */}
        {activeView === 'catalog' && (
          <CatalogAdminView
            catalog={catalog}
            onSaveCatalog={handleSaveCatalog}
            isSaving={isSavingCatalog}
          />
        )}
      </main>

      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        configStatus={configStatus}
      />
    </div>
  );
}
