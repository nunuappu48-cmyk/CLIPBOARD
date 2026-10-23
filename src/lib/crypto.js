/**
 * Cryptographic helper functions for QuickClip
 * Uses Web Crypto API available natively in modern browsers.
 */

function getCrypto() {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
  throw new Error('Web Crypto API not available');
}

/**
 * Generate a friendly 6-digit numeric room code (e.g. '784-291')
 */
export function generateRoomCode() {
  const crypto = getCrypto();
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // 6-digit number between 100000 and 999999
  const num = 100000 + (array[0] % 900000);
  const str = num.toString();
  return `${str.substring(0, 3)}-${str.substring(3, 6)}`;
}

/**
 * Convert a room code to deterministic roomId and token
 */
export async function codeToRoomCredentials(rawCode) {
  if (!rawCode) throw new Error('Room code is required');
  const cleanCode = rawCode.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleanCode.length < 4) {
    throw new Error('Room code must be at least 4 characters');
  }

  // Derive deterministic UUID v4
  const roomHash = await sha256(`quickclip-room-v1:${cleanCode}`);
  const roomId = [
    roomHash.substring(0, 8),
    roomHash.substring(8, 12),
    '4' + roomHash.substring(13, 16),
    '8' + roomHash.substring(17, 20),
    roomHash.substring(20, 32),
  ].join('-');

  // Derive deterministic token
  const token = await sha256(`quickclip-token-v1:${cleanCode}`);
  const tokenHash = await sha256(token);

  const formattedCode =
    cleanCode.length === 6
      ? `${cleanCode.substring(0, 3)}-${cleanCode.substring(3, 6)}`
      : cleanCode;

  return {
    cleanCode,
    formattedCode,
    roomId,
    token,
    tokenHash,
  };
}

/**
 * Generate a cryptographically secure random room token
 * Returns a 32-byte hex string (64 characters)
 */
export function generateRoomToken() {
  const crypto = getCrypto();
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a cryptographically random UUID v4
 */
export function generateUUID() {
  const crypto = getCrypto();
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

/**
 * Computes SHA-256 hash of a string, returning a hex string
 */
export async function sha256(message) {
  const crypto = getCrypto();
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a persistent participant ID for this browser tab/session
 */
export function getParticipantId() {
  let id = sessionStorage.getItem('quickclip_participant_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('quickclip_participant_id', id);
  }
  return id;
}
