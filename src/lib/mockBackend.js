/**
 * QuickClip Local Sandbox Backend
 * Provides multi-tab real-time synchronization via BroadcastChannel and IndexedDB/localStorage
 * when Supabase credentials have not yet been provided in .env.
 * Ensures the application is fully functional for local demonstration, multi-tab testing, and review!
 */

const broadcastChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('quickclip_realtime_sandbox')
  : null;

// In-memory / storage stores
function getStore() {
  try {
    const raw = localStorage.getItem('quickclip_sandbox_db');
    return raw ? JSON.parse(raw) : { rooms: {}, content: {}, images: {} };
  } catch {
    return { rooms: {}, content: {}, images: {} };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem('quickclip_sandbox_db', JSON.stringify(store));
  } catch (err) {
    console.warn('Sandbox storage limit reached', err);
  }
}

export const mockBackend = {
  async createRoom(roomId, tokenHash) {
    const store = getStore();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    store.rooms[roomId] = {
      id: roomId,
      access_token_hash: tokenHash,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      last_activity_at: now.toISOString(),
      max_images: 50,
      max_storage_bytes: 104857600,
    };

    store.content[roomId] = {
      room_id: roomId,
      text_content: '',
      updated_at: now.toISOString(),
      version: 1,
    };

    if (!store.images[roomId]) {
      store.images[roomId] = [];
    }

    saveStore(store);

    return {
      id: roomId,
      expires_at: expiresAt,
      created_at: now.toISOString(),
      version: 1,
    };
  },

  async verifyAndGetRoom(roomId, tokenHash) {
    const store = getStore();
    const room = store.rooms[roomId];

    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (new Date(room.expires_at) <= new Date()) {
      return { success: false, error: 'ROOM_EXPIRED' };
    }

    if (room.access_token_hash !== tokenHash) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    // Refresh last activity and expiration
    const now = new Date();
    room.last_activity_at = now.toISOString();
    room.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    saveStore(store);

    const content = store.content[roomId] || {
      text_content: '',
      updated_at: now.toISOString(),
      version: 1,
    };

    const images = store.images[roomId] || [];
    const totalStorage = images.reduce((acc, img) => acc + (img.file_size || 0), 0);

    return {
      success: true,
      room: {
        ...room,
        image_count: images.length,
        total_storage_bytes: totalStorage,
      },
      content,
    };
  },

  async updateText(roomId, tokenHash, text, _clientVersion) {
    const store = getStore();
    const room = store.rooms[roomId];

    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };
    if (new Date(room.expires_at) <= new Date()) return { success: false, error: 'ROOM_EXPIRED' };
    if (room.access_token_hash !== tokenHash) return { success: false, error: 'UNAUTHORIZED' };

    const now = new Date().toISOString();
    const current = store.content[roomId] || { version: 0 };
    const newVersion = (current.version || 0) + 1;

    store.content[roomId] = {
      room_id: roomId,
      text_content: text,
      updated_at: now,
      version: newVersion,
    };

    room.last_activity_at = now;
    saveStore(store);

    // Notify other tabs
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'TEXT_UPDATED',
        roomId,
        text,
        version: newVersion,
        updatedAt: now,
      });
    }

    return { success: true, version: newVersion, updated_at: now };
  },

  async clearText(roomId, tokenHash) {
    return this.updateText(roomId, tokenHash, '', null);
  },

  async getImages(roomId, tokenHash) {
    const store = getStore();
    const room = store.rooms[roomId];
    if (!room || room.access_token_hash !== tokenHash) {
      return { success: false, error: 'UNAUTHORIZED' };
    }
    return {
      success: true,
      images: store.images[roomId] || [],
    };
  },

  async uploadImage(roomId, tokenHash, file, uploaderId) {
    const store = getStore();
    const room = store.rooms[roomId];
    if (!room || room.access_token_hash !== tokenHash) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    // Convert file to object URL / data URL for local sandbox
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageId = 'img_' + Math.random().toString(36).substring(2, 12);
        const newImg = {
          id: imageId,
          room_id: roomId,
          storage_path: `rooms/${roomId}/${imageId}_${file.name}`,
          original_filename: file.name,
          mime_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          uploader_id: uploaderId,
          url: reader.result, // base64 for sandbox preview
        };

        if (!store.images[roomId]) store.images[roomId] = [];
        store.images[roomId].unshift(newImg);
        saveStore(store);

        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'IMAGE_ADDED',
            roomId,
            image: newImg,
          });
        }

        resolve({ success: true, image: newImg });
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  async deleteImage(roomId, tokenHash, imageId) {
    const store = getStore();
    const room = store.rooms[roomId];
    if (!room || room.access_token_hash !== tokenHash) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    if (store.images[roomId]) {
      store.images[roomId] = store.images[roomId].filter((img) => img.id !== imageId);
      saveStore(store);
    }

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'IMAGE_DELETED',
        roomId,
        imageId,
      });
    }

    return { success: true };
  },

  subscribe(roomId, callbacks) {
    if (!broadcastChannel) return () => {};

    const handler = (event) => {
      const data = event.data;
      if (!data || data.roomId !== roomId) return;

      if (data.type === 'TEXT_UPDATED' && callbacks.onTextUpdate) {
        callbacks.onTextUpdate({
          text: data.text,
          version: data.version,
          updatedAt: data.updatedAt,
        });
      }

      if (data.type === 'IMAGE_ADDED' && callbacks.onImageAdded) {
        callbacks.onImageAdded(data.image);
      }

      if (data.type === 'IMAGE_DELETED' && callbacks.onImageDeleted) {
        callbacks.onImageDeleted(data.imageId);
      }
    };

    broadcastChannel.addEventListener('message', handler);
    return () => {
      broadcastChannel.removeEventListener('message', handler);
    };
  },
};
