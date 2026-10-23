import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Check,
  Clock,
  Code2,
  Type,
  FileText,
  AlertCircle,
} from 'lucide-react';
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

  const statusIndicators = {
    saved: (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Saved
      </span>
    ),
    saving: (
      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        Saving...
      </span>
    ),
    syncing: (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
        Syncing...
      </span>
    ),
    error: (
      <span className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
        Error saving
      </span>
    ),
  };

  const percentageUsed = Math.min(100, Math.round((characterCount / maxCharacters) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] sm:h-[560px] overflow-hidden transition-all">
      {/* Editor Header Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Shared Clipboard</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Status Indicator */}
          <div>{statusIndicators[saveStatus] || statusIndicators.saved}</div>

          {/* Last updated timestamp */}
          {updatedAt && (
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Monospace / Sans Toggle */}
          <button
            type="button"
            onClick={() => setIsMonospace(!isMonospace)}
            className={`p-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1 ${
              isMonospace
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={isMonospace ? 'Switch to Sans font' : 'Switch to Monospace font (ideal for code)'}
          >
            {isMonospace ? <Code2 className="w-3.5 h-3.5 text-blue-600" /> : <Type className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMonospace ? 'Code' : 'Plain'}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              copied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={!text}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Clear clipboard text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative flex-1 p-4 sm:p-5 flex flex-col">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type or paste any text, notes, code snippets, or links here... Everything syncs across connected friends instantly."
          className={`w-full flex-1 resize-none bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed ${
            isMonospace ? 'font-mono text-[13px] leading-6' : 'font-sans'
          }`}
          spellCheck={false}
        />
      </div>

      {/* Editor Footer Bar */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>
            {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
          </span>
          {percentageUsed >= 90 && (
            <span className="text-amber-600 font-medium">({percentageUsed}% used)</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">
            Paste screenshots directly with <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded">Ctrl+V</kbd>
          </span>
        </div>
      </div>

      {/* Confirmation modal for clearing text */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Shared Clipboard?"
        message="Are you sure you want to delete all text from this shared clipboard? This will immediately clear the content for all participants in the room."
        confirmLabel="Clear Text"
        cancelLabel="Keep Text"
        isDestructive={true}
        onConfirm={onClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
