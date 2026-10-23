import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionStatus({ status = 'connected', isSupabase = false }) {
  const configs = {
    connected: {
      color: 'bg-emerald-500',
      text: 'Live Sync Active',
      subtext: isSupabase ? 'Supabase Realtime' : 'Local Sandbox Bus',
      icon: (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      ),
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    connecting: {
      color: 'bg-amber-500',
      text: 'Connecting...',
      subtext: 'Establishing sync',
      icon: <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />,
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    disconnected: {
      color: 'bg-rose-500',
      text: 'Disconnected',
      subtext: 'Reconnecting...',
      icon: <WifiOff className="w-3 h-3 text-rose-500" />,
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200/60',
    },
    error: {
      color: 'bg-rose-500',
      text: 'Sync Error',
      subtext: 'Check connection',
      icon: <WifiOff className="w-3 h-3 text-rose-500" />,
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200/60',
    },
  };

  const current = configs[status] || configs.connecting;

  return (
    <div
      title={current.subtext}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${current.badgeStyle}`}
    >
      {current.icon}
      <span>{current.text}</span>
    </div>
  );
}
