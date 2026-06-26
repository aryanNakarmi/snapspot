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
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={copyEventLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? 'Copied!' : 'Copy Event Link'}
            </button>
            <Link
              href={`/event/${event.eventCode}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Open Event Page
            </Link>
          </div>
        </div>
      </header>

      {/* Photo Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Event Photos</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <PhotoGallery eventId={event.eventId} organizerId={user?.uid} />
        </div>
      </div>
    </main>
  );
}
