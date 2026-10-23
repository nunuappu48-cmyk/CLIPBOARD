import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function NotFound({ onToast }) {
  return (
    <div className="min-h-screen bg-[#f0f0eb] flex flex-col text-[#1a1a1a]">
      <Header isInRoom={false} onToast={onToast} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="panel-box max-w-md w-full">
          <div className="panel-header-navy">
            <span>ERROR 404 — PAGE NOT FOUND</span>
          </div>
          <div className="p-4 bg-[#ffffff] text-xs">
            <p className="font-bold text-[#1a1a1a] mb-2 font-mono">
              HTTP 404: The requested resource was not found on this server.
            </p>
            <p className="text-[#555555] mb-4 font-mono leading-relaxed">
              The URL might be misspelled, expired, or removed. Verify your room code and try again.
            </p>
            <div className="pt-3 border-t border-[#cccccc] flex justify-end">
              <Link
                to="/"
                className="btn-classic-primary text-xs"
              >
                [ &lt;- Return to QuickClip Home ]
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
