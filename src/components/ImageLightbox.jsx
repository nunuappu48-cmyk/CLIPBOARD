import React, { useEffect, useState } from 'react';
import { formatFileSize, formatTimeAgo } from '../lib/validation';

export function ImageLightbox({
  image,
  onClose,
  onDelete,
  onToast,
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.original_filename || 'quickclip-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      if (onToast) onToast('Download initiated.', 'success');
    } catch {
      window.open(image.url, '_blank');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      if (onToast) onToast('Image link copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (onToast) onToast('Failed to copy image link', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[96vh] bg-[#ffffff] border-2 border-[#1b365d] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Title bar */}
        <div className="bg-[#1b365d] text-white px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold">
          <div className="truncate pr-2">
            VIEWER: {image.original_filename} ({formatFileSize(image.file_size)})
          </div>
          <button
            onClick={onClose}
            className="btn-classic text-xs py-0.5 px-2 text-black font-bold cursor-pointer shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-[#ece9d8] border-b border-[#999999] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleCopyLink}
              className="btn-classic text-xs py-1 px-2.5 cursor-pointer"
            >
              {copied ? '[ Copied ]' : '[ Copy URL ]'}
            </button>
            <button
              onClick={handleDownload}
              className="btn-classic text-xs py-1 px-2.5 cursor-pointer"
            >
              [ Download ]
            </button>
            <button
              onClick={() => {
                onDelete(image.id);
                onClose();
              }}
              className="btn-classic-danger text-xs py-1 px-2.5 cursor-pointer"
            >
              [ Delete ]
            </button>
          </div>

          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#003399] hover:underline font-mono text-xs"
          >
            Open Raw Image ↗
          </a>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 min-h-[220px] sm:min-h-[300px] bg-[#e5e5e0]">
          <img
            src={image.url}
            alt={image.original_filename}
            className="max-h-[55vh] sm:max-h-[65vh] max-w-full object-contain border border-[#707070] bg-[#ffffff]"
          />
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 bg-[#ece9d8] border-t border-[#999999] flex flex-wrap items-center justify-between gap-1 font-mono text-[11px] text-[#555555]">
          <span>UPLOADED: {formatTimeAgo(image.uploaded_at).toUpperCase()}</span>
          <span className="hidden sm:inline">PRESS [ESC] TO CLOSE</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-classic text-[10px] sm:hidden py-0.5 px-2"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
