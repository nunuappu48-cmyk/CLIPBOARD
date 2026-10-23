import React, { useState } from 'react';
import { Copy, Check, Share2, Link as LinkIcon } from 'lucide-react';

export function ShareRoomLink({ roomId, token, onToast }) {
  const [copied, setCopied] = useState(false);

  // Use URL with hash (#token=...) for superior privacy (hash is never sent to backend servers)
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomId}#token=${token}`
    : '';

  const shortCode = roomId ? roomId.split('-')[0].toUpperCase() : '';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomUrl);
      } else {
        const input = document.createElement('input');
        input.value = roomUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      if (onToast) onToast('Room link copied! Ready to share with your friend.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (onToast) onToast('Failed to copy room link', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QuickClip Shared Room',
          text: 'Join my real-time clipboard on QuickClip to share text and images:',
          url: roomUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Shareable Room Link</h3>
            <p className="text-xs text-slate-500">
              Anyone with this link can view and collaborate in this room in real time.
            </p>
          </div>
        </div>

        {shortCode && (
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="text-slate-400">Code:</span>
            <span className="font-semibold text-slate-800">{shortCode}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            readOnly
            value={roomUrl}
            onClick={(e) => e.target.select()}
            className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all select-all truncate pr-10"
          />
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 shadow-xs ${
            copied
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/10'
          }`}
          title="Copy Link to Clipboard"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>

        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shrink-0"
            title="Share with Apps"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
