'use client';

import { useEffect, useState } from 'react';
import {
  getPendingCount,
  setupOnlineListener,
} from '@/lib/offlineQueue';
import { uploadToCloudinary } from '@/lib/cloudinaryService';
import { addPhoto } from '@/lib/eventService';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      const count = await getPendingCount();
      setPendingCount(count);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count on mount
    getPendingCount().then(setPendingCount);

    // Periodically check pending count
    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Process offline queue when coming back online
  useEffect(() => {
    const cleanup = setupOnlineListener(
      async (eventId: string, file: File) => {
        const cloudinaryData = await uploadToCloudinary(file);
        await addPhoto(eventId, {
          cloudinaryUrl: cloudinaryData.url,
          cloudinaryPublicId: cloudinaryData.publicId,
          uploaderDevice: navigator.userAgent,
        });
      },
      (success, failed) => {
        // Refresh count after processing
        getPendingCount().then(setPendingCount);
      }
    );

    return cleanup;
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div className="bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span>📡</span>
          <span className="flex-1 text-sm font-medium">
            You are offline. Photos will be uploaded when connection is restored.
          </span>
        </div>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span>🔄</span>
          <span className="flex-1 text-sm font-medium">
            Uploading {pendingCount} photo{pendingCount !== 1 ? 's' : ''}...
          </span>
        </div>
      </div>
    );
  }

  return null;
}
