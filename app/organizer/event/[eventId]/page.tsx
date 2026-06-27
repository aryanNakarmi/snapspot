'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { getEventById, getEventPhotos } from '@/lib/eventService';
import { generateQRCode, downloadQRCode } from '@/lib/qrGenerator';
import { useToast } from '@/components/Toast';
import PhotoGallery from '@/components/PhotoGallery';
import { CopyIcon, DownloadIcon } from '@/components/Icons';

interface Event {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventDescription: string;
  organizerId: string;
  photoCount: number;
  createdAt: any;
}

export default function OrganizerEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    loadEvent();
  }, [user, authLoading, eventId]);

  useEffect(() => {
    let cancelled = false;
    if (event) {
      setQrLoading(true);
      generateQRCode(event.eventCode)
        .then((url) => {
          if (!cancelled) setQrCodeUrl(url);
        })
        .catch(() => {
          if (!cancelled) setQrCodeUrl(null);
        })
        .finally(() => {
          if (!cancelled) setQrLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [event]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await getEventById(eventId);
      if (!eventData) {
        router.push('/organizer/dashboard');
        return;
      }
      setEvent(eventData as Event);
    } catch (error) {
      console.error('Failed to load event:', error);
      router.push('/organizer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyEventLink = () => {
    if (event) {
      navigator.clipboard.writeText(`${window.location.origin}/event/${event.eventCode}`);
      setCopied(true);
      showToast('Event link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadAllPhotos = async () => {
    setDownloadingAll(true);
    try {
      const photos = await getEventPhotos(eventId);
      if (photos.length === 0) {
        showToast('No photos to download', 'error');
        setDownloadingAll(false);
        return;
      }

      // Download each photo sequentially with a small delay
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i] as any;
        if (photo.cloudinaryUrl) {
          // Use fetch + blob to trigger proper file downloads
          try {
            const response = await fetch(photo.cloudinaryUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${event?.eventName || 'photo'}-${i + 1}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch {
            // Fallback: open in new tab
            window.open(photo.cloudinaryUrl, '_blank');
          }
          // Small delay between downloads
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-slate-500">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/organizer/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Dashboard
            </Link>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SnapSpot
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                {event.eventName}
              </h1>
              {event.eventDescription && (
                <p className="text-sm text-slate-500">{event.eventDescription}</p>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{event.photoCount || 0}</p>
                <p className="text-xs text-slate-500">Photos</p>
              </div>
              <div className="text-center">
                <code className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold">
                  {event.eventCode}
                </code>
                <p className="text-xs text-slate-500 mt-1">Event Code</p>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
            <div className="flex items-start gap-6">
              {/* QR Code */}
              <div className="shrink-0">
                <div className="w-28 h-28 bg-white rounded-xl border border-indigo-100 flex items-center justify-center shadow-sm">
                  {qrLoading ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-300">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                    </svg>
                  ) : qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Link & Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="text-sm font-semibold text-indigo-900">Gallery link for guests</span>
                </div>

                {/* Event Link Display */}
                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 text-sm font-mono bg-white border border-indigo-100 px-3 py-2 rounded-lg text-indigo-700 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/event/${event.eventCode}` : `/event/${event.eventCode}`}
                  </code>
                  <button
                    onClick={() => downloadQRCode(event.eventCode, event.eventName)}
                    className="shrink-0 p-2 bg-white border border-indigo-100 text-indigo-500 rounded-lg hover:bg-indigo-50 transition"
                    title="Download QR Code"
                  >
                    <DownloadIcon size={16} />
                  </button>
                </div>

                <p className="text-xs text-indigo-600/70 mb-3">
                  Send this link to everyone — after the event, it becomes the shared photo album where guests can see all pictures together.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyEventLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon size={16} />
                        Copy Link
                      </>
                    )}
                  </button>
                  <Link
                    href={`/event/${event.eventCode}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Open Guest Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Photo Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Event Photos</h2>
          </div>
          <button
            onClick={downloadAllPhotos}
            disabled={downloadingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloadingAll ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All ({event.photoCount || 0})
              </>
            )}
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <PhotoGallery eventId={event.eventId} organizerId={user?.uid} />
        </div>
      </div>
    </main>
  );
}
