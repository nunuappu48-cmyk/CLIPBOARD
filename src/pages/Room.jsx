import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldAlert,
  Plus,
  RefreshCw,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useRoom } from '../hooks/useRoom';
import { useRealtimeText } from '../hooks/useRealtimeText';
import { useRoomImages } from '../hooks/useRoomImages';
import { QuickClipApi } from '../lib/supabase';
import { Header } from '../components/Header';
import { ShareRoomLink } from '../components/ShareRoomLink';
import { TextClipboard } from '../components/TextClipboard';
import { ImageUploader } from '../components/ImageUploader';
import { ImageGallery } from '../components/ImageGallery';
import { ImageLightbox } from '../components/ImageLightbox';

export function Room({ onToast }) {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract access token from URL hash (#token=...) or search params (?token=...)
  const token = useMemo(() => {
    if (location.hash && location.hash.includes('token=')) {
      const match = location.hash.match(/token=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
    }
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('token') || '';
  }, [location.hash, location.search]);

  // Mobile view tab selector: 'text' | 'images'
  const [activeMobileTab, setActiveMobileTab] = useState('text');

  // Room verification hook
  const {
    room,
    initialContent,
    loading,
    error,
    connectionStatus,
    setConnectionStatus,
    timeRemaining,
    isExpiringSoon,
    participantId,
    reloadRoom,
  } = useRoom(roomId, token);

  // Real-time Text hook
  const {
    text,
    saveStatus,
    characterCount,
    maxCharacters,
    updatedAt,
    handleTextChange,
    handleClearText,
    handleCopyText,
    applyRemoteUpdate,
  } = useRealtimeText({
    roomId,
    token,
    initialText: initialContent?.text_content || '',
    initialVersion: initialContent?.version || 1,
    initialUpdatedAt: initialContent?.updated_at || null,
    participantId,
    onToast,
  });

  // Room Images hook
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
    roomId,
    token,
    participantId,
    onToast,
  });

  // Supabase Realtime channel subscription
  useEffect(() => {
    if (!roomId || !token || !room) return;

    const unsubscribe = QuickClipApi.subscribe(roomId, {
      onTextUpdate: (remoteData) => {
        applyRemoteUpdate(remoteData);
      },
      onPostgresTextUpdate: (newRow) => {
        applyRemoteUpdate({
          text: newRow.text_content,
          version: newRow.version,
          updated_at: newRow.updated_at,
          senderId: null,
        });
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
    roomId,
    token,
    room,
    applyRemoteUpdate,
    handleRemoteImageAdded,
    handleRemoteImageDeleted,
    setConnectionStatus,
  ]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header isInRoom={false} onToast={onToast} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Joining Room...</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Verifying cryptographic token and establishing real-time connection.
          </p>
        </div>
      </div>
    );
  }

  // Error Screen (Expired, Unauthorized, or Not Found)
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
                ? 'Access Denied'
                : 'Room Not Found'}
            </h2>

            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{error.message}</p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Room</span>
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5 sm:gap-6">
        {/* Shareable Room Link Bar */}
        <ShareRoomLink roomId={roomId} token={token} onToast={onToast} />

        {/* Mobile View Tab Switcher */}
        <div className="flex sm:hidden bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMobileTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMobileTab === 'text'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text Clipboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('images')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMobileTab === 'images'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images ({images.length})</span>
          </button>
        </div>

        {/* Responsive Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 flex-1 items-start">
          {/* Left Column: Text Clipboard (7 cols on lg) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-4 ${
              activeMobileTab === 'images' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <TextClipboard
              text={text}
              saveStatus={saveStatus}
              characterCount={characterCount}
              maxCharacters={maxCharacters}
              updatedAt={updatedAt}
              onChange={handleTextChange}
              onClear={handleClearText}
              onCopy={handleCopyText}
            />
          </div>

          {/* Right Column: Image Uploader & Gallery (5 cols on lg) */}
          <div
            className={`lg:col-span-5 flex flex-col gap-5 ${
              activeMobileTab === 'text' ? 'hidden sm:flex' : 'flex'
            }`}
          >
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
        </div>
      </main>

      {/* Image Lightbox Modal */}
      <ImageLightbox
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
        onDelete={handleDeleteImage}
        onToast={onToast}
      />
    </div>
  );
}
