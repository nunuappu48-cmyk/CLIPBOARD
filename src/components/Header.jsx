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
        <div className="flex items-center gap-2 text-xs">
          {isInRoom && (
            <>
              {timeRemaining && (
                <div
                  className={`hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono border ${
                    isExpiringSoon
                      ? 'bg-[#551a1a] text-[#ffcccc] border-[#882222]'
                      : 'bg-[#0f223d] text-[#c2d7f2] border-[#2f4f75]'
                  }`}
                  title="Session auto-expires 24 hours after last activity"
                >
                  <span>Expires: {timeRemaining}</span>
                </div>
              )}

              <Link
                to="/"
                className="btn-classic text-xs"
              >
                [+ New Room]
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
