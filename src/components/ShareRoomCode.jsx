import React, { useState } from 'react';

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
      if (onToast) onToast(`Room code "${displayCode}" copied to clipboard.`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      if (onToast) onToast('Failed to copy room code', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopiedLink(true);
      if (onToast) onToast('Session URL copied to clipboard.', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      if (onToast) onToast('Failed to copy link', 'error');
    }
  };

  return (
    <div className="panel-box">
      <div className="panel-header-navy">
        <span>SESSION CONNECTION DETAILS</span>
        <span className="font-mono text-[11px] text-[#c2d7f2]">TWO-PARTY SPLIT SESSION</span>
      </div>

      <div className="p-3 sm:p-4 bg-[#fcfcfa] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#cccccc]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
              Room Code:
            </span>
            <span className="text-[11px] bg-[#e5e5e0] text-[#333333] px-1.5 py-0.2 border border-[#999999] font-mono font-bold">
              PEER READY
            </span>
          </div>
          <p className="text-xs text-[#555555] mt-1">
            Provide this 6-digit code to peer User 2 to join this synchronized workspace.
          </p>
        </div>

        {/* Code display and copy button */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
          <div className="bg-[#ffffff] border-2 border-[#1b365d] px-4 py-1.5 text-2xl font-mono font-bold tracking-widest text-[#1b365d] select-all">
            {displayCode}
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="btn-classic-primary text-xs py-2 px-3"
            title="Copy Room Code"
          >
            {copiedCode ? '[ Code Copied ]' : '[ Copy Code ]'}
          </button>
        </div>
      </div>

      {/* Direct URL toggle */}
      <div className="px-3 sm:px-4 py-2 bg-[#f0f0eb] flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowLink(!showLink)}
            className="text-[#003399] hover:text-[#8b0000] underline font-mono text-xs cursor-pointer"
          >
            {showLink ? '[-] Hide Direct URL' : '[+] Need direct URL link instead?'}
          </button>
        </div>

        {showLink && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#d8d8d4]">
            <input
              type="text"
              readOnly
              value={roomUrl}
              onClick={(e) => e.target.select()}
              className="input-classic flex-1 font-mono text-xs select-all bg-white"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-classic text-xs"
            >
              {copiedLink ? '[ Copied ]' : '[ Copy URL ]'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
