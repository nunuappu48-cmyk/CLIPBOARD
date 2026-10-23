import React, { useState } from 'react';
import { formatTimeAgo } from '../lib/validation';
import { ConfirmDialog } from './ConfirmDialog';

export function TextClipboard({
  text,
  saveStatus,
  characterCount,
  maxCharacters,
  updatedAt,
  onChange,
  onClear,
  onCopy,
}) {
  const [isMonospace, setIsMonospace] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabels = {
    saved: '[SAVED]',
    saving: '[SAVING...]',
    syncing: '[SYNCING...]',
    error: '[ERROR SAVING]',
  };

  return (
    <div className="panel-box flex flex-col h-[520px] sm:h-[560px]">
      {/* Editor Header Bar */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs">SHARED CLIPBOARD</span>
          <span className="font-mono text-xs text-[#3c763d]">{statusLabels[saveStatus] || '[SAVED]'}</span>
          {updatedAt && (
            <span className="text-[11px] font-mono text-[#666666]">
              • {formatTimeAgo(updatedAt).toUpperCase()}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMonospace(!isMonospace)}
            className="btn-classic text-xs"
          >
            {isMonospace ? 'Font: Mono' : 'Font: Sans'}
          </button>

          <button
            type="button"
            onClick={handleCopyClick}
            className="btn-classic text-xs"
          >
            {copied ? '[ Copied ]' : '[ Copy ]'}
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={!text}
            className="btn-classic-danger text-xs"
          >
            [ Clear ]
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative flex-1 p-2 bg-[#ffffff] flex flex-col">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type or paste text, notes, code snippets, or URLs here. Real-time synchronization active."
          className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-[#1a1a1a] p-2 border border-[#d8d8d4] text-xs leading-relaxed ${
            isMonospace ? 'font-mono' : 'font-sans'
          }`}
          spellCheck={false}
        />
      </div>

      {/* Footer Bar */}
      <div className="px-3 py-1.5 bg-[#ece9d8] border-t border-[#999999] flex items-center justify-between text-[11px] font-mono text-[#444444]">
        <span>
          CHARS: {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}
        </span>
        <span>Ctrl+V supported</span>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="CLEAR SHARED CLIPBOARD?"
        message="Are you sure you want to delete all text from this shared clipboard? Content will be cleared for all participants immediately."
        confirmLabel="Clear Text"
        cancelLabel="Keep Content"
        isDestructive={true}
        onConfirm={onClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
