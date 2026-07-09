'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeToPhotos, deletePhoto } from '@/lib/eventService';
import { useAuth } from '@/lib/authContext';
import { groupPhotos } from '@/lib/photoGrouping';
import type { Photo, PhotoGroup } from '@/lib/photoGrouping';

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPhotos(eventId, (fetchedPhotos) => {
      setPhotos(fetchedPhotos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Group photos using the grouping algorithm
  const groups = useMemo(() => groupPhotos(photos), [photos]);

  // Auto-expand groups that have > 4 photos (collapse the rest for a clean look)
  useEffect(() => {
    const initiallyExpanded = new Set<string>();
    groups.forEach((g) => {
      if (g.photos.length <= 4) {
        initiallyExpanded.add(g.id);
      }
    });
    setExpandedGroups(initiallyExpanded);
  }, [groups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const downloadPhotoAsFile = async (photo: Photo) => {
    try {
      const response = await fetch(photo.cloudinaryUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = (photo.uploadedAt as any)?.toDate?.()?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0];
      a.download = `snapspot-${timestamp}-${photo.id?.slice(0, 8) || 'photo'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open in new tab
      window.open(photo.cloudinaryUrl, '_blank');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await deletePhoto(eventId, photoId);
    } catch (error) {
      alert('Failed to delete photo');
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-indigo-500">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-slate-500">Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">No photos yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <>
      {/* Grouped Gallery */}
      <div className="space-y-8">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const showExpandButton = group.photos.length > 4;
          const displayPhotos = isExpanded ? group.photos : group.photos.slice(0, 4);

          return (
            <div key={group.id}>
              {/* Group Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {/* Moment icon */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{group.label}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      · {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                </div>

                {/* Expand/collapse for large groups */}
                {showExpandButton && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Show less
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Show all {group.photos.length}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Photo Grid for this group */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayPhotos.map((photo) => (
                  <div key={photo.id} className="relative group cursor-pointer aspect-square">
                    <img
                      src={photo.cloudinaryUrl}
                      alt="Event photo"
                      className="w-full h-full object-cover rounded-lg border border-slate-100 group-hover:border-indigo-300 group-hover:shadow-md transition-all"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPhotoAsFile(photo);
                        }}
                        className="bg-white/90 backdrop-blur-sm text-slate-600 p-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                        title="Download photo"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      {user?.uid === organizerId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                          className="bg-white/90 backdrop-blur-sm text-red-500 p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete photo"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show +N more if collapsed */}
              {!isExpanded && showExpandButton && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="mt-2 w-full py-2 text-xs font-medium text-indigo-500 bg-indigo-50/50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  +{group.photos.length - 4} more {group.photos.length - 4 === 1 ? 'photo' : 'photos'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={() => downloadPhotoAsFile(selectedPhoto)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <img
            src={selectedPhoto.cloudinaryUrl}
            alt="Full screen photo"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Bottom hint */}
          <p className="absolute bottom-4 text-white/50 text-xs">
            Click outside to close · Download button above
          </p>
        </div>
      )}
    </>
  );
}
