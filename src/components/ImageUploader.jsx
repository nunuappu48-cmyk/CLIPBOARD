import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { formatFileSize, ALLOWED_IMAGE_TYPES } from '../lib/validation';

export function ImageUploader({ uploadQueue = [], onUploadFiles }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onUploadFiles(files);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all group ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
            : 'border-slate-200/90 bg-white hover:border-blue-400 hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div
            className={`p-3 rounded-2xl transition-colors ${
              isDragOver
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'
            }`}
          >
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              <span className="text-blue-600 group-hover:underline">Click to upload</span> or drag and drop images
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PNG, JPG, JPEG, GIF, WebP up to 10 MB each • Paste screenshots directly (<kbd className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Ctrl+V</kbd>)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Queue Progress Bars */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-3 border border-slate-200 text-xs shadow-xs animate-in fade-in"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 truncate">
                  {item.status === 'uploading' ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                  ) : item.status === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-medium text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="shrink-0 text-slate-400">
                  {item.size ? formatFileSize(item.size) : ''}
                </div>
              </div>

              {/* Progress bar */}
              {item.status === 'uploading' && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress || 30}%` }}
                  ></div>
                </div>
              )}

              {item.status === 'error' && (
                <p className="text-rose-600 text-[11px] font-medium mt-1">{item.error || 'Upload failed'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
