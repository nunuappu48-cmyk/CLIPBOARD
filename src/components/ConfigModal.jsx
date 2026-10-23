import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
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
        onToast('Supabase credentials saved! Initializing connection...', 'success');
      } else {
        onToast('Switched to Local Sandbox mode.', 'info');
      }
    }
    onClose();
    // Refresh page state
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Supabase Configuration</h3>
              <p className="text-xs text-slate-500">Connect your Supabase project for real-time cloud sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              current.isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {current.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-sm">
                {current.isConfigured
                  ? 'Supabase Backend Connected'
                  : 'Running in Local Sandbox Mode'}
              </p>
              <p className="mt-0.5 opacity-90">
                {current.isConfigured
                  ? 'Your rooms are synchronizing via Supabase PostgreSQL, Realtime channels, and Storage.'
                  : 'Currently syncing across browser tabs via local BroadcastChannel. You can connect your live Supabase project below.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Supabase Anon / Public Key
              </label>
              <input
                type="text"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Never enter your Service Role key. Only use your project's anon/public key.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setAnonKey('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Reset to default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>

          {/* Setup tips */}
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Database Setup (1-minute guide):</p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Create a free project at supabase.com</li>
              <li>Open the SQL Editor in your Supabase dashboard</li>
              <li>Run the setup script found in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">supabase/setup.sql</code></li>
              <li>Paste your Project URL & Anon Key above or in your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> file!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
