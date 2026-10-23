import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Check,
  Code2,
  Type,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { formatTimeAgo } from '../lib/validation';
import { ConfirmDialog } from './ConfirmDialog';

export function SplitTextClipboard({
  userSlot, // 'user1' | 'user2'
  user1Text,
  user2Text,
  user1UpdatedAt,
  user2UpdatedAt,
  user1Online = true,
  user2Online = false,
  _saveStatus,
  maxCharacters,
  onUser1Change,
  onUser2Change,
  onClearUser,
  onTransferText,
  onCopy,
}) {
  const [user1Monospace, setUser1Monospace] = useState(false);
  const [user2Monospace, setUser2Monospace] = useState(false);
  const [confirmClearSlot, setConfirmClearSlot] = useState(null); // 'user1' | 'user2' | null
  const [copiedSlot, setCopiedSlot] = useState(null);

  const handleCopySlot = (slot, text) => {
    onCopy(text, `User ${slot === 'user1' ? '1' : '2'} text`);
    setCopiedSlot(slot);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const isUser1 = userSlot === 'user1';
  const isUser2 = userSlot === 'user2';

  return (
    <div className="flex flex-col gap-4">
      {/* Split Screen Grid (User 1 Left, User 2 Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ========================================================= */}
        {/* PANEL 1: USER 1 CLIPBOARD */}
        {/* ========================================================= */}
        <div
          className={`bg-white rounded-3xl border transition-all flex flex-col h-[520px] sm:h-[580px] overflow-hidden shadow-xs ${
            isUser1
              ? 'border-blue-300 ring-4 ring-blue-500/5'
              : 'border-slate-200/90'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                U1
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-800">User 1 Clipboard</span>
                  {isUser1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      You
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Friend
                    </span>
                  )}
                </div>

                {/* Status line */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${user1Online ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span>{user1Online ? 'Online' : 'Offline'}</span>
                  </span>
                  {user1UpdatedAt && (
                    <span>• {formatTimeAgo(user1UpdatedAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions for User 1 */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setUser1Monospace(!user1Monospace)}
                className={`p-1.5 sm:p-2 rounded-xl text-xs font-medium border transition-colors ${
                  user1Monospace
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle code/plain font"
              >
                {user1Monospace ? <Code2 className="w-3.5 h-3.5 text-blue-600" /> : <Type className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleCopySlot('user1', user1Text)}
                className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium border transition-all ${
                  copiedSlot === 'user1'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Copy text"
              >
                {copiedSlot === 'user1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copiedSlot === 'user1' ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmClearSlot('user1')}
                disabled={!user1Text}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                title="Clear User 1 text"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Transfer Banner (When User 2 views User 1) */}
          {isUser2 && user1Text && (
            <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800">
              <span className="truncate">User 1 shared text with you!</span>
              <button
                type="button"
                onClick={() => onTransferText('user1', 'user2')}
                className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition-all shrink-0"
              >
                <span>Paste in My Screen</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Editor / Live Area */}
          <div className="relative flex-1 p-4 sm:p-5 flex flex-col bg-white">
            <textarea
              value={user1Text}
              onChange={(e) => onUser1Change(e.target.value)}
              placeholder={
                isUser1
                  ? "User 1: Type or paste anything here... User 2 will see it live on their screen in real time!"
                  : "Waiting for User 1 to paste or type text... Everything they type will appear here live."
              }
              className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed ${
                user1Monospace ? 'font-mono text-[13px] leading-6' : 'font-sans'
              }`}
              spellCheck={false}
            />
          </div>

          {/* Footer Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              {user1Text.length.toLocaleString()} / {maxCharacters.toLocaleString()} chars
            </span>
            <div className="flex items-center gap-2">
              {isUser1 && (
                <span className="text-blue-600 font-medium hidden sm:inline">
                  Your Active Screen (User 1)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL 2: USER 2 CLIPBOARD */}
        {/* ========================================================= */}
        <div
          className={`bg-white rounded-3xl border transition-all flex flex-col h-[520px] sm:h-[580px] overflow-hidden shadow-xs ${
            isUser2
              ? 'border-indigo-300 ring-4 ring-indigo-500/5'
              : 'border-slate-200/90'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                U2
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-800">User 2 Clipboard</span>
                  {isUser2 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      You
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Friend
                    </span>
                  )}
                </div>

                {/* Status line */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${user2Online ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                    <span>{user2Online ? 'Online' : 'Waiting to join...'}</span>
                  </span>
                  {user2UpdatedAt && (
                    <span>• {formatTimeAgo(user2UpdatedAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions for User 2 */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setUser2Monospace(!user2Monospace)}
                className={`p-1.5 sm:p-2 rounded-xl text-xs font-medium border transition-colors ${
                  user2Monospace
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle code/plain font"
              >
                {user2Monospace ? <Code2 className="w-3.5 h-3.5 text-indigo-600" /> : <Type className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleCopySlot('user2', user2Text)}
                className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium border transition-all ${
                  copiedSlot === 'user2'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Copy text"
              >
                {copiedSlot === 'user2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="hidden sm:inline">{copiedSlot === 'user2' ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmClearSlot('user2')}
                disabled={!user2Text}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                title="Clear User 2 text"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Transfer Banner (When User 1 views User 2) */}
          {isUser1 && user2Text && (
            <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-800">
              <span className="truncate">User 2 shared text with you!</span>
              <button
                type="button"
                onClick={() => onTransferText('user2', 'user1')}
                className="flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-all shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Paste in My Screen</span>
              </button>
            </div>
          )}

          {/* Editor / Live Area */}
          <div className="relative flex-1 p-4 sm:p-5 flex flex-col bg-white">
            <textarea
              value={user2Text}
              onChange={(e) => onUser2Change(e.target.value)}
              placeholder={
                isUser2
                  ? "User 2: Type or paste anything here... User 1 will see it live on their screen in real time!"
                  : "Waiting for User 2 to join and paste or type text... Share your room link so they can connect."
              }
              className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed ${
                user2Monospace ? 'font-mono text-[13px] leading-6' : 'font-sans'
              }`}
              spellCheck={false}
            />
          </div>

          {/* Footer Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              {user2Text.length.toLocaleString()} / {maxCharacters.toLocaleString()} chars
            </span>
            <div className="flex items-center gap-2">
              {isUser2 && (
                <span className="text-indigo-600 font-medium hidden sm:inline">
                  Your Active Screen (User 2)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing */}
      <ConfirmDialog
        isOpen={Boolean(confirmClearSlot)}
        title={`Clear User ${confirmClearSlot === 'user1' ? '1' : '2'} Clipboard?`}
        message={`Are you sure you want to clear the clipboard for User ${confirmClearSlot === 'user1' ? '1' : '2'}? Both users will see this screen cleared.`}
        confirmLabel="Clear Screen"
        cancelLabel="Keep Content"
        isDestructive={true}
        onConfirm={() => {
          if (confirmClearSlot) {
            onClearUser(confirmClearSlot);
            setConfirmClearSlot(null);
          }
        }}
        onCancel={() => setConfirmClearSlot(null)}
      />
    </div>
  );
}
