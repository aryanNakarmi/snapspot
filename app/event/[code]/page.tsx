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
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-4">
            <img src="/icons/icon-192.png" alt="SnapSpot" className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SnapSpot
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {event.eventName}
            </h1>
            {event.eventDescription && (
              <p className="text-slate-500 text-sm">{event.eventDescription}</p>
            )}
          </div>

          {/* Quick share button */}
          <div className="mt-4">
            <button
              onClick={() => {
                const link = `${window.location.origin}/event/${event.eventCode}`;
                navigator.clipboard.writeText(link);
                setCopied(true);
                showToast('Gallery link copied!', 'success');
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
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
              <div className="flex items-center justify-between mb-5">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComic(!showComic)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
    </main>
  );
}
