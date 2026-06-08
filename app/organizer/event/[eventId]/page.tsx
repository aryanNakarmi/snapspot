'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { getOrganizerEvents, deleteEvent } from '@/lib/eventService';
import { generateQRCode, downloadQRCode } from '@/lib/qrGenerator';

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
  const { user, loading: authLoading, signOut } = useAuth();
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
      setEvents(userEvents);

      // Generate QR codes
      const codes: Record<string, string> = {};
      for (const event of userEvents) {
        codes[event.eventCode] = await generateQRCode(event.eventCode);
      }
      setQrCodes(codes);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(eventId);
      setEvents(events.filter((e) => e.eventId !== eventId));
    } catch (error) {
      alert('Failed to delete event');
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
          <div className="inline-block animate-spin mb-4">⏳</div>
          <p>Loading...</p>
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
            <p className="text-4xl mb-4">📭</p>
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
                <div className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-center">
                  {qrCodes[event.eventCode] && (
                    <img
                      src={qrCodes[event.eventCode]}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
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

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/organizer/event/${event.eventId}`}
                    className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-center"
                  >
                    View Event
                  </Link>
                  <button
                    onClick={() =>
                      downloadQRCode(event.eventCode, event.eventName)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title="Download QR Code"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.eventId)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Delete Event"
                  >
                    🗑️
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
