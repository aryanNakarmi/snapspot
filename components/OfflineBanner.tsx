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

    getPendingCount().then(setPendingCount);

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
        getPendingCount().then(setPendingCount);
      }
    );

    return cleanup;
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div className="bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <p className="flex-1 text-sm font-medium">
            You are offline. Photos will be uploaded when connection is restored.
          </p>
        </div>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
        <div className="bg-indigo-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
            </svg>
          </div>
          <p className="flex-1 text-sm font-medium">
            Uploading {pendingCount} photo{pendingCount !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
