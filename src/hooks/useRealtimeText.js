import { useState, useEffect, useRef, useCallback } from 'react';
import { QuickClipApi } from '../lib/supabase';
import { MAX_TEXT_LENGTH } from '../lib/validation';

export function parseRoomText(rawText) {
  if (!rawText) {
    return {
      user1: '',
      user2: '',
      user1Name: 'User 1',
      user2Name: 'User 2',
      user1UpdatedAt: null,
      user2UpdatedAt: null,
    };
  }
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && (typeof parsed.user1 === 'string' || typeof parsed.user2 === 'string')) {
      return {
        user1: parsed.user1 || '',
        user2: parsed.user2 || '',
        user1Name: parsed.user1Name || 'User 1',
        user2Name: parsed.user2Name || 'User 2',
        user1UpdatedAt: parsed.user1UpdatedAt || null,
        user2UpdatedAt: parsed.user2UpdatedAt || null,
      };
    }
  } catch {
    // Legacy plain text treated as user1
  }
  return {
    user1: rawText,
    user2: '',
    user1Name: 'User 1',
    user2Name: 'User 2',
    user1UpdatedAt: null,
    user2UpdatedAt: null,
  };
}

export function serializeRoomText(user1, user2, user1Name, user2Name, user1UpdatedAt, user2UpdatedAt) {
  return JSON.stringify({
    user1: user1 || '',
    user2: user2 || '',
    user1Name: user1Name || 'User 1',
    user2Name: user2Name || 'User 2',
    user1UpdatedAt: user1UpdatedAt || new Date().toISOString(),
    user2UpdatedAt: user2UpdatedAt || new Date().toISOString(),
  });
}

