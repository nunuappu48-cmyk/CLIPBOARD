import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Hash,
  KeyRound,
  Users,
} from 'lucide-react';
import { generateRoomCode, codeToRoomCredentials } from '../lib/crypto';
import { QuickClipApi } from '../lib/supabase';
import { Header } from '../components/Header';

export function Home({ onToast }) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // Handle "Create New Room" (Generates a fresh 6-digit code)
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const code = generateRoomCode();
      const { roomId, token, formattedCode } = await codeToRoomCredentials(code);

      // Call API to create room record in Supabase or mock backend
      await QuickClipApi.createRoom(roomId, token);

      // Set creator as User 1 by default
      sessionStorage.setItem(`quickclip_slot_${roomId}`, 'user1');
      sessionStorage.setItem(`quickclip_code_${roomId}`, formattedCode);

      // Navigate to room with access token and slot in URL hash
      navigate(`/room/${formattedCode}#token=${token}&slot=user1`);
    } catch (err) {
      console.error('Error creating room:', err);
      if (onToast) {
        onToast(err.message || 'Failed to create room. Please try again.', 'error');
      }
      setIsCreating(false);
    }
  };

  // Handle direct 6-digit code connection
  const handleConnectWithCode = async (e) => {
    e.preventDefault();
    setJoinError('');

    const raw = codeInput.trim();
    if (!raw) {
      setJoinError('Please enter a 6-digit room code.');
      return;
    }

    try {
      setIsJoining(true);

      // Check if user entered full URL or raw code
      let targetCode = raw;
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const url = new URL(raw);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const roomIdx = pathSegments.indexOf('room');
        if (roomIdx !== -1 && pathSegments[roomIdx + 1]) {
          targetCode = pathSegments[roomIdx + 1];
        }
      }

      const { roomId, token, formattedCode } = await codeToRoomCredentials(targetCode);

      // Tag this joining user as User 2 by default
      sessionStorage.setItem(`quickclip_slot_${roomId}`, 'user2');
      sessionStorage.setItem(`quickclip_code_${roomId}`, formattedCode);

      navigate(`/room/${formattedCode}#token=${token}&slot=user2`);
    } catch (err) {
      setJoinError(err.message || 'Invalid room code format. Example: 784-291');
      setIsJoining(false);
    }
  };

  const handleCodeInputChange = (e) => {
    setJoinError('');
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 6) val = val.substring(0, 6);
    // Auto format 6 digits as XXX-XXX
    if (val.length > 3) {
      setCodeInput(`${val.substring(0, 3)}-${val.substring(3)}`);
    } else {
      setCodeInput(val);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600 selection:text-white">
      <Header onToast={onToast} />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 flex flex-col items-center justify-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Connect with 6-Digit Code • No Sign-up Required</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          Share anything. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Connected by Code.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          A real-time dual clipboard for you and your friend. Create a room to get a 6-digit code, share the code, and both screens sync live side-by-side.
        </p>

        {/* Main Actions Box: Connect with Code OR Create New Room */}
        <div className="mt-8 w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          {/* Section 1: Connect with 6-Digit Code */}
          <div className="flex flex-col text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Connect Using Room Code</span>
            </label>

            <form onSubmit={handleConnectWithCode} className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={codeInput}
                  onChange={handleCodeInputChange}
                  placeholder="e.g. 784-291"
                  maxLength={7}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none text-xl sm:text-2xl font-mono font-bold tracking-widest text-slate-800 placeholder:text-slate-300 uppercase bg-slate-50 focus:bg-white transition-all text-center sm:text-left"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none hidden sm:inline">
                  6-DIGIT
                </span>
              </div>

              <button
                type="submit"
                disabled={isJoining || codeInput.replace(/[^A-Z0-9]/g, '').length < 4}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-500/20 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Connect</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {joinError && (
              <p className="text-rose-600 text-xs font-medium mt-2">{joinError}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs uppercase font-semibold text-slate-400">or start a new session</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* Section 2: Create New Room */}
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base shadow-md shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:hover:translate-y-0 cursor-pointer"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Room Code...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Create New Room & Get Code</span>
              </>
            )}
          </button>
        </div>

        {/* Workflow Steps: How Code Connection Works */}
        <div className="mt-16 w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">How Code Connection Works</h2>
            <p className="text-sm text-slate-500 mt-1">Share text and images without sending long, messy URLs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Get Your 6-Digit Code</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Click "Create New Room". A unique 6-digit code (e.g. <strong>784-291</strong>) is instantly generated for you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Tell Your Friend</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Tell your friend the code or text it to them. They type the 6 digits right on the home page and click Connect.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Dual Screens Sync Live</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                User 1 (left screen) and User 2 (right screen) type, paste screenshots, and share photos simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 w-fit mb-2.5">
              <Hash className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">6-Digit Code</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Simple, memorable room identifiers</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-2.5">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">2-User Split View</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Side-by-side live collaborative screens</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 w-fit mb-2.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Ctrl+V Screenshots</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Paste screenshots directly from clipboard</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-left">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 w-fit mb-2.5">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800">24h Auto-Expiry</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Clean ephemeral room lifecycle</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>QuickClip — Real-Time 2-User Clipboard</span>
          <span className="text-slate-400">Connect by Code • Ephemeral • Supabase Realtime</span>
        </div>
      </footer>
    </div>
  );
}
