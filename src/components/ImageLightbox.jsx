import React, { useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Trash2,
  Calendar,
  HardDrive,
  ExternalLink,
  Check,
} from 'lucide-react';
import { formatFileSize, formatTimeAgo } from '../lib/validation';

export function ImageLightbox({
  image,
  onClose,
  onDelete,
  onToast,
}) {
  const [copied, setCopied] = React.useState(false);

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
      if (onToast) onToast('Download started', 'success');
    } catch {
      // Fallback: open link directly in new tab
      window.open(image.url, '_blank');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      if (onToast) onToast('Image link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (onToast) onToast('Failed to copy image link', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[92vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3 truncate">
            <span className="text-sm font-medium text-white truncate">
              {image.original_filename}
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
              ({formatFileSize(image.file_size)})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy Image URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDelete(image.id);
                onClose();
              }}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
              title="Delete Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lightbox Image Preview Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[300px] bg-slate-950/50">
          <img
            src={image.url}
            alt={image.original_filename}
            className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg select-none"
          />
        </div>

        {/* Lightbox Footer Bar */}
        <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              {formatFileSize(image.file_size)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formatTimeAgo(image.uploaded_at)}
            </span>
          </div>

          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>Open Original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
