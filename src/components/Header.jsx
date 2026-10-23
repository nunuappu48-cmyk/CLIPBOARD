import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  Clock,
  Database,
} from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ConfigModal } from './ConfigModal';
import { isSupabaseReady } from '../lib/supabase';

export function Header({
  connectionStatus,
  timeRemaining,
  isExpiringSoon,
  isInRoom = false,
  onToast,
}) {
  const [showConfig, setShowConfig] = useState(false);
  const isCloudConnected = isSupabaseReady();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  QuickClip
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                  Real-time
                </span>
              </div>
            </div>
          </Link>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Room-specific indicators */}
            {isInRoom && (
              <>
                <ConnectionStatus status={connectionStatus} isSupabase={isCloudConnected} />

                {timeRemaining && (
                  <div
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isExpiringSoon
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                    title="Room auto-expires 24 hours after last activity"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{timeRemaining}</span>
                  </div>
                )}

                <Link
                  to="/"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Room</span>
                </Link>
              </>
            )}

            {/* Supabase status / Settings toggle */}
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isCloudConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Supabase Settings"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isCloudConnected ? 'Supabase' : 'Sandbox'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Configuration modal */}
      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onToast={onToast}
      />
    </>
  );
}
