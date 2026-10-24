import React, { useState } from 'react';
import { formatFileSize, formatTimeAgo } from '../lib/validation';

export function ImageGallery({
  images = [],
  loading = false,
  onImageClick,
  onDeleteImage,
  onToast,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 'grid' : 'table';
  });

  const handleCopyLink = async (e, image) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(image.url);
      setCopiedId(image.id);
      if (onToast) onToast('Image link copied to clipboard.', 'success');
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
      if (onToast) onToast('Download initiated.', 'info');
    } catch {
      window.open(image.url, '_blank');
    }
  };

  const handleDeleteClick = (e, image) => {
    e.stopPropagation();
    if (confirmDeleteId === image.id) {
      onDeleteImage(image.id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(image.id);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === image.id ? null : prev));
      }, 4000);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="p-6 bg-[#ffffff] border border-[#999999] text-center font-mono text-xs text-[#555555]">
        [ LOADING SHARED REPOSITORY IMAGES... ]
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="p-4 bg-[#ffffff] border border-[#999999] text-center font-mono text-xs text-[#666666]">
        NO IMAGES OR SCREENSHOTS SHARED IN THIS SESSION YET.
      </div>
    );
  }

  return (
    <div className="panel-box">
      {/* Header Bar */}
      <div className="panel-header flex-wrap gap-1.5">
        <span className="font-mono text-xs font-bold">
          SHARED FILES ({images.length} {images.length === 1 ? 'ITEM' : 'ITEMS'})
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`btn-classic text-[11px] cursor-pointer ${viewMode === 'table' ? 'bg-[#d0d0ca] font-bold' : ''}`}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`btn-classic text-[11px] cursor-pointer ${viewMode === 'grid' ? 'bg-[#d0d0ca] font-bold' : ''}`}
          >
            Thumbnails
          </button>
        </div>
      </div>

      {/* Table / List View */}
      {viewMode === 'table' ? (
        <div>
          {/* Mobile Card List for < md screens */}
          <div className="divide-y divide-[#cccccc] md:hidden">
            {images.map((image) => (
              <div key={image.id} className="p-3 bg-[#ffffff] flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={image.url}
                    alt={image.original_filename}
                    onClick={() => onImageClick(image)}
                    className="w-12 h-12 object-cover border border-[#999999] cursor-pointer bg-[#ffffff] shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onImageClick(image)}
                      className="text-[#003399] hover:underline font-mono text-left font-bold text-xs truncate block w-full cursor-pointer"
                    >
                      {image.original_filename}
                    </button>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#555555] mt-0.5">
                      <span>{formatFileSize(image.file_size)}</span>
                      <span>•</span>
                      <span className="px-1 py-0.2 border border-[#999999] bg-[#ece9d8]">
                        {image.uploader_id === 'user1' ? 'User 1' : image.uploader_id === 'user2' ? 'User 2' : 'Shared'}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-[#777777] mt-0.5">
                      {formatTimeAgo(image.uploaded_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#f0f0eb]">
                  <button
                    type="button"
                    onClick={() => onImageClick(image)}
                    className="btn-classic text-[11px] flex-1 py-1.5"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e, image)}
                    className="btn-classic text-[11px] flex-1 py-1.5"
                  >
                    {copiedId === image.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, image)}
                    className="btn-classic text-[11px] flex-1 py-1.5"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, image)}
                    className="btn-classic-danger text-[11px] py-1.5 px-2"
                  >
                    {confirmDeleteId === image.id ? 'Sure?' : 'Del'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View for >= md screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table-classic">
              <thead>
                <tr>
                  <th className="w-12 text-center">Thumb</th>
                  <th>File Name</th>
                  <th className="w-24">Size</th>
                  <th className="w-24">Uploaded By</th>
                  <th className="w-28">Timestamp</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {images.map((image) => (
                  <tr key={image.id}>
                    <td className="text-center p-1">
                      <img
                        src={image.url}
                        alt={image.original_filename}
                        onClick={() => onImageClick(image)}
                        className="w-9 h-9 object-cover border border-[#999999] cursor-pointer mx-auto bg-[#ffffff]"
                        loading="lazy"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onImageClick(image)}
                        className="text-[#003399] hover:underline font-mono text-left font-bold cursor-pointer"
                      >
                        {image.original_filename}
                      </button>
                    </td>
                    <td className="font-mono text-xs text-[#555555]">
                      {formatFileSize(image.file_size)}
                    </td>
                    <td>
                      <span className="font-mono text-[11px] px-1 py-0.2 border border-[#999999] bg-[#ece9d8]">
                        {image.uploader_id === 'user1' ? 'User 1' : image.uploader_id === 'user2' ? 'User 2' : 'Shared'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#555555]">
                      {formatTimeAgo(image.uploaded_at)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onImageClick(image)}
                          className="btn-classic text-[11px]"
                        >
                          [ View ]
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(e, image)}
                          className="btn-classic text-[11px]"
                        >
                          {copiedId === image.id ? '[ Copied ]' : '[ Copy URL ]'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, image)}
                          className="btn-classic text-[11px]"
                        >
                          [ Download ]
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, image)}
                          className="btn-classic-danger text-[11px]"
                        >
                          {confirmDeleteId === image.id ? '[ Confirm Delete? ]' : '[ Delete ]'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dense Grid View */
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {images.map((image) => (
            <div
              key={image.id}
              className="border border-[#999999] bg-[#ffffff] p-2 flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => onImageClick(image)}
                  className="aspect-4/3 bg-[#eaeaea] border border-[#cccccc] overflow-hidden cursor-pointer mb-2 flex items-center justify-center"
                >
                  <img
                    src={image.url}
                    alt={image.original_filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="font-mono text-xs font-bold truncate text-[#1a1a1a]" title={image.original_filename}>
                  {image.original_filename}
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-[#666666] mt-0.5">
                  <span>{formatFileSize(image.file_size)}</span>
                  <span>{image.uploader_id === 'user1' ? 'U1' : image.uploader_id === 'user2' ? 'U2' : ''}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() => onImageClick(image)}
                  className="btn-classic text-[10px] flex-1"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, image)}
                  className="btn-classic text-[10px] flex-1"
                >
                  {copiedId === image.id ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, image)}
                  className="btn-classic text-[10px] flex-1"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, image)}
                  className="btn-classic-danger text-[10px]"
                >
                  {confirmDeleteId === image.id ? 'Sure?' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