export function useRealtimeText({
  roomId,
  token,
  initialRawContent = '',
  initialVersion = 1,
  initialUpdatedAt = null,
  participantId,
  _userSlot = 'user1',
  onToast,
}) {
  const initialParsed = parseRoomText(initialRawContent);

  const [user1Text, setUser1Text] = useState(initialParsed.user1);
  const [user2Text, setUser2Text] = useState(initialParsed.user2);
  const [user1Name, setUser1Name] = useState(initialParsed.user1Name);
  const [user2Name, setUser2Name] = useState(initialParsed.user2Name);
  const [user1UpdatedAt, setUser1UpdatedAt] = useState(initialParsed.user1UpdatedAt || initialUpdatedAt);
  const [user2UpdatedAt, setUser2UpdatedAt] = useState(initialParsed.user2UpdatedAt || initialUpdatedAt);

  const [version, setVersion] = useState(initialVersion);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Debounce and active edit tracking
  const debounceTimerRef = useRef(null);
  const isEditingUser1Ref = useRef(false);
  const isEditingUser2Ref = useRef(false);
  const latestUser1Ref = useRef(initialParsed.user1);
  const latestUser2Ref = useRef(initialParsed.user2);
  const latestUser1NameRef = useRef(initialParsed.user1Name);
  const latestUser2NameRef = useRef(initialParsed.user2Name);
  const currentVersionRef = useRef(initialVersion);

  // Sync state if initial raw content arrives/updates
  useEffect(() => {
    if (initialRawContent !== undefined) {
      const parsed = parseRoomText(initialRawContent);
      if (!isEditingUser1Ref.current) {
        setUser1Text(parsed.user1);
        latestUser1Ref.current = parsed.user1;
        if (parsed.user1UpdatedAt) setUser1UpdatedAt(parsed.user1UpdatedAt);
      }
      if (!isEditingUser2Ref.current) {
        setUser2Text(parsed.user2);
        latestUser2Ref.current = parsed.user2;
        if (parsed.user2UpdatedAt) setUser2UpdatedAt(parsed.user2UpdatedAt);
      }
      if (parsed.user1Name) {
        setUser1Name(parsed.user1Name);
        latestUser1NameRef.current = parsed.user1Name;
      }
      if (parsed.user2Name) {
        setUser2Name(parsed.user2Name);
        latestUser2NameRef.current = parsed.user2Name;
      }
    }
    if (initialVersion !== undefined) {
      setVersion(initialVersion);
      currentVersionRef.current = initialVersion;
    }
  }, [initialRawContent, initialVersion]);

  // Persist combined state to database
  const persistChanges = useCallback(
    async (u1Text, u2Text, u1Name, u2Name, u1Time, u2Time) => {
      if (!roomId || !token) return;

      try {
        setSaveStatus('saving');
        const serialized = serializeRoomText(u1Text, u2Text, u1Name, u2Name, u1Time, u2Time);

        const res = await QuickClipApi.updateText(
          roomId,
          token,
          serialized,
          currentVersionRef.current
        );

        if (res && res.success) {
          setSaveStatus('saved');
          if (res.version) {
            setVersion(res.version);
            currentVersionRef.current = res.version;
          }
        } else {
          setSaveStatus('error');
          if (onToast) onToast('Failed to save text to database', 'error');
        }
      } catch (err) {
        console.error('Error saving text:', err);
        setSaveStatus('error');
        if (onToast) onToast(err.message || 'Error saving clipboard', 'error');
      } finally {
        isEditingUser1Ref.current = false;
        isEditingUser2Ref.current = false;
      }
    },
    [roomId, token, onToast]
  );

  // Handle User 1 text typing
  const handleUser1Change = useCallback(
    (newText) => {
      if (newText.length > MAX_TEXT_LENGTH) {
        if (onToast) onToast(`Text limit reached (${MAX_TEXT_LENGTH.toLocaleString()} chars)`, 'warning');
        newText = newText.substring(0, MAX_TEXT_LENGTH);
      }

      const now = new Date().toISOString();
      isEditingUser1Ref.current = true;
      setUser1Text(newText);
      setUser1UpdatedAt(now);
      latestUser1Ref.current = newText;
      setSaveStatus('saving');

      // Broadcast immediate typing preview
      QuickClipApi.broadcastEvent(roomId, 'text-typing', {
        slot: 'user1',
        text: newText,
        updatedAt: now,
        senderId: participantId,
        timestamp: Date.now(),
      }).catch(() => {});

      // Debounce persistence
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        persistChanges(
          newText,
          latestUser2Ref.current,
          latestUser1NameRef.current,
          latestUser2NameRef.current,
          now,
          user2UpdatedAt
        );
      }, 400);
    },
    [roomId, participantId, user2UpdatedAt, persistChanges, onToast]
  );

  // Handle User 2 text typing
  const handleUser2Change = useCallback(
    (newText) => {
      if (newText.length > MAX_TEXT_LENGTH) {
        if (onToast) onToast(`Text limit reached (${MAX_TEXT_LENGTH.toLocaleString()} chars)`, 'warning');
        newText = newText.substring(0, MAX_TEXT_LENGTH);
      }

      const now = new Date().toISOString();
      isEditingUser2Ref.current = true;
      setUser2Text(newText);
      setUser2UpdatedAt(now);
      latestUser2Ref.current = newText;
      setSaveStatus('saving');

      // Broadcast immediate typing preview
      QuickClipApi.broadcastEvent(roomId, 'text-typing', {
        slot: 'user2',
        text: newText,
        updatedAt: now,
        senderId: participantId,
        timestamp: Date.now(),
      }).catch(() => {});

      // Debounce persistence
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        persistChanges(
          latestUser1Ref.current,
          newText,
          latestUser1NameRef.current,
          latestUser2NameRef.current,
          user1UpdatedAt,
          now
        );
      }, 400);
    },
    [roomId, participantId, user1UpdatedAt, persistChanges, onToast]
  );

  // Handle User 1 Name edit
  const handleUser1NameChange = useCallback(
    (newName) => {
      const cleanName = newName.trim().substring(0, 30) || 'User 1';
      setUser1Name(cleanName);
      latestUser1NameRef.current = cleanName;

      // Broadcast name change
      QuickClipApi.broadcastEvent(roomId, 'name-update', {
        slot: 'user1',
        name: cleanName,
        senderId: participantId,
      }).catch(() => {});

      persistChanges(
        latestUser1Ref.current,
        latestUser2Ref.current,
        cleanName,
        latestUser2NameRef.current,
        user1UpdatedAt,
        user2UpdatedAt
      );

      if (onToast) onToast(`Screen renamed to "${cleanName}"`, 'success');
    },
    [roomId, participantId, user1UpdatedAt, user2UpdatedAt, persistChanges, onToast]
  );

  // Handle User 2 Name edit
  const handleUser2NameChange = useCallback(
    (newName) => {
      const cleanName = newName.trim().substring(0, 30) || 'User 2';
      setUser2Name(cleanName);
      latestUser2NameRef.current = cleanName;

      // Broadcast name change
      QuickClipApi.broadcastEvent(roomId, 'name-update', {
        slot: 'user2',
        name: cleanName,
        senderId: participantId,
      }).catch(() => {});

      persistChanges(
        latestUser1Ref.current,
        latestUser2Ref.current,
        latestUser1NameRef.current,
        cleanName,
        user1UpdatedAt,
        user2UpdatedAt
      );

      if (onToast) onToast(`Screen renamed to "${cleanName}"`, 'success');
    },
    [roomId, participantId, user1UpdatedAt, user2UpdatedAt, persistChanges, onToast]
  );

  // Clear specific user's clipboard
  const handleClearUser = useCallback(
    (slotToClear) => {
      const now = new Date().toISOString();
      if (slotToClear === 'user1') {
        isEditingUser1Ref.current = true;
        setUser1Text('');
        setUser1UpdatedAt(now);
        latestUser1Ref.current = '';
        QuickClipApi.broadcastEvent(roomId, 'text-typing', {
          slot: 'user1',
          text: '',
          updatedAt: now,
          senderId: participantId,
          timestamp: Date.now(),
        }).catch(() => {});
        persistChanges(
          '',
          latestUser2Ref.current,
          latestUser1NameRef.current,
          latestUser2NameRef.current,
          now,
          user2UpdatedAt
        );
      } else {
        isEditingUser2Ref.current = true;
        setUser2Text('');
        setUser2UpdatedAt(now);
        latestUser2Ref.current = '';
        QuickClipApi.broadcastEvent(roomId, 'text-typing', {
          slot: 'user2',
          text: '',
          updatedAt: now,
          senderId: participantId,
          timestamp: Date.now(),
        }).catch(() => {});
        persistChanges(
          latestUser1Ref.current,
          '',
          latestUser1NameRef.current,
          latestUser2NameRef.current,
          user1UpdatedAt,
          now
        );
      }
      if (onToast) onToast('Cleared clipboard', 'info');
    },
    [roomId, participantId, user1UpdatedAt, user2UpdatedAt, persistChanges, onToast]
  );

  // Copy text between users (e.g. User 2 copies User 1's text to their screen)
  const handleTransferText = useCallback(
    (fromSlot, toSlot) => {
      const sourceText = fromSlot === 'user1' ? latestUser1Ref.current : latestUser2Ref.current;
      if (!sourceText) {
        if (onToast) onToast('Source screen is empty', 'info');
        return;
      }

      if (toSlot === 'user1') {
        handleUser1Change(sourceText);
      } else {
        handleUser2Change(sourceText);
      }

      if (onToast) {
        onToast('Copied content to your screen!', 'success');
      }
    },
    [handleUser1Change, handleUser2Change, onToast]
  );

  // Generic copy helper
  const handleCopy = useCallback(
    async (textToCopy, label = 'Text') => {
      if (!textToCopy) {
        if (onToast) onToast(`${label} is empty`, 'info');
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        if (onToast) onToast(`${label} copied to clipboard!`, 'success');
      } catch {
        if (onToast) onToast('Failed to copy to clipboard', 'error');
      }
    },
    [onToast]
  );

  // Apply remote update from broadcast
  const applyRemoteUpdate = useCallback(
    (remoteData) => {
      if (remoteData.senderId === participantId) return;

      // Handle text typing
      if (remoteData.slot === 'user1' && remoteData.text !== undefined) {
        if (!isEditingUser1Ref.current) {
          setUser1Text(remoteData.text || '');
          latestUser1Ref.current = remoteData.text || '';
          if (remoteData.updatedAt) setUser1UpdatedAt(remoteData.updatedAt);
        }
      } else if (remoteData.slot === 'user2' && remoteData.text !== undefined) {
        if (!isEditingUser2Ref.current) {
          setUser2Text(remoteData.text || '');
          latestUser2Ref.current = remoteData.text || '';
          if (remoteData.updatedAt) setUser2UpdatedAt(remoteData.updatedAt);
        }
      }

      // Handle name change
      if (remoteData.name) {
        if (remoteData.slot === 'user1') {
          setUser1Name(remoteData.name);
          latestUser1NameRef.current = remoteData.name;
        } else if (remoteData.slot === 'user2') {
          setUser2Name(remoteData.name);
          latestUser2NameRef.current = remoteData.name;
        }
      }
    },
    [participantId]
  );

  // Apply remote Postgres Changes update
  const applyPostgresUpdate = useCallback(
    (newRow) => {
      if (!newRow?.text_content) return;
      const parsed = parseRoomText(newRow.text_content);

      if (!isEditingUser1Ref.current) {
        setUser1Text(parsed.user1);
        latestUser1Ref.current = parsed.user1;
        if (parsed.user1UpdatedAt) setUser1UpdatedAt(parsed.user1UpdatedAt);
      }

      if (!isEditingUser2Ref.current) {
        setUser2Text(parsed.user2);
        latestUser2Ref.current = parsed.user2;
        if (parsed.user2UpdatedAt) setUser2UpdatedAt(parsed.user2UpdatedAt);
      }

      if (parsed.user1Name) {
        setUser1Name(parsed.user1Name);
        latestUser1NameRef.current = parsed.user1Name;
      }
      if (parsed.user2Name) {
        setUser2Name(parsed.user2Name);
        latestUser2NameRef.current = parsed.user2Name;
      }

      if (newRow.version) {
        setVersion(newRow.version);
        currentVersionRef.current = newRow.version;
      }

      setSaveStatus('saved');
    },
    []
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    user1Text,
    user2Text,
    user1Name,
    user2Name,
    user1UpdatedAt,
    user2UpdatedAt,
    version,
    saveStatus,
    maxCharacters: MAX_TEXT_LENGTH,
    handleUser1Change,
    handleUser2Change,
    handleUser1NameChange,
    handleUser2NameChange,
    handleClearUser,
    handleTransferText,
    handleCopy,
    applyRemoteUpdate,
    applyPostgresUpdate,
  };
}
