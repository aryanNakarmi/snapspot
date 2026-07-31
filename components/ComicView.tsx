'use client';

import { useState, useMemo, useEffect } from 'react';
import { subscribeToPhotos } from '@/lib/eventService';
import { groupPhotos } from '@/lib/photoGrouping';
import type { Photo } from '@/lib/photoGrouping';
import RealComicBookLayout from '@/components/RealComicBookLayout';

interface ComicViewProps {
  eventId: string;
  eventName: string;
  eventDate?: string;
  eventDescription?: string;
}

// ════════════════════════════════════════════
// MAIN COMPONENT — wraps RealComicBookLayout with data
// ════════════════════════════════════════════

export default function ComicView({
  eventId,
  eventName,
  eventDate,
  eventDescription,
}: ComicViewProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToPhotos(eventId, (fetched) => {
      setPhotos(fetched);
      setLoading(false);
    });
    return unsub;
  }, [eventId]);

  const groups = useMemo(() => groupPhotos(photos), [photos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-slate-500">Creating comic book...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-24 bg-yellow-50 rounded-2xl border-4 border-black">
        <div className="text-6xl mb-4">📖</div>
        <p className="text-xl font-black mb-2">No Photos Yet!</p>
        <p className="text-slate-500">Upload photos to generate your comic book.</p>
      </div>
    );
  }

  return (
    <RealComicBookLayout
      groups={groups}
      eventName={eventName}
      eventDate={eventDate}
      eventDescription={eventDescription}
    />
  );
}
