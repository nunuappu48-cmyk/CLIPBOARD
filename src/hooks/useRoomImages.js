import { useState, useEffect, useCallback } from 'react';
import { QuickClipApi } from '../lib/supabase';
import { validateImageFile } from '../lib/validation';

export function useRoomImages({ roomId, token, participantId, onToast }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState([]); // Array of { id, name, progress, status, error }
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // Fetch images from backend
  const loadImages = useCallback(async () => {
    if (!roomId || !token) return;

    try {
      setLoading(true);
      const res = await QuickClipApi.getImages(roomId, token);
      if (res && res.success) {
        setImages(res.images || []);
      }
    } catch (err) {
      console.error('Failed to load images:', err);
      if (onToast) onToast('Failed to load room images', 'error');
    } finally {
      setLoading(false);
    }
  }, [roomId, token, onToast]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Upload single file
  const uploadSingleFile = useCallback(
    async (file) => {
      // 1. Validation
      const validation = validateImageFile(file);
      if (!validation.valid) {
        if (onToast) onToast(validation.error, 'error');
        return;
      }

      const queueId = 'upload_' + Math.random().toString(36).substring(2, 9);
      const queueItem = {
        id: queueId,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 20,
      };

      setUploadQueue((prev) => [queueItem, ...prev]);

      try {
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, progress: 60 } : item))
        );

        const res = await QuickClipApi.uploadImage(
          roomId,
          token,
          file,
          participantId,
          (percent) => {
            setUploadQueue((prev) =>
              prev.map((item) => (item.id === queueId ? { ...item, progress: percent } : item))
            );
          }
        );

        if (res && res.success && res.image) {
          setImages((prev) => [res.image, ...prev.filter((img) => img.id !== res.image.id)]);
          setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));

          // Broadcast addition to other peers
          QuickClipApi.broadcastEvent(roomId, 'image-added', res.image).catch(() => {});

          if (onToast) {
            onToast(`Uploaded "${file.name}"`, 'success');
          }
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId ? { ...item, status: 'error', error: err.message } : item
          )
        );
        if (onToast) {
          onToast(`Upload failed: ${err.message}`, 'error');
        }
        // Remove failed item after 4 seconds
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
        }, 4000);
      }
    },
    [roomId, token, participantId, onToast]
  );

  // Upload multiple files
  const handleUploadFiles = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      for (const file of files) {
        await uploadSingleFile(file);
      }
    },
    [uploadSingleFile]
  );

  // Delete image
  const handleDeleteImage = useCallback(
    async (imageId) => {
      if (!roomId || !token || !imageId) return;

      try {
        // Optimistically update UI
        const removedImg = images.find((img) => img.id === imageId);
        setImages((prev) => prev.filter((img) => img.id !== imageId));

        if (activeLightboxImage?.id === imageId) {
          setActiveLightboxImage(null);
        }

        const res = await QuickClipApi.deleteImage(roomId, token, imageId);
        if (res && res.success) {
          // Broadcast deletion
          QuickClipApi.broadcastEvent(roomId, 'image-deleted', { imageId }).catch(() => {});
          if (onToast) {
            onToast('Image deleted', 'info');
          }
        } else {
          // Rollback if failed
          if (removedImg) setImages((prev) => [removedImg, ...prev]);
          if (onToast) onToast('Failed to delete image', 'error');
        }
      } catch (err) {
        console.error('Delete image error:', err);
        if (onToast) onToast(`Delete failed: ${err.message}`, 'error');
        loadImages();
      }
    },
    [roomId, token, images, activeLightboxImage, loadImages, onToast]
  );

  // Remote updates from Supabase Realtime
  const handleRemoteImageAdded = useCallback((newImage) => {
    setImages((prev) => {
      if (prev.some((img) => img.id === newImage.id)) return prev;
      return [newImage, ...prev];
    });
  }, []);

  const handleRemoteImageDeleted = useCallback((deletedImageId) => {
    setImages((prev) => prev.filter((img) => img.id !== deletedImageId));
    setActiveLightboxImage((cur) => (cur?.id === deletedImageId ? null : cur));
  }, []);

  // Global paste listener (Ctrl+V) for screenshots
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let foundImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            foundImage = true;
            const ext = blob.type.split('/')[1] || 'png';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const screenshotFile = new File([blob], `Screenshot_${timestamp}.${ext}`, {
              type: blob.type,
            });
            uploadSingleFile(screenshotFile);
          }
        }
      }

      if (foundImage) {
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [uploadSingleFile]);

  return {
    images,
    loading,
    uploadQueue,
    activeLightboxImage,
    setActiveLightboxImage,
    handleUploadFiles,
    handleDeleteImage,
    handleRemoteImageAdded,
    handleRemoteImageDeleted,
    refetchImages: loadImages,
  };
}
