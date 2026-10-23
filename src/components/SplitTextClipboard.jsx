import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Check,
  Code2,
  Type,
  ArrowRight,
  ArrowLeft,
  Pencil,
  X,
  Lock,
} from 'lucide-react';
import { formatTimeAgo } from '../lib/validation';
import { ConfirmDialog } from './ConfirmDialog';

export function SplitTextClipboard({
  userSlot, // 'user1' | 'user2'
  user1Text,
  user2Text,
  user1Name = 'User 1',
  user2Name = 'User 2',
  user1UpdatedAt,
  user2UpdatedAt,
  user1Online = true,
  user2Online = false,
  _saveStatus,
  maxCharacters,
  onUser1Change,
  onUser2Change,
  onUser1NameChange,
  onUser2NameChange,
  onClearUser,
  onTransferText,
  onCopy,
}) {
  const [user1Monospace, setUser1Monospace] = useState(false);
  const [user2Monospace, setUser2Monospace] = useState(false);
  const [confirmClearSlot, setConfirmClearSlot] = useState(null);
  const [copiedSlot, setCopiedSlot] = useState(null);

  // Inline name editing state
  const [editingNameSlot, setEditingNameSlot] = useState(null); // 'user1' | 'user2' | null
  const [nameInput, setNameInput] = useState('');

  const isUser1 = userSlot === 'user1';
  const isUser2 = userSlot === 'user2';

  const handleCopySlot = (slot, text) => {
    const label = slot === 'user1' ? `${user1Name}'s text` : `${user2Name}'s text`;
    onCopy(text, label);
    setCopiedSlot(slot);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const handleStartEditName = (slot, currentName) => {
    setEditingNameSlot(slot);
    setNameInput(currentName);
  };

  const handleSaveName = (slot) => {
    if (slot === 'user1') {
      onUser1NameChange(nameInput);
    } else {
      onUser2NameChange(nameInput);
    }
    setEditingNameSlot(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Split Screen Grid (User 1 Left, User 2 Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ========================================================= */}
        {/* PANEL 1: USER 1 SCREEN */}
        {/* ========================================================= */}
        <div
          className={`bg-white rounded-3xl border transition-all flex flex-col h-[520px] sm:h-[580px] overflow-hidden shadow-xs ${
            isUser1
              ? 'border-blue-400 ring-4 ring-blue-500/10'
              : 'border-slate-200/90 bg-slate-50/30'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                U1
              </div>

              <div className="flex flex-col">
                {/* Editable / Display Name */}
                <div className="flex items-center gap-1.5">
                  {editingNameSlot === 'user1' ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveName('user1');
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your name"
                        maxLength={25}
                        className="px-2 py-0.5 rounded-lg border border-blue-400 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Save name"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNameSlot(null)}
                        className="p-1 rounded text-slate-400 hover:bg-slate-200"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                        {user1Name}
                      </span>
                      {isUser1 && (
                        <button
                          type="button"
                          onClick={() => handleStartEditName('user1', user1Name)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit your name"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {isUser1 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      You (Can Edit)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      <Lock className="w-2.5 h-2.5" />
                      Read-only
                    </span>
                  )}
                </div>

                {/* Status line */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
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
                title="Toggle font"
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

              {/* Clear button only visible to the owner of this screen */}
              {isUser1 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearSlot('user1')}
                  disabled={!user1Text}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                  title="Clear my screen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Transfer button for User 2 */}
          {isUser2 && user1Text && (
            <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <span className="truncate">{user1Name} shared text with you</span>
              <button
                type="button"
                onClick={() => onTransferText('user1', 'user2')}
                className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition-all shrink-0 cursor-pointer"
              >
                <span>Copy to My Screen</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Editor / Live View */}
          <div className="relative flex-1 p-4 sm:p-5 flex flex-col bg-white">
            <textarea
              value={user1Text}
              onChange={(e) => {
                if (isUser1) onUser1Change(e.target.value);
              }}
              readOnly={!isUser1}
              placeholder={
                isUser1
                  ? "Your Screen: Type, paste text, or drop screenshots (Ctrl+V)... Your friend sees this screen in real time!"
                  : `Waiting for ${user1Name} to paste or type... Everything they write appears here live (Read-only for you).`
              }
              className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed ${
                user1Monospace ? 'font-mono text-[13px] leading-6' : 'font-sans'
              } ${!isUser1 ? 'cursor-default select-text' : ''}`}
              spellCheck={false}
            />
          </div>

          {/* Footer Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              {user1Text.length.toLocaleString()} / {maxCharacters.toLocaleString()} chars
            </span>
            <div className="flex items-center gap-2">
              {isUser1 ? (
                <span className="text-blue-600 font-semibold text-[11px]">
                  ✍️ You have edit access
                </span>
              ) : (
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Controlled by {user1Name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL 2: USER 2 SCREEN */}
        {/* ========================================================= */}
        <div
          className={`bg-white rounded-3xl border transition-all flex flex-col h-[520px] sm:h-[580px] overflow-hidden shadow-xs ${
            isUser2
              ? 'border-indigo-400 ring-4 ring-indigo-500/10'
              : 'border-slate-200/90 bg-slate-50/30'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                U2
              </div>

              <div className="flex flex-col">
                {/* Editable / Display Name */}
                <div className="flex items-center gap-1.5">
                  {editingNameSlot === 'user2' ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveName('user2');
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your name"
                        maxLength={25}
                        className="px-2 py-0.5 rounded-lg border border-indigo-400 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        title="Save name"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNameSlot(null)}
                        className="p-1 rounded text-slate-400 hover:bg-slate-200"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                        {user2Name}
                      </span>
                      {isUser2 && (
                        <button
                          type="button"
                          onClick={() => handleStartEditName('user2', user2Name)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit your name"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {isUser2 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      You (Can Edit)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      <Lock className="w-2.5 h-2.5" />
                      Read-only
                    </span>
                  )}
                </div>

                {/* Status line */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${user2Online ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
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
                title="Toggle font"
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

              {/* Clear button only visible to the owner of this screen */}
              {isUser2 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearSlot('user2')}
                  disabled={!user2Text}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                  title="Clear my screen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Transfer button for User 1 */}
          {isUser1 && user2Text && (
            <div className="px-4 py-2 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
              <span className="truncate">{user2Name} shared text with you</span>
              <button
                type="button"
                onClick={() => onTransferText('user2', 'user1')}
                className="flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-all shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Copy to My Screen</span>
              </button>
            </div>
          )}

          {/* Editor / Live View */}
          <div className="relative flex-1 p-4 sm:p-5 flex flex-col bg-white">
            <textarea
              value={user2Text}
              onChange={(e) => {
                if (isUser2) onUser2Change(e.target.value);
              }}
              readOnly={!isUser2}
              placeholder={
                isUser2
                  ? "Your Screen: Type, paste text, or drop screenshots (Ctrl+V)... Your friend sees this screen in real time!"
                  : `Waiting for ${user2Name} to join and write... Everything they write appears here live (Read-only for you).`
              }
              className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed ${
                user2Monospace ? 'font-mono text-[13px] leading-6' : 'font-sans'
              } ${!isUser2 ? 'cursor-default select-text' : ''}`}
              spellCheck={false}
            />
          </div>

          {/* Footer Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              {user2Text.length.toLocaleString()} / {maxCharacters.toLocaleString()} chars
            </span>
            <div className="flex items-center gap-2">
              {isUser2 ? (
                <span className="text-indigo-600 font-semibold text-[11px]">
                  ✍️ You have edit access
                </span>
              ) : (
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Controlled by {user2Name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing */}
      <ConfirmDialog
        isOpen={Boolean(confirmClearSlot)}
        title={`Clear ${confirmClearSlot === 'user1' ? user1Name : user2Name}'s Screen?`}
        message="Are you sure you want to clear this screen? Both users will see the text cleared immediately."
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
