import React from 'react';
import { Link } from 'react-router-dom';

export function Header({
  timeRemaining,
  isExpiringSoon,
  isInRoom = false,
}) {
  return (
    <header className="w-full bg-[#1b365d] text-white border-b border-[#0f223d]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white hover:text-[#d0e1fd] no-underline focus:outline-none"
        >
          <span className="font-bold text-sm sm:text-base tracking-wider uppercase font-mono bg-[#0f223d] px-2 py-0.5 border border-[#3b5982]">
            QUICKCLIP
          </span>
        </Link>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {isInRoom && (
            <>
              {timeRemaining && (
                <div
                  className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-mono border shrink-0 ${
                    isExpiringSoon
                      ? 'bg-[#551a1a] text-[#ffcccc] border-[#882222]'
                      : 'bg-[#0f223d] text-[#c2d7f2] border-[#2f4f75]'
                  }`}
                  title="Session auto-expires 24 hours after last activity"
                >
                  <span className="hidden sm:inline">Expires: {timeRemaining}</span>
                  <span className="inline sm:hidden">⏳ {timeRemaining}</span>
                </div>
              )}

              <Link
                to="/"
                className="btn-classic text-xs shrink-0 py-1 sm:py-1 px-2 sm:px-2.5"
                title="Create a new shared session"
              >
                <span className="hidden sm:inline">[+ New Room]</span>
                <span className="inline sm:hidden">[+ New]</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
