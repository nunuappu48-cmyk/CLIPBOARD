import React, { useState } from 'react';
import { Copy, Check, Hash, Link as LinkIcon } from 'lucide-react';

export function ShareRoomCode({
  code,
  roomId,
  token,
  onToast,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLink, setShowLink] = useState(false);

  // Formatted code e.g. 784-291
  const displayCode = code
    ? code.length === 6 && !code.includes('-')
      ? `${code.substring(0, 3)}-${code.substring(3, 6)}`
      : code
    : roomId ? roomId.substring(0, 8).toUpperCase() : '';

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${code || roomId}#token=${token}`
    : '';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopiedCode(true);
      if (onToast) onToast(`Room code "${displayCode}" copied! Tell User 2 to enter this code.`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      if (onToast) onToast('Failed to copy room code', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopiedLink(true);
      if (onToast) onToast('Full room URL copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      if (onToast) onToast('Failed to copy link', 'error');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-blue-500/15 transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Code info */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/20">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Room Connection Code
              </span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                Ready for User 2
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Tell your friend to enter this 6-digit code on the QuickClip home page.
            </p>
          </div>
        </div>

        {/* Center: Large Room Code Pill */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-center">
          <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl sm:text-3xl font-mono font-black tracking-widest text-white shadow-inner select-all">
            {displayCode}
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shrink-0 shadow-md ${
              copiedCode
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-blue-700 hover:bg-blue-50 active:scale-95'
            }`}
            title="Copy Room Code"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Secondary: Option to reveal direct link */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-200/90">
        <button
          type="button"
          onClick={() => setShowLink(!showLink)}
          className="flex items-center gap-1.5 hover:text-white transition-colors underline-offset-4 hover:underline"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>{showLink ? 'Hide direct URL link' : 'Need a direct URL link instead?'}</span>
        </button>

        {showLink && (
          <div className="w-full flex items-center gap-2 pt-2 animate-in fade-in">
            <input
              type="text"
              readOnly
              value={roomUrl}
              onClick={(e) => e.target.select()}
              className="flex-1 bg-black/20 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white/90 select-all truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors shrink-0"
            >
              {copiedLink ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
