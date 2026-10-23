import React from 'react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="w-full max-w-md bg-[#ffffff] border-2 border-[#1b365d] shadow-none">
        {/* Title bar */}
        <div className="bg-[#1b365d] text-white px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold">
          <span id="dialog-title">{title}</span>
          <button
            onClick={onCancel}
            className="btn-classic text-[10px] py-0 px-1 text-black font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 text-xs font-sans text-[#1a1a1a]">
          <p className="leading-relaxed mb-4">{message}</p>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#cccccc]">
            <button
              type="button"
              onClick={onCancel}
              className="btn-classic"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={isDestructive ? 'btn-classic-danger' : 'btn-classic-primary'}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
