import React, { useState } from 'react';
import {
  Download,
  Copy,
  Trash2,
  Maximize2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { formatFileSize, formatTimeAgo } from '../lib/validation';
import { ConfirmDialog } from './ConfirmDialog';

export function ImageGallery({
  images = [],
  loading = false,
  onImageClick,
  onDeleteImage,
  onToast,
}) {
  const [imageToDelete, setImageToDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = async (e, image) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(image.url);
      setCopiedId(image.id);
      if (onToast) onToast('Image link copied to clipboard', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      if (onToast) onToast('Failed to copy image link', 'error');
    }
  };

  const handleDownload = async (e, image) => {
    e.stopPropagation();
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
      if (onToast) onToast('Downloading image...', 'info');
    } catch {
      window.open(image.url, '_blank');
    }
  };

  const handleDeleteClick = (e, image) => {
    e.stopPropagation();
    setImageToDelete(image);
  };

  if (loading && images.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        <p className="text-xs">Loading room images...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-200/90 text-center flex flex-col items-center justify-center bg-white/50">
        <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 mb-2">
          <ImageIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">No images shared yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Upload screenshots or photos above to share them instantly with anyone in this room.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Shared Images ({images.length})
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => onImageClick(image)}
            className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col"
          >
            {/* Image Thumbnail */}
            <div className="relative aspect-4/3 bg-slate-100 overflow-hidden flex items-center justify-center">
              <img
                src={image.url}
                alt={image.original_filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Hover action overlay */}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(image);
                  }}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-transform active:scale-95"
                  title="Expand preview"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, image)}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-transform active:scale-95"
                  title="Copy link"
                >
                  {copiedId === image.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, image)}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-transform active:scale-95"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, image)}
                  className="p-2 rounded-xl bg-white/90 hover:bg-white text-rose-600 shadow-sm transition-transform active:scale-95"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="p-2.5 bg-white flex flex-col gap-0.5">
              <span className="text-xs font-medium text-slate-800 truncate" title={image.original_filename}>
                {image.original_filename}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatFileSize(image.file_size)}</span>
                <span>{formatTimeAgo(image.uploaded_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(imageToDelete)}
        title="Delete Image?"
        message={`Are you sure you want to delete "${imageToDelete?.original_filename}"? It will be removed for everyone in this room.`}
        confirmLabel="Delete Image"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (imageToDelete) {
            onDeleteImage(imageToDelete.id);
            setImageToDelete(null);
          }
        }}
        onCancel={() => setImageToDelete(null)}
      />
    </div>
  );
}
