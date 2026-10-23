import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldAlert,
  Plus,
  RefreshCw,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { useRoom } from '../hooks/useRoom';
import { useRealtimeText } from '../hooks/useRealtimeText';
import { useRoomImages } from '../hooks/useRoomImages';
import { QuickClipApi } from '../lib/supabase';
import { codeToRoomCredentials } from '../lib/crypto';
import { Header } from '../components/Header';
import { ShareRoomCode } from '../components/ShareRoomCode';
import { SplitTextClipboard } from '../components/SplitTextClipboard';
import { ImageUploader } from '../components/ImageUploader';
import { ImageGallery } from '../components/ImageGallery';
import { ImageLightbox } from '../components/ImageLightbox';

export function Room({ onToast }) {
  const { roomId: rawParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // State to hold resolved credentials (derived from 6-digit code or UUID)
  const [credentials, setCredentials] = useState(null);
  const [resolvingCode, setResolvingCode] = useState(true);

  // Extract access token from URL hash or query params if present
  const explicitToken = useMemo(() => {
    if (location.hash && location.hash.includes('token=')) {
      const match = location.hash.match(/token=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
    }
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('token') || '';
  }, [location.hash, location.search]);

  // Resolve room credentials from rawParam (either 6-digit code or UUID)
  useEffect(() => {
    async function resolve() {
      try {
        setResolvingCode(true);
        const clean = (rawParam || '').trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

        if (!isUuid && clean.length <= 10) {
          const derived = await codeToRoomCredentials(clean);
          setCredentials({
            roomId: derived.roomId,
            token: explicitToken || derived.token,
            code: derived.formattedCode,
          });
        } else {
          const storedCode = sessionStorage.getItem(`quickclip_code_${clean}`);
          setCredentials({
            roomId: clean,
            token: explicitToken,
            code: storedCode || clean.substring(0, 8).toUpperCase(),
          });
        }
      } catch (err) {
        console.error('Failed to resolve room credentials:', err);
      } finally {
        setResolvingCode(false);
      }
    }
    resolve();
  }, [rawParam, explicitToken]);

  const activeRoomId = credentials?.roomId;
  const activeToken = credentials?.token;
  const roomCode = credentials?.code;

  // Strict User Assignment:
  // Creator is ALWAYS User 1. Joined friend is ALWAYS User 2.
  const userSlot = useMemo(() => {
    // 1. Check explicit role flag in URL hash
    if (location.hash.includes('role=creator')) return 'user1';
    if (location.hash.includes('role=guest')) return 'user2';

    // 2. Check creator flag in sessionStorage
    if (activeRoomId && sessionStorage.getItem(`quickclip_creator_${activeRoomId}`) === 'true') {
      return 'user1';
    }

    // 3. Check saved slot
    if (activeRoomId) {
      const stored = sessionStorage.getItem(`quickclip_slot_${activeRoomId}`);
      if (stored === 'user1') return 'user1';
    }

    // Default: User 2 (guest joining via room code or link)
    return 'user2';
  }, [activeRoomId, location.hash]);

  const isUser1 = userSlot === 'user1';
  const isUser2 = userSlot === 'user2';

  // Presence state tracking for both users
  const [user1Online, setUser1Online] = useState(false);
  const [user2Online, setUser2Online] = useState(false);

  // Tab for mobile view
  const [mobileTab, setMobileTab] = useState('split');

  // Room verification hook
  const {
    room,
    initialContent,
    loading: roomLoading,
    error,
    connectionStatus,
    setConnectionStatus,
    timeRemaining,
    isExpiringSoon,
    participantId,
    reloadRoom,
  } = useRoom(activeRoomId, activeToken);

  // Dual Split Real-time Text hook (with custom names and edit control)
  const {
    user1Text,
    user2Text,
    user1Name,
    user2Name,
    user1UpdatedAt,
    user2UpdatedAt,
    saveStatus,
    maxCharacters,
    handleUser1Change,
    handleUser2Change,
    handleUser1NameChange,
    handleUser2NameChange,
    handleClearUser,
    handleTransferText,
    handleCopy,
    applyRemoteUpdate,
    applyPostgresUpdate,
  } = useRealtimeText({
    roomId: activeRoomId,
    token: activeToken,
    initialRawContent: initialContent?.text_content || '',
    initialVersion: initialContent?.version || 1,
    initialUpdatedAt: initialContent?.updated_at || null,
    participantId,
    userSlot,
    onToast,
  });

  // Room Images hook (attributing uploads to active userSlot)
  const {
    images,
    loading: imagesLoading,
    uploadQueue,
    activeLightboxImage,
    setActiveLightboxImage,
    handleUploadFiles,
    handleDeleteImage,
    handleRemoteImageAdded,
    handleRemoteImageDeleted,
  } = useRoomImages({
    roomId: activeRoomId,
    token: activeToken,
    participantId: userSlot,
    onToast,
  });

  // Supabase Realtime channel subscription with presence tracking
  useEffect(() => {
    if (!activeRoomId || !activeToken || !room) return;

    if (userSlot === 'user1') setUser1Online(true);
    if (userSlot === 'user2') setUser2Online(true);

    const unsubscribe = QuickClipApi.subscribe(activeRoomId, {
      userPresence: {
        slot: userSlot,
        participantId,
      },
      onPresenceSync: (presenceState) => {
        let hasU1 = userSlot === 'user1';
        let hasU2 = userSlot === 'user2';

        Object.values(presenceState).forEach((presences) => {
          if (Array.isArray(presences)) {
            presences.forEach((p) => {
              if (p.slot === 'user1') hasU1 = true;
              if (p.slot === 'user2') hasU2 = true;
            });
          }
        });

        setUser1Online(hasU1);
        setUser2Online(hasU2);
      },
      onTextUpdate: (remoteData) => {
        applyRemoteUpdate(remoteData);
      },
      onPostgresTextUpdate: (newRow) => {
        applyPostgresUpdate(newRow);
      },
      onImageAdded: (newImage) => {
        handleRemoteImageAdded(newImage);
      },
      onImageDeleted: (deletedImageId) => {
        handleRemoteImageDeleted(deletedImageId);
      },
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      },
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [
    activeRoomId,
    activeToken,
    room,
    userSlot,
    participantId,
    applyRemoteUpdate,
    applyPostgresUpdate,
    handleRemoteImageAdded,
    handleRemoteImageDeleted,
    setConnectionStatus,
  ]);

  const isLoading = resolvingCode || roomLoading;

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header isInRoom={false} onToast={onToast} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Connecting to Room...</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Resolving room credentials and syncing both screens.
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header isInRoom={false} onToast={onToast} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              {error.code === 'ROOM_EXPIRED' ? (
                <Clock className="w-7 h-7 text-amber-600" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-rose-600" />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {error.code === 'ROOM_EXPIRED'
                ? 'Room Has Expired'
                : error.code === 'UNAUTHORIZED'
                ? 'Invalid Code or Access Denied'
                : 'Room Not Found'}
            </h2>

            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {error.message || 'Please check the room code and try again.'}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Enter Another Code</span>
              </button>

              <button
                type="button"
                onClick={() => reloadRoom()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Header
        connectionStatus={connectionStatus}
        timeRemaining={timeRemaining}
        isExpiringSoon={isExpiringSoon}
        isInRoom={true}
        onToast={onToast}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6">
        {/* Prominent 6-Digit Room Code Card */}
        <ShareRoomCode
          code={roomCode}
          roomId={activeRoomId}
          token={activeToken}
          onToast={onToast}
        />

        {/* 2-User Identity & Edit Restriction Bar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {isUser1 ? `You are ${user1Name} (Room Creator)` : `You are ${user2Name} (Joined Guest)`}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Locked Role
                </span>
              </div>
              <p className="text-xs text-slate-500">
                You can edit your screen on the {isUser1 ? 'left' : 'right'}. Your friend's screen is read-only with live updates.
              </p>
            </div>
          </div>

          {/* User Status Pills */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end text-xs">
            {/* User 1 Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border ${
              isUser1 ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${user1Online ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <span className="font-semibold">{user1Name}</span>
              <span className="text-[10px] text-slate-400">({isUser1 ? 'You' : 'Friend'})</span>
            </div>

            {/* User 2 Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border ${
              isUser2 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${user2Online ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
              <span className="font-semibold">{user2Name}</span>
              <span className="text-[10px] text-slate-400">({isUser2 ? 'You' : 'Friend'})</span>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab('split')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mobileTab === 'split' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Both Screens
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('images')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mobileTab === 'images' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Images ({images.length})
          </button>
        </div>

        {/* Dual Split Screen Clipboards */}
        <div className={mobileTab === 'images' ? 'hidden sm:block' : 'block'}>
          <SplitTextClipboard
            userSlot={userSlot}
            user1Text={user1Text}
            user2Text={user2Text}
            user1Name={user1Name}
            user2Name={user2Name}
            user1UpdatedAt={user1UpdatedAt}
            user2UpdatedAt={user2UpdatedAt}
            user1Online={user1Online}
            user2Online={user2Online}
            _saveStatus={saveStatus}
            maxCharacters={maxCharacters}
            onUser1Change={handleUser1Change}
            onUser2Change={handleUser2Change}
            onUser1NameChange={handleUser1NameChange}
            onUser2NameChange={handleUser2NameChange}
            onClearUser={handleClearUser}
            onTransferText={handleTransferText}
            onCopy={handleCopy}
          />
        </div>

        {/* Shared Screenshots & Images Gallery */}
        <div className={`mt-2 flex flex-col gap-4 ${mobileTab === 'user1' || mobileTab === 'user2' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">
                Shared Screenshots & Images
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Paste directly with <kbd className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Ctrl+V</kbd>
            </span>
          </div>

          <ImageUploader
            uploadQueue={uploadQueue}
            onUploadFiles={handleUploadFiles}
          />

          <ImageGallery
            images={images}
            loading={imagesLoading}
            onImageClick={(img) => setActiveLightboxImage(img)}
            onDeleteImage={handleDeleteImage}
            onToast={onToast}
          />
        </div>
      </main>

      {/* Lightbox Modal */}
      <ImageLightbox
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
        onDelete={handleDeleteImage}
        onToast={onToast}
      />
    </div>
  );
}
