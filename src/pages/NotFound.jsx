import React from 'react';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function NotFound({ onToast }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header isInRoom={false} onToast={onToast} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl font-mono">
            404
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Back to QuickClip Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
