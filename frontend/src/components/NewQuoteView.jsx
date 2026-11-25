import React, { useState } from 'react';

export default function NewQuoteView({
  scenarios,
  catalog,
  onSubmitDealBuilder,
  onSubmitInboundEmail,
  isRunning,
}) {
  const [mode, setMode] = useState('builder'); // 'builder' | 'email'

  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [seats, setSeats] = useState(50);
  const [baseTier, setBaseTier] = useState('pro');
  const [addOns, setAddOns] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);

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
    setSubject(`Quote Request - ${sc.customer?.company || 'Enterprise'}`);
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
      subject: subject.trim() || 'Quote Request',
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

  // Live preview estimate for right-hand summary panel
  const selectedTierObj = tiers.find((t) => t.id === baseTier) || tiers[0];
  const seatCount = Math.max(1, Number(seats) || 1);
  const tierSubtotal = (selectedTierObj?.price || 0) * seatCount;
  const addonsSubtotal = addOns.reduce((acc, aid) => {
    const a = availableAddOns.find((x) => x.id === aid);
    if (!a) return acc;
    return acc + (a.type === 'flat_fee' ? a.price : a.price * seatCount);
  }, 0);
  const listMonthly = tierSubtotal + addonsSubtotal;
  const volDiscount = seatCount >= 200 ? 15 : seatCount >= 50 ? 10 : 0;
  const effectiveDiscount = Number(discountPct) > 0 ? Number(discountPct) : volDiscount;
  const estNet = listMonthly * (1 - effectiveDiscount / 100);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Main Form (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900">Create quote</h2>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setMode('builder')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                mode === 'builder' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                mode === 'email' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Paste email
            </button>
          </div>
        </div>

        <div className="p-5">
          {mode === 'builder' ? (
            <form onSubmit={handleBuilderSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Company</label>
                  <input
                    required
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Contact name</label>
                  <input
                    required
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Client email</label>
                  <input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sarah@acme.com"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Plan</label>
                  <select
                    value={baseTier}
                    onChange={(e) => setBaseTier(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (${t.price}/seat/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 tabular-nums focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="0.5"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 tabular-nums focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-2">Add-ons</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {availableAddOns.map((a) => {
                    const checked = addOns.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className={`p-3 rounded-md border cursor-pointer flex items-start gap-2.5 transition-colors ${
                          checked ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(a.id)}
                          className="mt-0.5 accent-blue-600"
                        />
                        <div>
                          <div className="font-medium text-slate-900">{a.name}</div>
                          <div className="text-[11px] text-slate-500">
                            ${a.price}/{a.type === 'flat_fee' ? 'mo' : 'seat/mo'}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? 'Calculating...' : 'Generate quote'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <span className="text-slate-500">Process a raw client email</span>
                <select
                  onChange={handleLoadSample}
                  defaultValue=""
                  className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-600"
                >
                  <option value="" disabled>Load template...</option>
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">From email</label>
                  <input
                    required
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="buyer@company.com"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Sender name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Email body</label>
                <textarea
                  required
                  rows={8}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Paste client email..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isRunning || !bodyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-md cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? 'Processing...' : 'Generate quote'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Summary / Policy Reference Panel (4 cols — eliminates dead space) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 text-xs space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100">
            Estimated summary
          </h3>
          {mode === 'builder' ? (
            <div className="space-y-2 tabular-nums">
              <div className="flex justify-between text-slate-500">
                <span>{selectedTierObj?.name} ({seatCount} seats)</span>
                <span className="text-slate-900 font-medium">${tierSubtotal.toLocaleString()}/mo</span>
              </div>
              {addonsSubtotal > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Add-ons ({addOns.length})</span>
                  <span className="text-slate-900 font-medium">${addonsSubtotal.toLocaleString()}/mo</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>{effectiveDiscount}%</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 text-sm pt-2 border-t border-slate-100">
                <span>Est. net monthly</span>
                <span className="text-blue-700">${estNet.toLocaleString('en-US', { maximumFractionDigits: 2 })}/mo</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 leading-relaxed">
              The email parser extracts customer info, seat counts, plan tier, and any requested discount automatically, then validates bundle rules and margins.
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 text-xs space-y-2">
          <h3 className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100">
            Active pricing rules
          </h3>
          <div className="flex justify-between text-slate-600">
            <span>Volume (50–199 seats)</span>
            <span className="font-medium text-slate-900">10% off</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Volume (200+ seats)</span>
            <span className="font-medium text-slate-900">15% off</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Max auto-approve discount</span>
            <span className="font-medium text-slate-900">15%</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Minimum gross margin</span>
            <span className="font-medium text-emerald-700">25%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
