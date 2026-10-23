/**
 * Cryptographic helper functions for QuickClip
 * Uses Web Crypto API available natively in modern browsers.
 */

/**
 * Generate a cryptographically secure random room token
 * Returns a 32-byte hex string (64 characters)
 */
function getCrypto() {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
  throw new Error('Web Crypto API not available');
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
