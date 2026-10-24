import React, { useState } from 'react';
import QRCode from 'qrcode';

export function ShareRoomCode({
  code,
  roomId,
  token,
  onToast,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Formatted code e.g. 784-291
  const displayCode = code
    ? code.length === 6 && !code.includes('-')
      ? `${code.substring(0, 3)}-${code.substring(3, 6)}`
      : code
    : roomId ? roomId.substring(0, 8).toUpperCase() : '';

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${code || roomId}#token=${token}`
    : '';

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

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

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'QuickClip Real-Time Clipboard',
        text: `Join my QuickClip clipboard session with code: ${displayCode}`,
        url: roomUrl,
      });
      if (onToast) onToast('Shared successfully.', 'success');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        handleCopyCode();
      }
    }
  };

  const handleToggleQR = async () => {
    if (!showQR && !qrDataUrl && roomUrl) {
      try {
        setIsGeneratingQR(true);
        const url = await QRCode.toDataURL(roomUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1b365d',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        if (onToast) onToast('Failed to generate QR code', 'error');
      } finally {
        setIsGeneratingQR(false);
      }
    }
    setShowQR((prev) => !prev);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    try {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `quickclip-qr-${displayCode || 'session'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL?.(a.href);
      document.body.removeChild(a);
      if (onToast) onToast('QR Code image downloaded.', 'info');
    } catch {
      if (onToast) onToast('Download failed.', 'error');
    }
  };

  return (
    <div className="panel-box">
      <div className="panel-header-navy flex-wrap gap-1">
        <span>SESSION CONNECTION DETAILS</span>
        <span className="font-mono text-[11px] text-[#c2d7f2]">TWO-PARTY SPLIT SESSION</span>
      </div>

      <div className="p-3 sm:p-4 bg-[#fcfcfa] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#cccccc]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
              Room Code:
            </span>
            <span className="text-[10px] sm:text-[11px] bg-[#e5e5e0] text-[#333333] px-1.5 py-0.2 border border-[#999999] font-mono font-bold">
              PEER READY
            </span>
          </div>
          <p className="text-xs text-[#555555] mt-1">
            Provide this 6-digit code or scan QR code with mobile to join this synchronized workspace.
          </p>
        </div>

        {/* Code display and copy/share/QR buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#ffffff] border-2 border-[#1b365d] px-3 sm:px-4 py-1.5 text-xl sm:text-2xl font-mono font-bold tracking-widest text-[#1b365d] select-all shrink-0">
            {displayCode}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn-classic-primary text-xs py-2 px-3 shrink-0 cursor-pointer"
              title="Copy Room Code"
            >
              {copiedCode ? '[ Code Copied ]' : '[ Copy Code ]'}
            </button>

            <button
              type="button"
              onClick={handleToggleQR}
              className="btn-classic text-xs py-2 px-2.5 shrink-0 cursor-pointer font-bold"
              title="Generate Scannable QR Code"
            >
              {showQR ? '[ Hide QR ]' : '[ QR Code ]'}
            </button>

            {canShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="btn-classic text-xs py-2 px-2.5 shrink-0 cursor-pointer"
                title="Share via device apps"
              >
                [ Share ↗ ]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Direct URL & QR Code section */}
      <div className="px-3 sm:px-4 py-2 bg-[#f0f0eb] flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowLink(!showLink)}
            className="text-[#003399] hover:text-[#8b0000] underline font-mono text-xs cursor-pointer"
          >
            {showLink ? '[-] Hide Direct URL' : '[+] Need direct URL link instead?'}
          </button>

          {!showQR ? (
            <button
              type="button"
              onClick={handleToggleQR}
              disabled={isGeneratingQR}
              className="btn-classic-primary text-xs py-1 sm:py-1 px-2.5 sm:px-3 cursor-pointer font-bold inline-flex items-center gap-1"
            >
              {isGeneratingQR ? '[ Generating QR... ]' : '[+ Generate QR Code for link]'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleQR}
              className="btn-classic text-xs py-1 px-2.5 cursor-pointer inline-flex items-center gap-1"
            >
              [-] Hide QR Code
            </button>
          )}
        </div>

        {showLink && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-[#d8d8d4]">
            <input
              type="text"
              readOnly
              value={roomUrl}
              onClick={(e) => e.target.select()}
              className="input-classic w-full sm:flex-1 font-mono text-xs select-all bg-white min-w-0"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-classic text-xs shrink-0 py-2 sm:py-1 cursor-pointer"
            >
              {copiedLink ? '[ Copied ]' : '[ Copy URL ]'}
            </button>
            <button
              type="button"
              onClick={handleToggleQR}
              disabled={isGeneratingQR}
              className="btn-classic-primary text-xs shrink-0 py-2 sm:py-1 cursor-pointer"
            >
              {isGeneratingQR ? 'Generating QR...' : showQR ? '[ Hide QR Code ]' : '[ Generate QR Code ]'}
            </button>
          </div>
        )}

        {/* Generated QR Code Card */}
        {showQR && (
          <div className="mt-2 p-3 sm:p-4 bg-[#ffffff] border border-[#999999] flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0 bg-[#ffffff] p-2 border-2 border-[#1b365d] shadow-xs flex items-center justify-center">
              {isGeneratingQR ? (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center font-mono text-xs text-[#666666]">
                  Generating QR Code...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for room ${displayCode}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center font-mono text-xs text-[#8b0000]">
                  Failed to load QR code.
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between text-left space-y-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1b365d] bg-[#eaf2fd] border border-[#b8d4f7] px-2 py-0.5">
                    ROOM: {displayCode}
                  </span>
                  <span className="font-mono text-[11px] text-[#555555]">
                    INSTANT CAMERA CONNECT
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#1a1a1a] mt-1.5 font-sans">
                  Scan to Connect From Mobile
                </h3>
                <p className="text-xs text-[#555555] leading-relaxed mt-1">
                  Open your mobile phone camera or scanner app and point it at this QR code. You'll be taken directly into this synchronized dual clipboard without typing the code.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e0e0e0]">
                {qrDataUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="btn-classic text-xs py-1.5 px-3 cursor-pointer"
                  >
                    [ Download QR PNG ]
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-classic text-xs py-1.5 px-3 cursor-pointer"
                >
                  {copiedLink ? '[ URL Copied ]' : '[ Copy Link ]'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQR(false)}
                  className="btn-classic text-xs py-1.5 px-3 cursor-pointer text-[#8b0000]"
                >
                  [ Close QR ]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
