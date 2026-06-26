'use client';

// Offline queue for photos using IndexedDB
// When the user is offline, photos are stored locally and uploaded when online

interface QueuedPhoto {
  id: string;
  eventId: string;
  fileData: string; // base64 data URL
  timestamp: number;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
}

const DB_NAME = 'snapspot-offline';
const DB_VERSION = 1;
const STORE_NAME = 'photo-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Queue a photo for later upload
export async function queuePhoto(
  eventId: string,
  file: File
): Promise<string> {
  const db = await openDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Read file as base64 data URL
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const photo: QueuedPhoto = {
    id,
    eventId,
    fileData,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(photo);

    request.onsuccess = () => {
      resolve(id);
      // Notify the service worker that there are pending uploads
      notifyPendingUploads();
    };
    request.onerror = () => reject(request.error);
  });
}

// Get all queued photos
export async function getQueuedPhotos(): Promise<QueuedPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get count of pending photos
export async function getPendingCount(): Promise<number> {
  const photos = await getQueuedPhotos();
  return photos.filter((p) => p.status === 'pending').length;
}

// Remove a photo from the queue after successful upload
export async function removeQueuedPhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Mark a photo as failed
export async function markPhotoFailed(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const photo = getRequest.result;
      if (photo) {
        photo.status = 'failed';
        photo.retryCount += 1;
        store.put(photo);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Process the queue - upload pending photos
export async function processQueue(
  uploadFn: (eventId: string, file: File) => Promise<void>
): Promise<{ success: number; failed: number }> {
  const photos = await getQueuedPhotos();
  const pending = photos.filter((p) => p.status === 'pending');

  let success = 0;
  let failed = 0;

  for (const photo of pending) {
    try {
      // Convert base64 back to File
      const response = await fetch(photo.fileData);
      const blob = await response.blob();
      const file = new File([blob], `photo-${photo.id}.jpg`, {
        type: 'image/jpeg',
      });

      await uploadFn(photo.eventId, file);
      await removeQueuedPhoto(photo.id);
      success++;
    } catch (error) {
      console.error('Failed to upload queued photo:', photo.id, error);
      await markPhotoFailed(photo.id);
      failed++;
    }
  }

  return { success, failed };
}

// Notify service worker that there are pending uploads
function notifyPendingUploads() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      (registration as any).sync.register('sync-photos').catch(() => {
        // Background sync not supported, will try on next online event
      });
    });
  }
}

// Listen for online status and process queue
export function setupOnlineListener(
  uploadFn: (eventId: string, file: File) => Promise<void>,
  onProgress?: (success: number, failed: number) => void
): () => void {
  const handleOnline = async () => {
    const result = await processQueue(uploadFn);
    if (result.success > 0 || result.failed > 0) {
      onProgress?.(result.success, result.failed);
    }
  };

  window.addEventListener('online', handleOnline);

  // Also check on initialization
  if (navigator.onLine) {
    handleOnline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
