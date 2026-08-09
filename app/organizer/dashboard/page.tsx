'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { getOrganizerEvents, deleteEvent, getPhotoCount } from '@/lib/eventService';
import { generateQRCode, downloadQRCode } from '@/lib/qrGenerator';
import { useToast } from '@/components/Toast';
import { CopyIcon, ShareIcon, DownloadIcon, TrashIcon, LinkIcon } from '@/components/Icons';
import ConfirmModal from '@/components/ConfirmModal';

interface Event {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventDescription: string;
  photoCount: number;
  createdAt: any;
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    loadEvents();
  }, [user, authLoading]);

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userEvents = await getOrganizerEvents(user.uid);

      // Make sure it's an array
      const eventsArray = Array.isArray(userEvents) ? userEvents : [];

      // Fetch real photo counts for all events in parallel
      const eventsWithCounts = await Promise.all(
        eventsArray.map(async (event) => {
          const count = await getPhotoCount(event.eventId);
          return { ...event, photoCount: count };
        })
      );
      setEvents(eventsWithCounts as Event[]);

      // Generate QR codes
      const codes: Record<string, string> = {};
      for (const event of eventsArray) {
        try {
          codes[event.eventCode] = await generateQRCode(event.eventCode);
        } catch (err) {
          console.error('Error generating QR for', event.eventCode, err);
        }
      }
      setQrCodes(codes);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyEventLink = (event: Event) => {
    const link = `${window.location.origin}/event/${event.eventCode}`;
    navigator.clipboard.writeText(link);
    setCopiedEventId(event.eventId);
    showToast('Event link copied to clipboard!', 'success');
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const shareEvent = async (event: Event) => {
    const link = `${window.location.origin}/event/${event.eventCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SnapSpot - ${event.eventName}`,
          text: `Share your photos at ${event.eventName}! Upload here:`,
          url: link,
        });
      } catch (err) {
        // User cancelled or share failed
        if (err instanceof Error && err.name !== 'AbortError') {
          copyEventLink(event);
        }
      }
    } else {
      // Fallback: copy link if Web Share API is not available
      copyEventLink(event);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(eventId);
      setEvents(events.filter((e) => e.eventId !== eventId));
      showToast('Event deleted', 'info');
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500 mb-4">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-slate-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/90 border-b border-slate-200/70 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon-192.png" alt="SnapSpot" className="w-9 h-9 rounded-lg shadow-sm" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SnapSpot
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 pl-3 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-slate-600 max-w-[180px] truncate">{user?.email}</span>
              </div>
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Heading + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">My Events</h2>
            <p className="text-sm text-slate-500 mt-1">
              Create, share, and grow your event galleries
            </p>
          </div>
          <Link
            href="/organizer/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200/60 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="relative inline-flex mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center ring-4 ring-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-2">
              You haven&apos;t created any events yet
            </p>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Create your first event to get a QR code and a shared gallery your guests will love.
            </p>
            <Link
              href="/organizer/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200/60 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Your First Event
            </Link>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
                <p className="text-3xl font-bold text-slate-900">{events.length}</p>
                <p className="text-xs text-slate-500 mt-1">Active Events</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
                <p className="text-3xl font-bold text-indigo-600">{totalPhotos}</p>
                <p className="text-xs text-slate-500 mt-1">Total Photos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, idx) => (
                <div
                  key={event.eventId}
                  className="group bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 80, 400)}ms` }}
                >
                  {/* QR Code */}
                  <div className="relative m-3 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-slate-100 flex items-center justify-center h-44 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgb(99_102_241/0.15)_1px,transparent_0)] [background-size:16px_16px]" />
                    {qrCodes[event.eventCode] ? (
                      <img
                        src={qrCodes[event.eventCode]}
                        alt="QR Code"
                        className="w-32 h-32 relative drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <p className="text-gray-400 text-sm relative">Generating QR...</p>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-500 text-[10px] font-mono font-bold rounded-md">
                      {event.eventCode}
                    </span>
                  </div>

                  <div className="px-5 pb-5">
                    {/* Event Info */}
                    <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{event.eventName}</h3>
                    {event.eventDescription && (
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                        {event.eventDescription}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 py-3 border-y border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 leading-none">{event.photoCount || 0}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Photos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 leading-none">Live</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Status</p>
                        </div>
                      </div>
                    </div>

                    {/* Sharing */}
                    <div className="mb-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon size={14} className="text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-700">Share with guests</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => copyEventLink(event)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 active:scale-95 transition text-xs font-medium"
                        >
                          {copiedEventId === event.eventId ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <CopyIcon size={14} />
                              Copy Link
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => shareEvent(event)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 active:scale-95 transition text-xs font-medium"
                        >
                          <ShareIcon size={14} />
                          Share
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/organizer/event/${event.eventId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-95 transition text-sm font-medium"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Gallery
                      </Link>
                      <button
                        onClick={() =>
                          downloadQRCode(event.eventCode, event.eventName)
                        }
                        className="px-3.5 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition"
                        title="Download QR Code"
                        aria-label="Download QR Code"
                      >
                        <DownloadIcon size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.eventId)}
                        className="px-3.5 py-2 border border-slate-200 text-slate-400 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 active:scale-95 transition"
                        title="Delete Event"
                        aria-label="Delete Event"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sign-out confirmation modal */}
      {showSignOutConfirm && (
        <ConfirmModal
          title="Sign out of SnapSpot?"
          message="You'll need to sign in again to manage your events."
          confirmLabel="Sign Out"
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </main>
  );
}
