import React, { useState } from 'react';
import { Sparkles, Mail, Sliders, FileText, ChevronDown } from 'lucide-react';

export default function NewQuoteView({
  scenarios,
  catalog,
  onSubmitDealBuilder,
  onSubmitInboundEmail,
  isRunning,
}) {
  const [mode, setMode] = useState('builder'); // 'builder' | 'email'

  // Structured Deal Builder state
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [seats, setSeats] = useState(50);
  const [baseTier, setBaseTier] = useState('pro');
  const [addOns, setAddOns] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);

  // Inbound Email Intake state
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [subject, setSubject] = useState('Enterprise License Quote Request');
  const [bodyText, setBodyText] = useState('');

  const toggleAddon = (id) => {
    setAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLoadSample = (e) => {
    const id = e.target.value;
    if (!id) return;
    const sc = scenarios.find((s) => s.id === id);
    if (!sc) return;
    setMode('email');
    setFromEmail(sc.customer?.contact_email || '');
    setFromName(sc.customer?.contact_name || '');
    setSubject(`RFP Inquiry - ${sc.customer?.company || 'Enterprise'}`);
    setBodyText(sc.rfp_text);
  };

  const handleBuilderSubmit = (e) => {
    e.preventDefault();
    const summaryRfp = `Customer ${company} (${contactName}, ${contactEmail}) requests ${seats} seats of ${baseTier} tier with add-ons: ${addOns.join(', ') || 'none'} and ${discountPct}% requested discount.`;
    onSubmitDealBuilder({
      rfp_text: summaryRfp,
      source: 'deal_builder',
      customer_company: company || 'Enterprise Client',
      customer_name: contactName || 'Procurement Lead',
      customer_email: contactEmail || 'client@company.com',
      seats: Number(seats) || 1,
      requested_base_tier: baseTier,
      requested_add_ons: addOns,
      requested_discount_pct: Number(discountPct) || 0,
    });
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!bodyText.trim()) return;
    onSubmitInboundEmail({
      from_email: fromEmail.trim() || 'client@enterprise.com',
      from_name: fromName.trim() || undefined,
      subject: subject.trim() || 'RFP Quote Request',
      body_text: bodyText,
    });
  };

  const tiers = catalog?.base_tiers || [
    { id: 'starter', name: 'Starter', price: 50 },
    { id: 'pro', name: 'Pro', price: 120 },
    { id: 'enterprise', name: 'Enterprise', price: 250 },
  ];
  const availableAddOns = catalog?.add_ons || [
    { id: 'enterprise_sso', name: 'Enterprise SSO', price: 30, type: 'seat_based' },
    { id: 'dedicated_support', name: 'Dedicated Support', price: 1500, type: 'flat_fee' },
    { id: 'custom_ai_module', name: 'Custom AI Module', price: 80, type: 'seat_based' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create New Quote</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure a deal manually or process an incoming client RFP email through LangGraph.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs">
              <button
                type="button"
                onClick={() => setMode('builder')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'builder' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Deal Builder
              </button>
              <button
                type="button"
                onClick={() => setMode('email')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'email' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Inbound Email
              </button>
            </div>
          </div>
        </div>

        {mode === 'builder' ? (
          <form onSubmit={handleBuilderSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company Name *</label>
                <input
                  required
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Logistics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Name *</label>
                <input
                  required
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client Email *</label>
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="sarah@acmelogistics.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Base Tier</label>
                <select
                  value={baseTier}
                  onChange={(e) => setBaseTier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                >
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (${t.price}/seat/mo)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Licensed Seats</label>
                <input
                  type="number"
                  min="1"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Requested Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  step="0.5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Leave 0 for automatic volume pricing</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-2">Add-On Modules</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {availableAddOns.map((a) => {
                  const checked = addOns.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        checked ? 'bg-indigo-50/60 border-indigo-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(a.id)}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{a.name}</div>
                        <div className="text-[11px] text-slate-500">
                          ${a.price}/{a.type === 'flat_fee' ? 'flat/mo' : 'seat/mo'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isRunning}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                {isRunning ? 'Running Deal Desk...' : 'Configure & Price Quote'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-slate-600">
                Simulate an inbound client email to <code className="text-indigo-700 font-semibold">/api/webhooks/inbound-email</code>
              </span>
              <select
                onChange={handleLoadSample}
                defaultValue=""
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="" disabled>Load Sample Client Email...</option>
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id}>{sc.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">From Email *</label>
                <input
                  required
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="buyer@clientcompany.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sender Name</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Client Email Body *</label>
              <textarea
                required
                rows={7}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Paste the client's RFP email request here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white leading-relaxed resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isRunning || !bodyText.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                {isRunning ? 'Processing Inbound Email...' : 'Process Client Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
