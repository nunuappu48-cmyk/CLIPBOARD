import { createClient } from '@supabase/supabase-js';
import { sha256 } from './crypto';
import { mockBackend } from './mockBackend';

// Retrieve credentials from environment or localStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let localConfig = null;
  try {
    const raw = localStorage.getItem('quickclip_supabase_config');
    if (raw) localConfig = JSON.parse(raw);
  } catch {
    // Ignore parse error
  }

  const url = localConfig?.url || envUrl || '';
  const anonKey = localConfig?.anonKey || envKey || '';

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project.supabase.co') &&
    !anonKey.includes('your-anon-key')
  );

  return { url, anonKey, isConfigured };
}

export function saveCustomCredentials(url, anonKey) {
  if (!url || !anonKey) {
    localStorage.removeItem('quickclip_supabase_config');
  } else {
    localStorage.setItem(
      'quickclip_supabase_config',
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
  }
  // Re-instantiate client
  initClient();
}

let supabaseClient = null;

export function initClient() {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (isConfigured) {
    supabaseClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } else {
    supabaseClient = null;
  }
  return supabaseClient;
}

// Initial client initialization
initClient();

export function getSupabaseClient() {
  return supabaseClient;
}

export function isSupabaseReady() {
  return getSupabaseCredentials().isConfigured && supabaseClient !== null;
}

/**
 * Unified API Service: delegates to Supabase when configured, or to mockBackend otherwise.
 */
export const QuickClipApi = {
  async createRoom(roomId, token) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      const { data, error } = await supabaseClient.rpc('create_quickclip_room', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
        p_initial_text: '',
        p_expires_hours: 24,
      });

      if (error) {
        throw new Error(error.message || 'Failed to create room in Supabase');
      }

      return data;
    }

    return mockBackend.createRoom(roomId, tokenHash);
  },

  async verifyAndGetRoom(roomId, token) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      const { data, error } = await supabaseClient.rpc('verify_and_get_room', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
      });

      if (error) {
        throw new Error(error.message || 'Error connecting to database');
      }

      return data;
    }

    return mockBackend.verifyAndGetRoom(roomId, tokenHash);
  },

  async updateText(roomId, token, text, clientVersion) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      const { data, error } = await supabaseClient.rpc('update_room_text', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
        p_text: text,
        p_client_version: clientVersion,
      });

      if (error) {
        throw new Error(error.message || 'Failed to update text');
      }

      return data;
    }

    return mockBackend.updateText(roomId, tokenHash, text, clientVersion);
  },

  async clearText(roomId, token) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      const { data, error } = await supabaseClient.rpc('clear_room_text', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
      });

      if (error) {
        throw new Error(error.message || 'Failed to clear text');
      }

      return data;
    }

    return mockBackend.clearText(roomId, tokenHash);
  },

  async getImages(roomId, token) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      const { data, error } = await supabaseClient.rpc('get_room_images', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch room images');
      }

      // Generate signed URLs for private bucket images
      const imagesWithUrls = await Promise.all(
        (data.images || []).map(async (img) => {
          try {
            const { data: signedData } = await supabaseClient.storage
              .from('quickclip-images')
              .createSignedUrl(img.storage_path, 3600); // 1 hour valid
            return {
              ...img,
              url: signedData?.signedUrl || '',
            };
          } catch {
            return { ...img, url: '' };
          }
        })
      );

      return { success: true, images: imagesWithUrls };
    }

    return mockBackend.getImages(roomId, tokenHash);
  },

  async uploadImage(roomId, token, file, uploaderId, _onProgress) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      const imageId = crypto.randomUUID();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `rooms/${roomId}/${imageId}_${sanitizedName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabaseClient.storage
        .from('quickclip-images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // 2. Register metadata in PostgreSQL via secure RPC
      const { data, error: rpcError } = await supabaseClient.rpc('register_room_image', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
        p_image_id: imageId,
        p_storage_path: storagePath,
        p_original_filename: file.name,
        p_mime_type: file.type,
        p_file_size: file.size,
        p_uploader_id: uploaderId,
      });

      if (rpcError || !data?.success) {
        // Rollback storage upload if DB registration fails
        await supabaseClient.storage.from('quickclip-images').remove([storagePath]);
        throw new Error(rpcError?.message || data?.error || 'Database registration failed');
      }

      // 3. Generate signed URL for instant viewing
      const { data: signedData } = await supabaseClient.storage
        .from('quickclip-images')
        .createSignedUrl(storagePath, 3600);

      const registeredImage = {
        ...data.image,
        url: signedData?.signedUrl || '',
      };

      return { success: true, image: registeredImage };
    }

    return mockBackend.uploadImage(roomId, tokenHash, file, uploaderId);
  },

  async deleteImage(roomId, token, imageId) {
    const tokenHash = await sha256(token);

    if (isSupabaseReady()) {
      // 1. Delete image record from database
      const { data, error } = await supabaseClient.rpc('delete_room_image', {
        p_room_id: roomId,
        p_token_hash: tokenHash,
        p_image_id: imageId,
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to delete image record');
      }

      // 2. Delete file from storage
      if (data.storage_path) {
        await supabaseClient.storage
          .from('quickclip-images')
          .remove([data.storage_path]);
      }

      return { success: true };
    }

    return mockBackend.deleteImage(roomId, tokenHash, imageId);
  },

  /**
   * Subscribe to real-time events for a room
   */
  subscribe(roomId, callbacks) {
    if (!isSupabaseReady()) {
      return mockBackend.subscribe(roomId, callbacks);
    }

    const channelName = `quickclip:room:${roomId}`;
    const channel = supabaseClient.channel(channelName);

    // 1. Realtime Broadcast for typing & cursor/text sync (sub-100ms)
    channel
      .on('broadcast', { event: 'text-typing' }, (payload) => {
        if (callbacks.onTextUpdate) {
          callbacks.onTextUpdate(payload.payload);
        }
      })
      .on('broadcast', { event: 'image-added' }, (payload) => {
        if (callbacks.onImageAdded) {
          callbacks.onImageAdded(payload.payload);
        }
      })
      .on('broadcast', { event: 'image-deleted' }, (payload) => {
        if (callbacks.onImageDeleted) {
          callbacks.onImageDeleted(payload.payload.imageId);
        }
      });

    // 2. Postgres Changes listener for room_content (guaranteed persistence sync)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'room_content',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (callbacks.onPostgresTextUpdate) {
          callbacks.onPostgresTextUpdate(payload.new);
        }
      }
    );

    // 3. Postgres Changes listener for room_images
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_images',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (callbacks.onPostgresImageChange) {
          callbacks.onPostgresImageChange(payload);
        }
      }
    );

    // 4. Presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      if (callbacks.onPresenceSync) {
        callbacks.onPresenceSync(state);
      }
    });

    // 5. Connection state and presence tracking
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && callbacks.userPresence) {
        await channel.track(callbacks.userPresence);
      }
      if (callbacks.onStatusChange) {
        callbacks.onStatusChange(status);
      }
    });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  },

  /**
   * Send realtime broadcast event to room channel
   */
  async broadcastEvent(roomId, eventName, payload) {
    if (!isSupabaseReady()) {
      return;
    }
    const channelName = `quickclip:room:${roomId}`;
    const channel = supabaseClient.channel(channelName);
    return channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });
  },
};
