import React from 'react';

export function ConnectionStatus({ status = 'connected', isSupabase = false }) {
  const configs = {
    connected: {
      dot: '■',
      text: 'SYNC: ACTIVE',
      subtext: isSupabase ? 'Supabase Realtime Cloud' : 'Local Tab Bus',
      style: 'bg-[#214227] text-[#9df0a9] border-[#3e7247]',
    },
    connecting: {
      dot: '▲',
      text: 'SYNC: CONNECTING...',
      subtext: 'Establishing sync session',
      style: 'bg-[#4d3800] text-[#ffe082] border-[#7a5900]',
    },
    disconnected: {
      dot: '✖',
      text: 'SYNC: OFFLINE',
      subtext: 'Session disconnected',
      style: 'bg-[#521717] text-[#ffb4b4] border-[#8a2a2a]',
    },
    error: {
      dot: '✖',
      text: 'SYNC: ERROR',
      subtext: 'Connection error',
      style: 'bg-[#521717] text-[#ffb4b4] border-[#8a2a2a]',
    },
  };

  const current = configs[status] || configs.connecting;

  return (
    <div
      title={current.subtext}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-bold border ${current.style}`}
    >
      <span>{current.dot}</span>
      <span>{current.text}</span>
    </div>
  );
}
