'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { createEvent } from '@/lib/eventService';
import Link from 'next/link';

export default function CreateEvent() {
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!eventName.trim()) {
        setError('Event name is required');
        setLoading(false);
        return;
      }

      const { eventCode } = await createEvent(
        user.uid,
        eventName,
        eventDescription
      );

      router.push('/organizer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create New Event</h1>
              <p className="text-sm text-slate-500">Set up your event and get a QR code for guests to join</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder:text-slate-400"
                placeholder="e.g., Sarah's Wedding"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder:text-slate-400 resize-none"
                rows={4}
                placeholder="Optional: Add details about your event"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:shadow-md hover:shadow-indigo-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
