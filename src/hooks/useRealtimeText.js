import { useState, useEffect, useRef, useCallback } from 'react';
import { QuickClipApi } from '../lib/supabase';
import { MAX_TEXT_LENGTH } from '../lib/validation';

export function useRealtimeText({
  roomId,
  token,
  initialText = '',
  initialVersion = 1,
  initialUpdatedAt = null,
  participantId,
  onToast,
}) {
  const [text, setText] = useState(initialText);
  const [version, setVersion] = useState(initialVersion);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'syncing' | 'error'

  // References for debouncing and loop prevention
  const debounceTimerRef = useRef(null);
  const isLocalEditRef = useRef(false);
  const pendingTextRef = useRef(initialText);
  const currentVersionRef = useRef(initialVersion);

  // Sync state if initial values change on room load
  useEffect(() => {
    if (initialText !== undefined && !isLocalEditRef.current) {
      setText(initialText);
      pendingTextRef.current = initialText;
    }
    if (initialVersion !== undefined) {
      setVersion(initialVersion);
      currentVersionRef.current = initialVersion;
    }
    if (initialUpdatedAt) {
      setUpdatedAt(initialUpdatedAt);
    }
  }, [initialText, initialVersion, initialUpdatedAt]);

  // Persist text to database
  const persistText = useCallback(
    async (textToSave) => {
      if (!roomId || !token) return;

      try {
        setSaveStatus('saving');
        const res = await QuickClipApi.updateText(
          roomId,
          token,
          textToSave,
          currentVersionRef.current
        );

        if (res && res.success) {
          setSaveStatus('saved');
          if (res.version) {
            setVersion(res.version);
            currentVersionRef.current = res.version;
          }
          if (res.updated_at) {
            setUpdatedAt(res.updated_at);
          }
        } else {
          setSaveStatus('error');
          if (onToast) {
            onToast('Failed to save text to database', 'error');
          }
        }
      } catch (err) {
        console.error('Text save error:', err);
        setSaveStatus('error');
        if (onToast) {
          onToast(err.message || 'Error saving changes', 'error');
        }
      } finally {
        isLocalEditRef.current = false;
      }
    },
    [roomId, token, onToast]
  );

  // Handle local user typing
  const handleTextChange = useCallback(
    (newText) => {
      // Enforce 50,000 character maximum
      if (newText.length > MAX_TEXT_LENGTH) {
        if (onToast) {
          onToast(`Maximum text limit reached (${MAX_TEXT_LENGTH.toLocaleString()} characters)`, 'warning');
        }
        newText = newText.substring(0, MAX_TEXT_LENGTH);
      }

      isLocalEditRef.current = true;
      setText(newText);
      pendingTextRef.current = newText;
      setSaveStatus('saving');

      // 1. Broadcast immediate typing preview to other connected peers
      QuickClipApi.broadcastEvent(roomId, 'text-typing', {
        text: newText,
        senderId: participantId,
        timestamp: Date.now(),
      }).catch(() => {});

      // 2. Debounce persistence to database (400ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        persistText(newText);
      }, 400);
    },
    [roomId, participantId, persistText, onToast]
  );

  // Clear text
  const handleClearText = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    isLocalEditRef.current = true;
    setText('');
    pendingTextRef.current = '';
    setSaveStatus('saving');

    try {
      const res = await QuickClipApi.clearText(roomId, token);
      if (res && res.success) {
        setSaveStatus('saved');
        if (res.version) {
          setVersion(res.version);
          currentVersionRef.current = res.version;
        }
        if (res.updated_at) {
          setUpdatedAt(res.updated_at);
        }
        // Broadcast clear to peers
        QuickClipApi.broadcastEvent(roomId, 'text-typing', {
          text: '',
          senderId: participantId,
          timestamp: Date.now(),
        }).catch(() => {});

        if (onToast) {
          onToast('Clipboard text cleared', 'success');
        }
      }
    } catch (err) {
      setSaveStatus('error');
      if (onToast) {
        onToast('Failed to clear text: ' + err.message, 'error');
      }
    } finally {
      isLocalEditRef.current = false;
    }
  }, [roomId, token, participantId, onToast]);

  // Copy text to clipboard
  const handleCopyText = useCallback(async () => {
    if (!text) {
      if (onToast) onToast('Clipboard is empty', 'info');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (onToast) {
        onToast('Text copied to clipboard!', 'success');
      }
    } catch {
      if (onToast) {
        onToast('Failed to copy to clipboard', 'error');
      }
    }
  }, [text, onToast]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Set remote text update received from peer (called by room subscription)
  const applyRemoteUpdate = useCallback(
    (remoteData) => {
      // Ignore updates originated by this same tab/client
      if (remoteData.senderId === participantId) {
        return;
      }

      // If user is actively typing right now, don't overwrite if local changes are pending
      if (isLocalEditRef.current) {
        return;
      }

      setText((prev) => {
        if (prev === remoteData.text) return prev;
        return remoteData.text || '';
      });

      pendingTextRef.current = remoteData.text || '';

      if (remoteData.version) {
        setVersion(remoteData.version);
        currentVersionRef.current = remoteData.version;
      }

      if (remoteData.updated_at || remoteData.updatedAt) {
        setUpdatedAt(remoteData.updated_at || remoteData.updatedAt);
      }

      setSaveStatus('saved');
    },
    [participantId]
  );

  return {
    text,
    version,
    updatedAt,
    saveStatus,
    characterCount: text.length,
    maxCharacters: MAX_TEXT_LENGTH,
    handleTextChange,
    handleClearText,
    handleCopyText,
    applyRemoteUpdate,
  };
}
