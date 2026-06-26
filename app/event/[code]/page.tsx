'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEventByCode } from '@/lib/eventService';
import CameraCapture from '@/components/CameraCapture';
import PhotoGallery from '@/components/PhotoGallery';
import Link from 'next/link';

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
    // Refresh gallery
    setUploadKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">⏳</div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-4">😔</p>
          <p className="text-xl text-gray-600 mb-4">{error}</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      {/* Header */}
      <div className="bg-white border-b mb-8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SnapSpot
            </h1>
          </div>
          <h2 className="text-3xl font-bold mb-2">{event.eventName}</h2>
          {event.eventDescription && (
            <p className="text-gray-600">{event.eventDescription}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">📸 Share a Photo</h3>
            <CameraCapture
              key={uploadKey}
              eventId={event.eventId}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>

          {/* Gallery Section */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🎉 Live Gallery</h3>
            <PhotoGallery eventId={event.eventId} organizerId={event.organizerId} />
          </div>
        </div>
      </div>
    </main>
  );
}
