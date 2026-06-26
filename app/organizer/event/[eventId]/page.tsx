'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { getEventById } from '@/lib/eventService';
import PhotoGallery from '@/components/PhotoGallery';

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
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    loadEvent();
  }, [user, authLoading, eventId]);

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
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">⏳</div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/organizer/dashboard"
                className="text-gray-600 hover:text-gray-800 transition"
              >
                ← Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SnapSpot
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-1">{event.eventName}</h2>
              {event.eventDescription && (
                <p className="text-gray-600">{event.eventDescription}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  {event.photoCount || 0}
                </p>
                <p className="text-sm text-gray-600">Photos</p>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Event Code</p>
                <p className="text-lg font-mono font-bold">{event.eventCode}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={copyEventLink}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm flex items-center gap-2"
            >
              📋 Copy Event Link
            </button>
            <Link
              href={`/event/${event.eventCode}`}
              target="_blank"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
            >
              🔗 Open Event Page
            </Link>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="container mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold mb-6">📸 Event Photos</h3>
        <PhotoGallery eventId={event.eventId} organizerId={user?.uid} />
      </div>
    </main>
  );
}
