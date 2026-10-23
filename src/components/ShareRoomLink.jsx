import React, { useState } from 'react';

export function ShareRoomLink({ roomId, token, onToast }) {
  const [copied, setCopied] = useState(false);

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
      if (onToast) onToast('Room link copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (onToast) onToast('Failed to copy room link', 'error');
    }
  };

  return (
    <div className="panel-box">
      <div className="panel-header">
        <span>SHAREABLE ROOM LINK</span>
        {shortCode && <span className="font-mono text-[11px]">CODE: {shortCode}</span>}
      </div>
      <div className="p-3 bg-[#ffffff] flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={roomUrl}
          onClick={(e) => e.target.select()}
          className="input-classic flex-1 font-mono text-xs select-all bg-[#fafafa]"
        />
        <button
          onClick={handleCopy}
          className="btn-classic-primary text-xs"
        >
          {copied ? '[ Copied ]' : '[ Copy Link ]'}
        </button>
      </div>
    </div>
  );
}
