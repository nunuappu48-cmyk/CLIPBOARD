import React, { useState } from 'react';
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
    <div className="flex flex-col gap-3">
      {/* Dual Split Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        {/* ========================================================= */}
        {/* PANE 1: USER 1 (HOST / CREATOR) */}
        {/* ========================================================= */}
        <div
          className={`panel-box flex flex-col h-[520px] sm:h-[580px] ${isUser1
              ? 'border-2 border-[#1b365d]'
              : 'border border-[#999999] bg-[#f9f9f7]'
            }`}
        >
          {/* Header Bar */}
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold bg-[#1b365d] text-white px-1.5 py-0.5 text-xs">
                PANE 1
              </span>

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
                    placeholder="Name"
                    maxLength={25}
                    className="input-classic text-xs py-0.5 px-1 font-bold"
                  />
                  <button type="submit" className="btn-classic text-xs py-0.5 px-1.5">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNameSlot(null)}
                    className="btn-classic text-xs py-0.5 px-1"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#1a1a1a]">
                    {user1Name}
                  </span>
                  {isUser1 && (
                    <button
                      type="button"
                      onClick={() => handleStartEditName('user1', user1Name)}
                      className="text-[#003399] hover:underline text-[11px] font-mono cursor-pointer"
                      title="Rename"
                    >
                      [Rename]
                    </button>
                  )}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 border ${isUser1
                        ? 'bg-[#dff0d8] border-[#3c763d] text-[#3c763d]'
                        : 'bg-[#eeeeee] border-[#999999] text-[#666666]'
                      }`}
                  >
                    {isUser1 ? 'YOU' : 'READ-ONLY'}
                  </span>
                </div>
              )}
            </div>

            {/* Pane 1 Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setUser1Monospace(!user1Monospace)}
                className="btn-classic text-xs"
                title="Toggle font display"
              >
                {user1Monospace ? 'Font: Mono' : 'Font: Sans'}
              </button>

              <button
                type="button"
                onClick={() => handleCopySlot('user1', user1Text)}
                className="btn-classic text-xs"
              >
                {copiedSlot === 'user1' ? '[ Copied ]' : '[ Copy ]'}
              </button>

              {isUser1 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearSlot('user1')}
                  disabled={!user1Text}
                  className="btn-classic-danger text-xs"
                >
                  [ Clear ]
                </button>
              )}
            </div>
          </div>

          {/* Subheader: Connection & update time */}
          <div className="px-3 py-1 bg-[#ece9d8] border-b border-[#cccccc] flex items-center justify-between text-[11px] font-mono text-[#555555]">
            <span>
              STATUS: {user1Online ? 'ONLINE' : 'OFFLINE'}
              {user1UpdatedAt && ` • MODIFIED: ${formatTimeAgo(user1UpdatedAt).toUpperCase()}`}
            </span>
            <span>SLOT: USER 1 (HOST)</span>
          </div>

          {/* Transfer banner (visible to User 2 if User 1 typed) */}
          {isUser2 && user1Text && (
            <div className="px-3 py-1.5 bg-[#eaf2fd] border-b border-[#b8d4f7] flex items-center justify-between text-xs font-mono text-[#1b365d]">
              <span>{user1Name} updated content</span>
              <button
                type="button"
                onClick={() => onTransferText('user1', 'user2')}
                className="btn-classic text-xs"
              >
                [ Copy to My Screen -&gt; ]
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="relative flex-1 p-2 bg-[#ffffff] flex flex-col">
            <textarea
              value={user1Text}
              onChange={(e) => {
                if (isUser1) onUser1Change(e.target.value);
              }}
              readOnly={!isUser1}
              placeholder={
                isUser1
                  ? "Type or paste text here (Ctrl+V supported). Peer sees this screen synchronized in real time."
                  : `Waiting for ${user1Name} to input text... Everything appears here live (Read-only mode).`
              }
              className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-[#1a1a1a] p-2 border border-[#d8d8d4] text-xs leading-relaxed ${user1Monospace ? 'font-mono' : 'font-sans'
                } ${!isUser1 ? 'cursor-default select-text bg-[#fcfcfa]' : 'bg-[#ffffff]'}`}
              spellCheck={false}
            />
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-1.5 bg-[#ece9d8] border-t border-[#999999] flex items-center justify-between text-[11px] font-mono text-[#444444]">
            <span>
              CHARS: {user1Text.length.toLocaleString()} / {maxCharacters.toLocaleString()}
            </span>
            <span>
              {isUser1 ? 'ACCESS: READ/WRITE' : `ACCESS: LOCKED TO ${user1Name.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANE 2: USER 2 (GUEST) */}
        {/* ========================================================= */}
        <div
          className={`panel-box flex flex-col h-[520px] sm:h-[580px] ${isUser2
              ? 'border-2 border-[#1b365d]'
              : 'border border-[#999999] bg-[#f9f9f7]'
            }`}
        >
          {/* Header Bar */}
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold bg-[#3d5a45] text-white px-1.5 py-0.5 text-xs">
                PANE 2
              </span>

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
                    placeholder="Name"
                    maxLength={25}
                    className="input-classic text-xs py-0.5 px-1 font-bold"
                  />
                  <button type="submit" className="btn-classic text-xs py-0.5 px-1.5">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNameSlot(null)}
                    className="btn-classic text-xs py-0.5 px-1"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#1a1a1a]">
                    {user2Name}
                  </span>
                  {isUser2 && (
                    <button
                      type="button"
                      onClick={() => handleStartEditName('user2', user2Name)}
                      className="text-[#003399] hover:underline text-[11px] font-mono cursor-pointer"
                      title="Rename"
                    >
                      [Rename]
                    </button>
                  )}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 border ${isUser2
                        ? 'bg-[#dff0d8] border-[#3c763d] text-[#3c763d]'
                        : 'bg-[#eeeeee] border-[#999999] text-[#666666]'
                      }`}
                  >
                    {isUser2 ? 'YOU' : 'READ-ONLY'}
                  </span>
                </div>
              )}
            </div>

            {/* Pane 2 Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setUser2Monospace(!user2Monospace)}
                className="btn-classic text-xs"
                title="Toggle font display"
              >
                {user2Monospace ? 'Font: Mono' : 'Font: Sans'}
              </button>

              <button
                type="button"
                onClick={() => handleCopySlot('user2', user2Text)}
                className="btn-classic text-xs"
              >
                {copiedSlot === 'user2' ? '[ Copied ]' : '[ Copy ]'}
              </button>

              {isUser2 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearSlot('user2')}
                  disabled={!user2Text}
                  className="btn-classic-danger text-xs"
                >
                  [ Clear ]
                </button>
              )}
            </div>
          </div>

          {/* Subheader: Connection & update time */}
          <div className="px-3 py-1 bg-[#ece9d8] border-b border-[#cccccc] flex items-center justify-between text-[11px] font-mono text-[#555555]">
            <span>
              STATUS: {user2Online ? 'ONLINE' : 'AWAITING PEER JOIN...'}
              {user2UpdatedAt && ` • MODIFIED: ${formatTimeAgo(user2UpdatedAt).toUpperCase()}`}
            </span>
            <span>SLOT: USER 2 (GUEST)</span>
          </div>

          {/* Transfer banner (visible to User 1 if User 2 typed) */}
          {isUser1 && user2Text && (
            <div className="px-3 py-1.5 bg-[#eaf2fd] border-b border-[#b8d4f7] flex items-center justify-between text-xs font-mono text-[#1b365d]">
              <span>{user2Name} updated content</span>
              <button
                type="button"
                onClick={() => onTransferText('user2', 'user1')}
                className="btn-classic text-xs"
              >
                [ &lt;- Copy to My Screen ]
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="relative flex-1 p-2 bg-[#ffffff] flex flex-col">
            <textarea
              value={user2Text}
              onChange={(e) => {
                if (isUser2) onUser2Change(e.target.value);
              }}
              readOnly={!isUser2}
              placeholder={
                isUser2
                  ? "Type or paste text here (Ctrl+V supported). Peer sees this screen synchronized in real time."
                  : `Waiting for ${user2Name} to join and type... Everything appears here live (Read-only mode).`
              }
              className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-[#1a1a1a] p-2 border border-[#d8d8d4] text-xs leading-relaxed ${user2Monospace ? 'font-mono' : 'font-sans'
                } ${!isUser2 ? 'cursor-default select-text bg-[#fcfcfa]' : 'bg-[#ffffff]'}`}
              spellCheck={false}
            />
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-1.5 bg-[#ece9d8] border-t border-[#999999] flex items-center justify-between text-[11px] font-mono text-[#444444]">
            <span>
              CHARS: {user2Text.length.toLocaleString()} / {maxCharacters.toLocaleString()}
            </span>
            <span>
              {isUser2 ? 'ACCESS: READ/WRITE' : `ACCESS: LOCKED TO ${user2Name.toUpperCase()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing */}
      <ConfirmDialog
        isOpen={Boolean(confirmClearSlot)}
        title={`CLEAR ${confirmClearSlot === 'user1' ? user1Name.toUpperCase() : user2Name.toUpperCase()}'S SCREEN?`}
        message="Are you sure you want to delete all text from this screen? The text will be cleared for both connected participants immediately."
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
