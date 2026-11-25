import React from 'react';
import { X, Plug, CheckCircle2, AlertCircle, Mail, Sparkles, Send } from 'lucide-react';

export default function IntegrationsModal({ isOpen, onClose, configStatus }) {
  if (!isOpen) return null;

  const items = [
    {
      name: 'Google Gemini AI (Live NLP & Drafting)',
      envKey: 'GEMINI_API_KEY',
      configured: configStatus?.gemini_configured,
      icon: Sparkles,
      desc: configStatus?.gemini_configured
        ? 'Connected server-side via backend/.env (gemini-2.5-flash).'
        : 'Not set in backend/.env — using deterministic local parser & templates as fallback.',
    },
    {
      name: 'Inbound Client Email (IMAP Inbox Sync)',
      envKey: 'IMAP_HOST, IMAP_USER, IMAP_PASSWORD',
      configured: configStatus?.imap_configured,
      icon: Mail,
      desc: configStatus?.imap_configured
        ? `Connected to ${configStatus.imap_user}. Click "Sync Inbox" to pull unread RFPs.`
        : 'Not set in backend/.env — use "Sync Inbox" once configured, or POST to /api/webhooks/inbound-email.',
    },
    {
      name: 'Outbound Quote Delivery (SMTP + PDF)',
      envKey: 'SMTP_HOST, SMTP_USER, SMTP_PASSWORD',
      configured: configStatus?.smtp_configured,
      icon: Send,
      desc: configStatus?.smtp_configured
        ? `Ready to send quotes from ${configStatus.smtp_user} with PDF attached.`
        : 'Not set in backend/.env — clicking "Send Quote Email" simulates delivery and logs to audit.db.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Production Email & AI Integrations</h2>
              <p className="text-xs text-slate-500">Configured securely via server-side <code className="bg-slate-100 px-1 rounded">backend/.env</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${item.configured ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    {item.configured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                        <AlertCircle className="w-3 h-3" /> Not Configured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">Keys: {item.envKey}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs">
          <div className="font-semibold text-white mb-1.5">How to Connect a Real Gmail Inbox + Gemini API:</div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>Copy <code className="text-indigo-300">backend/.env.example</code> to <code className="text-indigo-300">backend/.env</code>.</li>
            <li>Add your <code className="text-emerald-300">GEMINI_API_KEY</code> from Google AI Studio.</li>
            <li>For Gmail IMAP/SMTP, enable 2-Step Verification and generate a 16-char <strong>App Password</strong>, then set <code className="text-indigo-300">IMAP_USER</code>, <code className="text-indigo-300">IMAP_PASSWORD</code>, <code className="text-indigo-300">SMTP_USER</code>, and <code className="text-indigo-300">SMTP_PASSWORD</code>.</li>
            <li>Restart the backend or click <strong>Sync Inbox</strong> to ingest real client emails!</li>
          </ol>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
