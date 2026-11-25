import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import PipelineSidebar from './components/PipelineSidebar';
import NewQuoteView from './components/NewQuoteView';
import CatalogAdminView from './components/CatalogAdminView';
import KPICards from './components/KPICards';
import HITLEscalationBanner from './components/HITLEscalationBanner';
import QuoteTable from './components/QuoteTable';
import IntegrationsModal from './components/IntegrationsModal';
import ApprovalsView from './components/ApprovalsView';
import { Plus, Mail } from 'lucide-react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (['127.0.0.1', 'localhost'].includes(window.location.hostname) && window.location.port === '5180'
    ? 'http://127.0.0.1:8010'
    : '');

export default function App() {
  const [activeView, setActiveView] = useState('inbox'); // 'inbox' | 'new_quote' | 'approvals' | 'catalog'
  const [systemOnline, setSystemOnline] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

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
  const [escalatedDetails, setEscalatedDetails] = useState([]);

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

  const fetchEscalatedDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/quotes?status=ESCALATED`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.analytics) setAnalytics(data.analytics);
      const list = data.quotes || [];
      const details = await Promise.all(
        list.map((item) =>
          fetch(`${API_BASE}/api/quotes/${item.quote_id}`).then((r) => (r.ok ? r.json() : item))
        )
      );
      setEscalatedDetails(details);
    } catch (err) {
      console.error('Failed to fetch escalated quotes:', err);
    }
  }, []);

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

  useEffect(() => {
    if (!systemOnline) return;
    if (activeView === 'approvals') {
      fetchEscalatedDetails();
    } else if (activeView === 'inbox') {
      fetchQuotesPipeline(statusFilter);
    }
  }, [activeView, statusFilter, systemOnline]);

  const handleSyncInbox = async () => {
    setIsSyncing(true);
    setSyncNotice('');
    try {
      const res = await fetch(`${API_BASE}/api/emails/sync`, { method: 'POST' });
      const data = await res.json();
      setSyncNotice(data.message || 'Inbox synced.');
      if (data.quotes && data.quotes.length > 0) {
        await fetchQuotesPipeline('ALL', data.quotes[0].quote_id);
      }
      if (!data.configured) {
        setIsIntegrationsOpen(true);
      }
    } catch (err) {
      setSyncNotice('Error syncing inbox.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmitDealBuilder = async (payload) => {
    setIsRunning(true);
    try {
      const useMock = !(configStatus?.gemini_configured);
      const res = await fetch(`${API_BASE}/api/run-cpq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, use_mock_mode: useMock }),
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
      alert(`Failed to process email: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAcceptCounterOffer = async (targetQuoteId = null) => {
    const qid = typeof targetQuoteId === 'string' ? targetQuoteId : currentQuote?.quote_id;
    if (!qid) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch(`${API_BASE}/api/approve-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: qid,
          action: 'accept_counter_offer',
          manager_notes: 'Counter-offer accepted (15% discount, 24-month commitment).',
        }),
      });
      if (!res.ok) throw new Error(`Approval failed ${res.status}`);
      const updated = await res.json();
      if (currentQuote?.quote_id === qid) setCurrentQuote(updated);
      await fetchQuotesPipeline(statusFilter, updated.quote_id);
      if (activeView === 'approvals') await fetchEscalatedDetails();
    } catch (err) {
      alert('Failed to accept counter-offer.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleApproveOverride = async (arg1, arg2) => {
    const qid = typeof arg2 === 'string' ? arg1 : currentQuote?.quote_id;
    const managerNotes = typeof arg2 === 'string' ? arg2 : arg1;
    if (!qid) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch(`${API_BASE}/api/approve-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: qid,
          action: 'manager_override',
          manager_notes: managerNotes || 'Executive override authorized.',
        }),
      });
      if (!res.ok) throw new Error(`Override failed ${res.status}`);
      const updated = await res.json();
      if (currentQuote?.quote_id === qid) setCurrentQuote(updated);
      await fetchQuotesPipeline(statusFilter, updated.quote_id);
      if (activeView === 'approvals') await fetchEscalatedDetails();
    } catch (err) {
      alert('Failed to apply override.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

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

  const handleSendEmail = async (quoteId, toEmail, emailBody) => {
    setIsSendingEmail(true);
    setDeliveryFeedback('');
    try {
      const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: toEmail, email_body: emailBody }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Send failed ${res.status}`);
      }
      const data = await res.json();
      setCurrentQuote(data.quote);
      setDeliveryFeedback(data.delivery?.message || 'Quote sent.');
      await fetchQuotesPipeline(statusFilter, quoteId);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

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

  const viewTitles = {
    inbox: 'Quotes & Inbox',
    approvals: 'Approvals',
    new_quote: 'New Quote',
    catalog: 'Product Catalog',
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col md:flex-row font-sans">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        escalatedCount={analytics.escalated_count}
        totalQuotes={analytics.total_quotes}
        configStatus={configStatus}
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
        systemOnline={systemOnline}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Top Bar */}
        <header className="h-13 bg-white border-b border-gray-200 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-gray-900">{viewTitles[activeView]}</h1>
            {activeView === 'inbox' && (
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 border-l border-gray-200 pl-4 tabular-nums">
                <span>
                  Pipeline <strong className="text-gray-900 font-medium">${(analytics.total_arr || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>/yr
                </span>
                <span>
                  Avg margin <strong className="text-gray-900 font-medium">{analytics.avg_margin || 0}%</strong>
                </span>
                <span>
                  Sent <strong className="text-gray-900 font-medium">{analytics.sent_count || 0}</strong>
                </span>
              </div>
            )}
          </div>

          {activeView !== 'new_quote' && (
            <button
              onClick={() => setActiveView('new_quote')}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New quote
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-5 sm:p-6">
          {activeView === 'inbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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

              <div className="lg:col-span-8 space-y-4">
                {currentQuote ? (
                  <>
                    {/* Clean Deal Header */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold text-gray-900">
                              {currentQuote.customer_company || currentQuote.customer_name}
                            </h2>
                            <span className="text-xs font-mono text-gray-400">
                              {currentQuote.quote_id}
                            </span>
                            {(currentQuote.source === 'email_inbound' || currentQuote.source === 'webhook') && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                <Mail className="w-3 h-3 text-gray-400" /> Email
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {currentQuote.customer_name} &lt;{currentQuote.customer_email}&gt;
                            {currentQuote.email_subject ? ` — ${currentQuote.email_subject}` : ''}
                          </p>
                        </div>
                      </div>

                      {currentQuote.rfp_text && (
                        <details className="mt-3 pt-3 border-t border-gray-100 text-xs">
                          <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-900 select-none">
                            Original client message
                          </summary>
                          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700 whitespace-pre-wrap leading-relaxed">
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
                  <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <div className="text-sm font-medium text-gray-900">Select a quote</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose a request on the left, sync your inbox, or create a new quote.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'approvals' && (
            <ApprovalsView
              escalatedQuotes={escalatedDetails}
              onAcceptCounterOffer={handleAcceptCounterOffer}
              onApproveOverride={handleApproveOverride}
              onInspectQuote={(qid) => {
                setStatusFilter('ALL');
                setSelectedQuoteId(qid);
                setActiveView('inbox');
                loadQuoteDetail(qid);
              }}
              isProcessing={isProcessingApproval}
              onGoToInbox={() => setActiveView('inbox')}
            />
          )}

          {activeView === 'new_quote' && (
            <NewQuoteView
              scenarios={scenarios}
              catalog={catalog}
              onSubmitDealBuilder={handleSubmitDealBuilder}
              onSubmitInboundEmail={handleSubmitInboundEmail}
              isRunning={isRunning}
            />
          )}

          {activeView === 'catalog' && (
            <CatalogAdminView
              catalog={catalog}
              onSaveCatalog={handleSaveCatalog}
              isSaving={isSavingCatalog}
            />
          )}
        </main>
      </div>

      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        configStatus={configStatus}
      />
    </div>
  );
}
