import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-lg shadow-emerald-500/5',
    error: 'bg-white border-rose-200 text-slate-800 shadow-lg shadow-rose-500/5',
    warning: 'bg-white border-amber-200 text-slate-800 shadow-lg shadow-amber-500/5',
    info: 'bg-white border-blue-200 text-slate-800 shadow-lg shadow-blue-500/5',
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
        bgStyles[toast.type || 'info']
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        {icons[toast.type || 'info']}
        <span className="truncate">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
