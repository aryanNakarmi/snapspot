'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPhotos(eventId, (fetchedPhotos) => {
      setPhotos(fetchedPhotos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Group photos using the smart semantic grouping
  const groups = useMemo(() => groupPhotos(photos), [photos]);

  // Auto-expand small groups (<= 4 photos) or any face/label groups
  useEffect(() => {
    const initiallyExpanded = new Set<string>();
    groups.forEach((g) => {
      if (g.photos.length <= 4 || g.type !== 'time') {
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

  // --- Navigation helpers ---
  const selectedPhoto = selectedPhotoIndex !== null && selectedPhotoIndex < photos.length
    ? photos[selectedPhotoIndex]
    : null;

  const goNext = useCallback(() => {
    setSelectedPhotoIndex((prev) => {
      if (prev === null || prev >= photos.length - 1) return prev;
      setImageLoaded(false);
      return prev + 1;
    });
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setSelectedPhotoIndex((prev) => {
      if (prev === null || prev <= 0) return prev;
      setImageLoaded(false);
      return prev - 1;
    });
  }, []);

  const openLightbox = useCallback((photo: Photo) => {
    // Use ID lookup instead of reference equality — Firestore creates new objects
    const idx = photos.findIndex(p => p.id === photo.id);
    if (idx >= 0) {
      setSelectedPhotoIndex(idx);
      setImageLoaded(false);
    }
  }, [photos]);

  const closeLightbox = useCallback(() => {
    setSelectedPhotoIndex(null);
    setImageLoaded(false);
  }, []);

  // Close lightbox if the selected photo was deleted by someone else
  useEffect(() => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex >= photos.length) {
      closeLightbox();
    }
  }, [photos.length, selectedPhotoIndex, closeLightbox]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, closeLightbox, goNext, goPrev]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPhotoIndex]);

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

  const groupHeaderStyle = (type: string) => {
    switch (type) {
      case 'face':
        return 'from-indigo-100 to-purple-100 text-indigo-600';
      case 'label':
        return 'from-emerald-100 to-teal-100 text-emerald-600';
      default:
        return 'from-slate-100 to-gray-100 text-slate-500';
    }
  };

  const groupLabelText = (type: string) => {
    switch (type) {
      case 'face': return 'text-indigo-800';
      case 'label': return 'text-emerald-800';
      default: return 'text-slate-800';
    }
  };

  // Keyboard hint component for lightbox
  const KeyboardHint = () => (
    <div className="hidden sm:flex items-center gap-4 text-white/40 text-xs">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">→</kbd>
        Navigate
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
        Close
      </span>
    </div>
  );

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
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${groupHeaderStyle(group.type)} flex items-center justify-center text-base`}>
                    {group.icon}
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${groupLabelText(group.type)}`}>
                      {group.label}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      · {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                    {group.type === 'label' && (
                      <span className="text-[10px] text-emerald-500 ml-1.5 font-medium uppercase tracking-wide">Auto</span>
                    )}
                    {group.type === 'face' && (
                      <span className="text-[10px] text-indigo-500 ml-1.5 font-medium uppercase tracking-wide">Face</span>
                    )}
                  </div>
                </div>

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

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg"
                    onClick={() => openLightbox(photo)}
                  >
                    <img
                      src={photo.cloudinaryUrl}
                      alt="Event photo"
                      className="w-full h-full object-cover border border-slate-100 group-hover:border-indigo-300 group-hover:shadow-md transition-all duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
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

      {/* Image Preview Lightbox */}
      {selectedPhotoIndex !== null && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          onClick={closeLightbox}
        >
          {/* Top Bar — click stops propagation so it doesn't close */}
          <div
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/60 to-transparent cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); downloadPhotoAsFile(selectedPhoto); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm rounded-lg hover:bg-white/20 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>

              {/* Photo labels */}
              {selectedPhoto.labels && selectedPhoto.labels.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  {selectedPhoto.labels.slice(0, 3).map((label, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 text-[10px] rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <KeyboardHint />
              <span className="text-sm text-white/60 font-medium tabular-nums">
                {selectedPhotoIndex + 1} of {photos.length}
              </span>
              <button
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
                onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Previous Button */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 sm:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/25 transition-all hover:scale-110 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {selectedPhotoIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 sm:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/25 transition-all hover:scale-110 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Image — only the image itself stops propagation */}
          <div className="relative z-10 p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
            {/* Loading Spinner */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              </div>
            )}

            <img
              src={selectedPhoto.cloudinaryUrl}
              alt="Event photo"
              className={`max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-all duration-300 select-none cursor-default ${
                imageLoaded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95'
              }`}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />
          </div>

          {/* Bottom Bar */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center px-4 sm:px-6 py-4 bg-gradient-to-t from-black/60 to-transparent cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-6">
              {selectedPhoto.uploadedAt && (
                <span className="text-white/50 text-xs">
                  {(selectedPhoto.uploadedAt as any)?.toDate?.()?.toLocaleString() || ''}
                </span>
              )}
              {selectedPhoto.labels && selectedPhoto.labels.length > 0 && (
                <div className="flex sm:hidden items-center gap-1.5">
                  {selectedPhoto.labels.slice(0, 2).map((label, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/10 text-white/60 text-[10px] rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Click hint at bottom center */}
          <span
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 text-white/30 text-xs cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            Click anywhere outside the photo to close
          </span>
        </div>
      )}
    </>
  );
}
