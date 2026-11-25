import React from 'react';
import { X } from 'lucide-react';

export default function IntegrationsModal({ isOpen, onClose, configStatus }) {
  if (!isOpen) return null;

  const items = [
    {
      name: 'Google Gemini API',
      configured: configStatus?.gemini_configured,
      desc: configStatus?.gemini_configured
        ? 'Connected (gemini-2.5-flash)'
        : 'Not configured in backend/.env',
    },
    {
      name: 'Inbound Email (IMAP)',
      configured: configStatus?.imap_configured,
      desc: configStatus?.imap_configured
        ? `Connected (${configStatus.imap_user})`
        : 'Not configured in backend/.env',
    },
    {
      name: 'Outbound Email (SMTP)',
      configured: configStatus?.smtp_configured,
      desc: configStatus?.smtp_configured
        ? `Connected (${configStatus.smtp_user})`
        : 'Not configured in backend/.env',
    },
  ];

  const allConnected = items.every((i) => i.configured);

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg max-w-md w-full p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Integrations</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.name} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-gray-900">{item.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{item.desc}</div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                  item.configured ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.configured ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
                {item.configured ? 'Connected' : 'Off'}
              </span>
            </div>
          ))}
        </div>

        {!allConnected && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-3 text-[11px] text-gray-600 leading-relaxed">
            Copy <code className="text-gray-900">backend/.env.example</code> to{' '}
            <code className="text-gray-900">backend/.env</code> and add your Gemini API key or Gmail App Password to enable live sync.
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
