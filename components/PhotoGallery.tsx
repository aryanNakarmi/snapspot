'use client';

import { useEffect, useState } from 'react';
import { subscribeToPhotos, deletePhoto } from '@/lib/eventService';
import { useAuth } from '@/lib/authContext';

interface Photo {
  id: string;
  cloudinaryUrl: string;
  uploadedAt: any;
}


interface PhotoGalleryProps {
  eventId: string;
  organizerId?: string;
}

export default function PhotoGallery({
  eventId,
  organizerId,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPhotos(eventId, (fetchedPhotos) => {
      setPhotos(fetchedPhotos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await deletePhoto(eventId, photoId);
    } catch (error) {
      alert('Failed to delete photo');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin">⏳</div>
        <p className="text-gray-600 mt-2">Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl">📷</p>
        <p className="text-gray-600 mt-2">No photos yet. Be the first to upload!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group cursor-pointer">
            <img
              src={photo.cloudinaryUrl}
              alt="Event photo"
              className="w-full h-48 object-cover rounded-lg hover:opacity-75 transition"
              onClick={() => setSelectedPhoto(photo)}
            />
            {user?.uid === organizerId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo.id);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Full screen photo view */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </button>
          <img
            src={selectedPhoto.cloudinaryUrl}
            alt="Full screen"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
