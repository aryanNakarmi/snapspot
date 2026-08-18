'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getEventByCode, getEventPhotos } from '@/lib/eventService';
import CameraCapture from '@/components/CameraCapture';
import PhotoGallery from '@/components/PhotoGallery';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { CopyIcon } from '@/components/Icons';
import ComicView from '@/components/ComicView';
import FindMeModal from '@/components/FindMeModal';

interface Event {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventDescription: string;
  organizerId: string;
}

export default function EventPage() {
  const params = useParams();
  const eventCode = params.code as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadKey, setUploadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showComic, setShowComic] = useState(false);
  const [showFindMe, setShowFindMe] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadEvent();
  }, [eventCode]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await getEventByCode(eventCode);
      if (!eventData) {
        setError('Event not found. Please check the event code.');
      } else {
        setEvent(eventData as Event);
      }
    } catch (err) {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setUploadKey((prev) => prev + 1);
  };

  const downloadAllPhotos = async () => {
    if (!event) return;
    setDownloadingAll(true);
    try {
      const photos = await getEventPhotos(event.eventId);
      if (photos.length === 0) {
        showToast('No photos to download', 'error');
        setDownloadingAll(false);
        return;
      }

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i] as any;
        if (photo.cloudinaryUrl) {
          try {
            const response = await fetch(photo.cloudinaryUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${event.eventName || 'photo'}-${i + 1}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch {
            window.open(photo.cloudinaryUrl, '_blank');
          }
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      showToast(`Downloaded ${photos.length} photos!`, 'success');
    } catch (err) {
      showToast('Failed to download photos', 'error');
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-slate-500">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-lg text-slate-700 mb-4">{error}</p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header — gradient hero band */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        {/* Decorative blur circles */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/5 blur-2xl animate-float" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-5 animate-fade-up">
            <img src="/icons/icon-192.png" alt="SnapSpot" className="w-7 h-7 rounded-lg ring-2 ring-white/40" />
            <span className="text-sm font-semibold text-white/90">SnapSpot</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Event
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-black/15 text-white/90 text-[10px] font-mono font-bold rounded-full">
                  {event.eventCode}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {event.eventName}
              </h1>
              {event.eventDescription && (
                <p className="text-white/80 text-sm max-w-xl">{event.eventDescription}</p>
              )}
            </div>

            {/* Quick share button */}
            <div className="animate-fade-up animation-delay-100 shrink-0">
              <button
                onClick={() => {
                  const link = `${window.location.origin}/event/${event.eventCode}`;
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  showToast('Gallery link copied!', 'success');
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-white/15 backdrop-blur-sm border border-white/25 rounded-lg hover:bg-white/25 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} />
                    Copy Gallery Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Share a Photo</h2>
              </div>
              <CameraCapture
                key={uploadKey}
                eventId={event.eventId}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </div>

          {/* Gallery Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowFindMe(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white text-xs font-medium rounded-lg hover:bg-pink-600 transition-colors flex-1 sm:flex-none"
                    title="Upload a selfie to find every photo you appear in"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Find Me
                  </button>
                  <button
                    onClick={() => setShowComic(!showComic)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 sm:flex-none ${
                      showComic
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                    title={showComic ? 'Back to gallery view' : 'View as interactive comic book'}
                  >
                    {showComic ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Gallery View
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7V4h16v3" />
                          <path d="M9 20h6" />
                          <path d="M12 4v16" />
                          <path d="M8 12h8" />
                        </svg>
                        View Comic
                      </>
                    )}
                  </button>
                  <button
                    onClick={downloadAllPhotos}
                    disabled={downloadingAll}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-1 sm:flex-none"
                  >
                    {downloadingAll ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download All
                      </>
                    )}
                  </button>
                </div>
              </div>
              {showComic ? (
                <ComicView
                  eventId={event.eventId}
                  eventName={event.eventName}
                  eventDate={new Date().toLocaleDateString()}
                  eventDescription={event.eventDescription}
                />
              ) : (
                <PhotoGallery eventId={event.eventId} organizerId={event.organizerId} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Find Me modal — on-device face matching */}
      {showFindMe && (
        <FindMeModal
          eventId={event.eventId}
          eventName={event.eventName}
          onClose={() => setShowFindMe(false)}
        />
      )}
    </main>
  );
}
