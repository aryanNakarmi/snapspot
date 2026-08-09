'use client';

import { useEffect, useRef, useState } from 'react';
import { getEventPhotos } from '@/lib/eventService';
import {
  loadFaceModels,
  detectFaceDescriptors,
  faceDistance,
} from '@/lib/faceRecognition';

interface FindMeModalProps {
  eventId: string;
  eventName?: string;
  onClose: () => void;
}

interface EventPhoto {
  id: string;
  cloudinaryUrl: string;
  uploadedAt?: any;
  faceDescriptors?: { values: number[] }[];
}

type Step = 'intro' | 'analyzing' | 'results' | 'error';

/**
 * Face distance below this = "same person" (see lib/faceRecognition.ts).
 */
const MATCH_THRESHOLD = 0.6;

/**
 * Downscale the selfie to keep on-device face detection fast on phones.
 * Returns a JPEG data URL (never uploaded anywhere).
 */
const MAX_SELFIE_DIMENSION = 640;

function readAndResizeSelfie(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(
            1,
            MAX_SELFIE_DIMENSION / Math.max(img.width, img.height)
          );
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas is not supported in this browser');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function FindMeModal({
  eventId,
  eventName,
  onClose,
}: FindMeModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('intro');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [matches, setMatches] = useState<EventPhoto[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [error, setError] = useState('');

  // Pre-load the face models as soon as the modal opens (silent)
  useEffect(() => {
    loadFaceModels().catch(() => {});
  }, []);

  // Lock body scroll while the modal is open + close on Escape
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handlePickSelfie = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await runSearch(file);
  };

  const runSearch = async (file: File) => {
    setStep('analyzing');
    setError('');
    setMatches([]);

    try {
      // Read the selfie as a data URL (never leaves the device — no upload)
      const dataUrl = await readAndResizeSelfie(file);
      setSelfieUrl(dataUrl);

      await loadFaceModels();

      // 1) Find the face(s) in the selfie
      const selfieDescriptors = await detectFaceDescriptors(dataUrl);
      if (selfieDescriptors.length === 0) {
        setStep('error');
        setError(
          "We couldn't find a face in that photo. Try a clear, front-facing selfie with good lighting."
        );
        return;
      }

      // 2) Fetch all event photos
      const photos = (await getEventPhotos(eventId)) as EventPhoto[];
      setTotalPhotos(photos.length);

      // 3) Match the selfie against each photo's stored face descriptors
      const matched = photos.filter((photo) => {
        const stored = (photo.faceDescriptors || [])
          .map((f) => f?.values)
          .filter((v): v is number[] => Array.isArray(v) && v.length > 0);
        if (stored.length === 0) return false;
        return selfieDescriptors.some((selfieDescriptor) =>
          stored.some((d) => faceDistance(selfieDescriptor, d) < MATCH_THRESHOLD)
        );
      });

      setMatches(matched);
      setStep('results');
    } catch (err) {
      console.error('Find Me failed:', err);
      setStep('error');
      setError('Something went wrong while analyzing the photos. Please try again.');
    }
  };

  const reset = () => {
    setStep('intro');
    setSelfieUrl(null);
    setMatches([]);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Find Me</h2>
              <p className="text-xs text-slate-500">
                {eventName ? `${eventName} · ` : ''}find every photo you&apos;re in
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* ── Intro / selfie picker ── */}
          {step === 'intro' && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Upload a selfie to find yourself
              </h3>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-8">
                SnapSpot matches your face against every photo in the gallery so
                you can instantly find the ones you appear in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePickSelfie}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-200/60 hover:-translate-y-0.5 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Take a Selfie
                </button>
                <button
                  onClick={handlePickSelfie}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Choose from Gallery
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFile}
              />
              <p className="mt-8 flex items-center gap-1.5 text-xs text-slate-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Private &amp; on-device — your selfie is never uploaded.
              </p>
            </div>
          )}

          {/* ── Analyzing ── */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center text-center py-12">
              {selfieUrl && (
                <img
                  src={selfieUrl}
                  alt="Your selfie"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-100 mb-6"
                />
              )}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-pink-500 mb-4">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-medium text-slate-700 mb-1">
                Analyzing the gallery…
              </p>
              <p className="text-xs text-slate-400">
                Matching your face against the event photos
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-sm text-slate-700 max-w-sm mb-6">{error}</p>
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-200/60 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── Results ── */}
          {step === 'results' && (
            <div>
              {matches.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-pink-200 shrink-0">
                      {selfieUrl && (
                        <img src={selfieUrl} alt="Your selfie" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        You&apos;re in {matches.length}{' '}
                        {matches.length === 1 ? 'photo' : 'photos'} 🎉
                      </p>
                      <p className="text-xs text-slate-500">
                        out of {totalPhotos} {totalPhotos === 1 ? 'photo' : 'photos'} in this event
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {matches.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={photo.cloudinaryUrl}
                          alt="Photo with you in it"
                          className="w-full h-full object-cover border border-slate-100 group-hover:border-pink-300 group-hover:shadow-md transition-all duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>

                  <p className="mt-5 text-center text-xs text-slate-400">
                    Tip: tap a photo to open it — then download it from the gallery.
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    No photos found with your face yet
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                    {totalPhotos > 0
                      ? `We checked all ${totalPhotos} photos. You might not be in any yet — or keep an eye out, face tags are added as new photos come in.`
                      : "This event doesn't have any photos yet. Check back after guests start sharing!"}
                  </p>
                  <button
                    onClick={reset}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-200/60 transition-all"
                  >
                    Try a Different Selfie
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          {(step === 'results' || step === 'error') && (
            <div className="mt-6 flex justify-center gap-3">
              {step === 'results' && matches.length > 0 && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Try Another Selfie
                </button>
              )}
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200/60 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
