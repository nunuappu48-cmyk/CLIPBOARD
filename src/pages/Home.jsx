import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  LogIn,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { generateUUID, generateRoomToken } from '../lib/crypto';
import { QuickClipApi } from '../lib/supabase';
import { Header } from '../components/Header';

export function Home({ onToast }) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // Handle "Create New Room"
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const roomId = generateUUID();
      const token = generateRoomToken();

      // Call API to create room record in Supabase or mock backend
      await QuickClipApi.createRoom(roomId, token);

      // Navigate to room with access token in URL hash
      navigate(`/room/${roomId}#token=${token}`);
    } catch (err) {
      console.error('Error creating room:', err);
      if (onToast) {
        onToast(err.message || 'Failed to create room. Please try again.', 'error');
      }
      setIsCreating(false);
    }
  };

  // Handle "Join Existing Room"
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinError('');

    const input = joinInput.trim();
    if (!input) {
      setJoinError('Please enter a room link or code.');
      return;
    }

    try {
      // Check if user entered a full URL
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const url = new URL(input);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const roomIdx = pathSegments.indexOf('room');

        if (roomIdx !== -1 && pathSegments[roomIdx + 1]) {
          const roomId = pathSegments[roomIdx + 1];
          // Look for token in hash or query
          let token = '';
          if (url.hash && url.hash.includes('token=')) {
            token = url.hash.split('token=')[1].split('&')[0];
          } else if (url.searchParams.get('token')) {
            token = url.searchParams.get('token');
          }

          if (token) {
            navigate(`/room/${roomId}#token=${token}`);
            return;
          } else {
            navigate(`/room/${roomId}`);
            return;
          }
        }
      }

      // Check if user entered a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(input)) {
        navigate(`/room/${input}`);
        return;
      }

      setJoinError('Invalid link or room code format. Please check the URL.');
    } catch {
      setJoinError('Invalid URL or room format.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600 selection:text-white">
      <Header onToast={onToast} />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 flex flex-col items-center justify-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>No sign-up required • Real-time Supabase sync</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          Share anything. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Instantly.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Your real-time clipboard for text, screenshots, and images. Share a single private room link with your friend and collaborate with zero delay.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:hover:translate-y-0"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Room...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Create New Room</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-semibold text-base shadow-xs hover:border-slate-300 transition-all"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            <span>Join Existing Room</span>
          </button>
        </div>

        {/* Workflow Steps: How room sharing works */}
        <div className="mt-20 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">How QuickClip Works</h2>
            <p className="text-sm text-slate-500 mt-1">Simple, private, and lightning fast in three easy steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Create Room</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Click "Create New Room" to generate a unique room secured with a cryptographically random access token.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Send Link to Friend</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Copy the room URL and send it over WhatsApp, Telegram, or any chat app. No login or installation needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Instant Real-Time Sync</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Type text, paste screenshots (Ctrl+V), and upload photos. Everything appears on both screens instantaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 w-fit mb-2.5">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Secure Tokens</p>
            <p className="text-[11px] text-slate-400 mt-0.5">SHA-256 hashed room tokens & RLS</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-2.5">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">24-Hour Expiry</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Rooms auto-clean 24h after inactivity</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 w-fit mb-2.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Image Gallery</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Up to 10MB per image, lightbox preview</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 w-fit mb-2.5">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Zero Refresh</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Debounced updates & broadcast channels</p>
          </div>
        </div>
      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Join an Existing Room</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Paste the full room link shared by your friend, or enter the room identifier.
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    setJoinError('');
                  }}
                  placeholder="https://quickclip.app/room/...#token=..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
                />
                {joinError && (
                  <p className="text-rose-600 text-xs mt-1.5 font-medium">{joinError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>QuickClip — Built with React, Vite, Tailwind CSS & Supabase</span>
          <span className="text-slate-400">Lightweight • Real-Time • Ephemeral</span>
        </div>
      </footer>
    </div>
  );
}
