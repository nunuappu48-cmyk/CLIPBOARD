import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

      // Set creator strictly as User 1
      sessionStorage.setItem(`quickclip_creator_${roomId}`, 'true');
      sessionStorage.setItem(`quickclip_slot_${roomId}`, 'user1');
      sessionStorage.setItem(`quickclip_code_${roomId}`, formattedCode);

      // Navigate to room with access token, slot, and role in URL hash
      navigate(`/room/${formattedCode}#token=${token}&slot=user1&role=creator`);
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

      // Anyone connecting via code is strictly User 2
      sessionStorage.removeItem(`quickclip_creator_${roomId}`);
      sessionStorage.setItem(`quickclip_slot_${roomId}`, 'user2');
      sessionStorage.setItem(`quickclip_code_${roomId}`, formattedCode);

      navigate(`/room/${formattedCode}#token=${token}&slot=user2&role=guest`);
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
    <div className="min-h-screen flex flex-col bg-[#f0f0eb] text-[#1a1a1a]">
      <Header onToast={onToast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Application System Banner */}
        <div className="panel-box">
          <div className="panel-header-navy">
            <span>QUICKCLIP UTILITY — SYSTEM OVERVIEW</span>
            <span className="font-mono text-[11px] text-[#c2d7f2]">PROTOCOL v1.0</span>
          </div>
          <div className="p-4 bg-[#ffffff]">
            <h1 className="text-xl sm:text-2xl font-bold font-sans text-[#1b365d] tracking-tight">
              Real-Time Dual-User Clipboard
            </h1>
            <p className="mt-1 text-xs text-[#444444] leading-relaxed">
              QuickClip is a lightweight, low-latency synchronization tool for text, code, and screenshots between two participants. Connect using an ephemeral 6-digit session code. No authentication or account registration required.
            </p>
          </div>
        </div>

        {/* Primary Action Box: Connect or Create */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Connect via Code */}
          <div className="panel-box flex flex-col">
            <div className="panel-header">
              <span>JOIN SESSION BY CODE</span>
              <span className="font-mono text-[11px] text-[#555555]">PEER (USER 2)</span>
            </div>

            <div className="p-4 bg-[#ffffff] flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-[#555555] mb-3">
                  Enter the 6-digit session code provided by your peer to connect:
                </p>

                <form onSubmit={handleConnectWithCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase mb-1 text-[#333333]">
                      Room Code:
                    </label>
                    <input
                      type="text"
                      value={codeInput}
                      onChange={handleCodeInputChange}
                      placeholder="e.g. 784-291"
                      maxLength={7}
                      className="input-classic w-full font-mono text-base font-bold text-center tracking-widest uppercase bg-[#ffffff] border-[#707070]"
                    />
                  </div>

                  {joinError && (
                    <div className="p-1.5 bg-[#f2dede] border border-[#ebccd1] text-[#a94442] text-xs font-mono">
                      Error: {joinError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isJoining || codeInput.replace(/[^A-Z0-9]/g, '').length < 4}
                    className="btn-classic-primary w-full py-2 text-xs"
                  >
                    {isJoining ? 'Connecting to Room...' : '[ Connect to Room -> ]'}
                  </button>
                </form>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e0e0] text-[11px] font-mono text-[#666666]">
                Accepted input formats: 6 digits (XXX-XXX) or full room URL.
              </div>
            </div>
          </div>

          {/* Box 2: Create New Room */}
          <div className="panel-box flex flex-col">
            <div className="panel-header">
              <span>CREATE NEW SESSION</span>
              <span className="font-mono text-[11px] text-[#555555]">HOST (USER 1)</span>
            </div>

            <div className="p-4 bg-[#ffffff] flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-[#555555] mb-3">
                  Initiate a fresh shared clipboard room. A 6-digit connection code will be generated immediately for your session.
                </p>

                <div className="bg-[#fcfcfa] border border-[#d8d8d4] p-3 text-xs mb-4 space-y-1 text-[#444444]">
                  <div>• Ephemeral room lifetime: 24 hours of inactivity</div>
                  <div>• Dual split view: Independent editor screens</div>
                  <div>• Storage: Shared images & screenshots repository</div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="btn-classic-olive w-full py-2 text-xs"
                >
                  {isCreating ? 'Generating Code & Session...' : '[ + Create New Room & Get Code ]'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e0e0e0] text-[11px] font-mono text-[#666666]">
                You will be assigned User 1 (Host) role automatically.
              </div>
            </div>
          </div>
        </div>


        {/* Workflow Guide */}
        <div className="panel-box">
          <div className="panel-header">
            <span>SESSION CONNECTION INSTRUCTIONS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#999999] bg-[#ffffff]">
            <div className="p-3 text-xs">
              <div className="font-bold font-mono text-[#1b365d] mb-1">
                STEP 1: GENERATE CODE
              </div>
              <p className="text-[#555555] leading-relaxed">
                Click "Create New Room". A unique 6-digit code (e.g. 784-291) is produced and tied to a private session.
              </p>
            </div>

            <div className="p-3 text-xs">
              <div className="font-bold font-mono text-[#1b365d] mb-1">
                STEP 2: TRANSMIT IDENTIFIER
              </div>
              <p className="text-[#555555] leading-relaxed">
                Share the 6-digit code with your peer. They enter the digits into the "Join Session" field and click connect.
              </p>
            </div>

            <div className="p-3 text-xs">
              <div className="font-bold font-mono text-[#1b365d] mb-1">
                STEP 3: SYNCHRONIZED WORKSPACE
              </div>
              <p className="text-[#555555] leading-relaxed">
                Both users see live updates in real time with dedicated input screens and shared file repository.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#999999] bg-[#e5e5e0] py-3 text-xs text-[#555555] font-mono mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-2">
          <span>QuickClip — Real-Time Peer Clipboard Utility</span>
        </div>
      </footer>
    </div>
  );
}
