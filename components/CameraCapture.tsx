'use client';

import { useRef, useState, useEffect } from 'react';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinaryService';
import { addPhoto } from '@/lib/eventService';
import { queuePhoto } from '@/lib/offlineQueue';
import { moderateImage } from '@/lib/moderationService';
import { loadFaceModels, detectFaceDescriptors, areFaceModelsLoaded } from '@/lib/faceRecognition';

interface CameraCaptureProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

export default function CameraCapture({ eventId, onUploadSuccess }: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facesLoaded, setFacesLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<string | null>(null);

  // Load face-api.js models on mount (silent — doesn't block uploads)
  useEffect(() => {
    if (!areFaceModelsLoaded()) {
      loadFaceModels()
        .then(() => setFacesLoaded(true))
        .catch(() => console.warn('Face models not available — face grouping disabled'));
    } else {
      setFacesLoaded(true);
    }
  }, []);

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryPick = () => {
    galleryInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadBlob(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const uploadBlob = async (file: File) => {
    setUploading(true);
    setError(null);
    setFaceStatus(null);

    try {
      // Upload to Cloudinary
      const cloudinaryData = await uploadToCloudinary(file);

      // Run moderation via Google Vision API (for safety check only)
      const moderation = await moderateImage(cloudinaryData.url);

      // Check for inappropriate content
      if (moderation.flagged) {
        try {
          await deleteFromCloudinary(cloudinaryData.publicId);
        } catch {}
        setError(
          moderation.reason ||
            'This photo was flagged as inappropriate and cannot be uploaded.'
        );
        setUploading(false);
        return;
      }

      // Detect objects using Hugging Face Inference API (free, no time limit)
      let labels: string[] = [];
      try {
        const analysisRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: cloudinaryData.url }),
        });
        const analysis = await analysisRes.json();
        if (analysis.tags && analysis.tags.length > 0) {
          labels = analysis.tags;
        }
        if (analysis.error === 'RATE_LIMITED') {
          console.warn('Hugging Face rate limited — label grouping disabled for this upload');
        }
      } catch (err) {
        console.warn('Object detection failed:', err);
      }

      // Run face descriptor detection (if models loaded) — happens in background
      let faceDescriptors: number[][] = [];
      if (facesLoaded) {
        setFaceStatus('Analyzing faces...');
        try {
          faceDescriptors = await detectFaceDescriptors(cloudinaryData.url);
        } catch (err) {
          console.warn('Face detection failed:', err);
        }
        setFaceStatus(
          faceDescriptors.length > 0
            ? `${faceDescriptors.length} face${faceDescriptors.length > 1 ? 's' : ''} detected`
            : null
        );
      }

      // Handle offline
      if (!navigator.onLine) {
        await queuePhoto(eventId, file);
        setError('No internet connection. Photo will upload when you\'re back online.');
        setUploading(false);
        return;
      }

      // Save to Firestore with labels and face descriptors
      await addPhoto(eventId, {
        cloudinaryUrl: cloudinaryData.url,
        cloudinaryPublicId: cloudinaryData.publicId,
        phash: cloudinaryData.phash,
        uploaderDevice: navigator.userAgent,
        labels,
        faceDescriptors,
      });

      setUploading(false);
      onUploadSuccess?.();
    } catch (err: any) {
      if (!navigator.onLine || err.message?.includes('Network')) {
        await queuePhoto(eventId, file).catch(() => {});
        setError('No internet connection. Photo will upload when you\'re back online.');
      } else {
        setError(err.message || 'Upload failed. Please try again.');
      }
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {faceStatus && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{faceStatus}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Camera capture — opens native camera on mobile */}
        <button
          onClick={handleCameraCapture}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-3 rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-all font-medium shadow-sm"
        >
          {uploading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </>
          )}
        </button>
        {/* Hidden file input that opens native camera */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelected}
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Gallery picker */}
        <button
          onClick={handleGalleryPick}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-medium border border-slate-200 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Choose from Gallery
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
    </div>
  );
}
