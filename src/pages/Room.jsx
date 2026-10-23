import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
    _connectionStatus,
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
      <div className="min-h-screen bg-[#f0f0eb] flex flex-col text-[#1a1a1a]">
        <Header isInRoom={false} onToast={onToast} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="panel-box max-w-sm w-full p-4">
            <div className="panel-header-navy mb-3">
              <span>INITIALIZING SESSION</span>
            </div>
            <p className="font-mono text-xs text-[#333333] mb-2">
              Resolving credentials and binding realtime channel...
            </p>
            <div className="text-[11px] font-mono text-[#666666]">
              Please wait.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f0eb] flex flex-col text-[#1a1a1a]">
        <Header isInRoom={false} onToast={onToast} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="panel-box max-w-md w-full">
            <div className="bg-[#8b0000] text-white px-3 py-1.5 font-mono text-xs font-bold">
              SESSION ERROR: {error.code || 'CONNECTION_FAILED'}
            </div>

            <div className="p-4 bg-[#ffffff] text-xs">
              <p className="font-bold text-[#1a1a1a] mb-2">
                {error.code === 'ROOM_EXPIRED'
                  ? 'Session Has Expired'
                  : error.code === 'UNAUTHORIZED'
                  ? 'Invalid Session Code or Access Denied'
                  : 'Session Not Found'}
              </p>

              <p className="text-[#555555] mb-4 leading-relaxed font-mono">
                {error.message || 'Please verify the 6-digit room code and try again.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#cccccc]">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn-classic text-xs"
                >
                  [ Home / Enter Code ]
                </button>

                <button
                  type="button"
                  onClick={() => reloadRoom()}
                  className="btn-classic-primary text-xs"
                >
                  [ Retry Connection ]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0eb] flex flex-col text-[#1a1a1a]">
      <Header
        timeRemaining={timeRemaining}
        isExpiringSoon={isExpiringSoon}
        isInRoom={true}
        onToast={onToast}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 flex flex-col gap-4">
        {/* Prominent 6-Digit Room Code Card */}
        <ShareRoomCode
          code={roomCode}
          roomId={activeRoomId}
          token={activeToken}
          onToast={onToast}
        />


        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden border border-[#999999] bg-[#e5e5e0]">
          <button
            type="button"
            onClick={() => setMobileTab('split')}
            className={`flex-1 py-1.5 text-xs font-bold ${
              mobileTab === 'split' ? 'bg-[#1b365d] text-white' : 'text-[#333333]'
            }`}
          >
            Dual Screens
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('images')}
            className={`flex-1 py-1.5 text-xs font-bold ${
              mobileTab === 'images' ? 'bg-[#1b365d] text-white' : 'text-[#333333]'
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
        <div className={`flex flex-col gap-3 ${mobileTab === 'user1' || mobileTab === 'user2' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="border-b border-[#999999] pb-1 flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase text-[#1a1a1a]">
              Shared Image Repository & Screenshots
            </span>
            <span className="font-mono text-[11px] text-[#666666]">
              Paste directly with <kbd className="bg-[#ece9d8] border border-[#cccccc] px-1 font-mono">Ctrl+V</kbd>
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
