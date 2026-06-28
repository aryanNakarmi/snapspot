'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { getOrganizerEvents, deleteEvent } from '@/lib/eventService';
import { generateQRCode, downloadQRCode } from '@/lib/qrGenerator';
import { useToast } from '@/components/Toast';
import { CopyIcon, ShareIcon, DownloadIcon, TrashIcon, LinkIcon } from '@/components/Icons';

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
      setEvents(eventsArray as Event[]);

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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500 mb-4">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SnapSpot
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">My Events</h2>
          <Link
            href="/organizer/create"
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition"
          >
            + Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              You haven't created any events yet
            </p>
            <Link
              href="/organizer/create"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.eventId}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* QR Code */}
                <div className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-center h-40">
                  {qrCodes[event.eventCode] ? (
                    <img
                      src={qrCodes[event.eventCode]}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  ) : (
                    <p className="text-gray-400">Generating QR...</p>
                  )}
                </div>

                {/* Event Info */}
                <h3 className="text-xl font-bold mb-2">{event.eventName}</h3>
                {event.eventDescription && (
                  <p className="text-gray-600 text-sm mb-4">
                    {event.eventDescription}
                  </p>
                )}

                {/* Stats */}
                <div className="flex gap-4 mb-4 py-4 border-y">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">
                      {event.photoCount || 0}
                    </p>
                    <p className="text-sm text-gray-600">Photos</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                      {event.eventCode}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Event Code</p>
                  </div>
                </div>

                {/* Sharing */}
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon size={14} className="text-indigo-500" />
                    <span className="text-xs font-medium text-indigo-700">Share with guests</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => copyEventLink(event)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-xs font-medium"
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-xs font-medium"
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
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
                    className="px-3 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                    title="Download QR Code"
                  >
                    <DownloadIcon size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.eventId)}
                    className="px-3 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                    title="Delete Event"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}