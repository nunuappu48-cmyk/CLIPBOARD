import React, { useState, useRef } from 'react';
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
    <div className="space-y-2">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`panel-box p-3 text-center border ${
          isDragOver ? 'border-[#1b365d] bg-[#eaf2fd]' : 'border-[#999999] bg-[#ffffff]'
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div>
            <div className="text-xs font-bold text-[#1a1a1a]">
              IMAGE & SCREENSHOT UPLOADER
            </div>
            <div className="text-[11px] font-mono text-[#555555] mt-0.5">
              Formats: PNG, JPG, GIF, WebP (≤10 MB). Paste screenshots directly with <span className="bg-[#ece9d8] px-1 border border-[#cccccc]">Ctrl+V</span>.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-classic-primary text-xs"
            >
              [ Browse Files... ]
            </button>
          </div>
        </div>
      </div>

      {/* Upload Queue Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-1">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="bg-[#ffffff] p-2 border border-[#999999] text-xs font-mono"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold truncate text-[#1a1a1a]">{item.name}</span>
                <span className="text-[#666666] shrink-0">
                  {item.size ? formatFileSize(item.size) : ''} [{item.status.toUpperCase()}]
                </span>
              </div>

              {/* Progress bar */}
              {item.status === 'uploading' && (
                <div className="w-full bg-[#ece9d8] border border-[#999999] h-2.5">
                  <div
                    className="bg-[#1b365d] h-full"
                    style={{ width: `${item.progress || 30}%` }}
                  ></div>
                </div>
              )}

              {item.status === 'error' && (
                <div className="text-[#8b0000] font-bold text-[11px] mt-0.5">
                  Error: {item.error || 'Upload failed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
