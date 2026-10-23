import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuickClipApi, isSupabaseReady } from '../lib/supabase';
import { getParticipantId } from '../lib/crypto';

export function useRoom(roomId, token) {
  const [room, setRoom] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  const participantId = useMemo(() => getParticipantId(), []);

  const loadRoom = useCallback(async () => {
    if (!roomId) {
      setError({ code: 'INVALID_URL', message: 'No room ID provided.' });
      setLoading(false);
      return;
    }

    if (!token) {
      setError({
        code: 'MISSING_TOKEN',
        message: 'Room access token is missing from the link. Please check your room URL.',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('connecting');

      const data = await QuickClipApi.verifyAndGetRoom(roomId, token);

      if (!data || !data.success) {
        if (data?.error === 'ROOM_EXPIRED') {
          setError({
            code: 'ROOM_EXPIRED',
            message: 'This room has expired (rooms expire 24 hours after their last activity).',
          });
        } else if (data?.error === 'UNAUTHORIZED') {
          setError({
            code: 'UNAUTHORIZED',
            message: 'Invalid room access token. You do not have permission to view this room.',
          });
        } else {
          setError({
            code: 'ROOM_NOT_FOUND',
            message: 'Room not found. It may have expired and been cleaned up, or the link is invalid.',
          });
        }
        setConnectionStatus('error');
        setLoading(false);
        return;
      }

      setRoom(data.room);
      setContent(data.content);
      setConnectionStatus('connected');
      setLoading(false);
    } catch (err) {
      console.error('Error verifying room:', err);
      setError({
        code: 'CONNECTION_ERROR',
        message: err.message || 'Unable to connect to QuickClip service.',
      });
      setConnectionStatus('error');
      setLoading(false);
    }
  }, [roomId, token]);

  // Initial load
  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Update expiration countdown
  useEffect(() => {
    if (!room?.expires_at) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(room.expires_at);
      const diffMs = expires - now;

      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        setIsExpiringSoon(true);
        setError({
          code: 'ROOM_EXPIRED',
          message: 'This room has just expired.',
        });
        return;
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setIsExpiringSoon(diffHours < 1);

      if (diffHours > 0) {
        setTimeRemaining(`${diffHours}h ${diffMinutes}m remaining`);
      } else {
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeRemaining(`${diffMinutes}m ${diffSeconds}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [room?.expires_at]);

  return {
    room,
    initialContent: content,
    loading,
    error,
    connectionStatus,
    setConnectionStatus,
    timeRemaining,
    isExpiringSoon,
    participantId,
    reloadRoom: loadRoom,
    isSupabase: isSupabaseReady(),
  };
}
