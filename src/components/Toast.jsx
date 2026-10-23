import React, { useEffect } from 'react';

export function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="w-full bg-[#fcf8e3] border-b border-[#faebcc] text-[#8a6d3b] text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-col gap-1">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
        ))}
      </div>
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const styles = {
    success: 'bg-[#dff0d8] border-[#d6e9c6] text-[#3c763d]',
    error: 'bg-[#f2dede] border-[#ebccd1] text-[#a94442]',
    warning: 'bg-[#fcf8e3] border-[#faebcc] text-[#8a6d3b]',
    info: 'bg-[#d9edf7] border-[#bce8f1] text-[#31708f]',
  };

  const prefixes = {
    success: '[SUCCESS]',
    error: '[ERROR]',
    warning: '[WARN]',
    info: '[NOTICE]',
  };

  const type = toast.type || 'info';

  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 px-3 py-1.5 border font-mono text-xs ${styles[type]}`}
    >
      <div className="flex items-center gap-2">
        <strong className="font-bold">{prefixes[type]}</strong>
        <span>{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="btn-classic text-[11px] py-0 px-1.5"
        aria-label="Dismiss message"
      >
        [x]
      </button>
    </div>
  );
}
