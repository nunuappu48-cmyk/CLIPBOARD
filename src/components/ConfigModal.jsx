import React, { useState } from 'react';
import {
  getSupabaseCredentials,
  saveCustomCredentials,
} from '../lib/supabase';

export function ConfigModal({ isOpen, onClose, onToast }) {
  const current = getSupabaseCredentials();
  const [url, setUrl] = useState(current.url || '');
  const [anonKey, setAnonKey] = useState(current.anonKey || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveCustomCredentials(url, anonKey);
    if (onToast) {
      if (url && anonKey) {
        onToast('Supabase credentials saved. Reinitializing...', 'success');
      } else {
        onToast('Switched to Local Sandbox mode.', 'info');
      }
    }
    onClose();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border-2 border-[#1b365d] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Title bar */}
        <div className="bg-[#1b365d] text-white px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold">
          <span>CONFIGURATION: SUPABASE REALTIME CLOUD</span>
          <button
            onClick={onClose}
            className="btn-classic text-[10px] py-0 px-1 text-black font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans text-[#1a1a1a]">
          {/* Status banner */}
          <div
            className={`p-2.5 border font-mono ${
              current.isConfigured
                ? 'bg-[#dff0d8] border-[#d6e9c6] text-[#3c763d]'
                : 'bg-[#fcf8e3] border-[#faebcc] text-[#8a6d3b]'
            }`}
          >
            <p className="font-bold">
              STATUS: {current.isConfigured ? 'CONNECTED TO SUPABASE' : 'LOCAL SANDBOX MODE'}
            </p>
            <p className="mt-1">
              {current.isConfigured
                ? 'Data syncs via PostgreSQL Realtime channels and Storage.'
                : 'Syncing across tabs via BroadcastChannel. Configure credentials below for live multi-device sync.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block font-bold mb-1 uppercase font-mono text-[11px] text-[#333333]">
                Supabase Project URL:
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="input-classic w-full font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 uppercase font-mono text-[11px] text-[#333333]">
                Supabase Anon / Public Key:
              </label>
              <input
                type="text"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="input-classic w-full font-mono text-xs"
              />
              <p className="text-[11px] text-[#666666] mt-0.5 font-mono">
                Note: Use public anon key only. Never enter Service Role secret key.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#cccccc]">
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setAnonKey('');
                }}
                className="btn-classic text-xs"
              >
                Reset to Default Sandbox
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-classic"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-classic-primary"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>

          {/* Database Setup Reference */}
          <div className="pt-3 border-t border-[#cccccc] text-[11px] text-[#555555]">
            <p className="font-bold font-mono uppercase mb-1">Manual Database Setup:</p>
            <ol className="list-decimal list-inside space-y-0.5 font-mono">
              <li>Execute setup script in Supabase SQL editor: <span className="bg-[#ece9d8] px-1">supabase/setup.sql</span></li>
              <li>Paste Project URL & Anon Key into fields above or in <span className="bg-[#ece9d8] px-1">.env</span> file</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
