'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import type { Photo, PhotoGroup } from '@/lib/photoGrouping';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ComicPage {
  title: string;
  subtitle?: string;
  panels: ComicPanel[];
  highlightedObject?: string;
  actLabel?: string;
}

export interface ComicPanel {
  type: 'large' | 'medium' | 'small' | 'double';
  photos: Photo[];
  caption: string;
  speechBubble?: string;
  effect?: string;
}

/** Panel with grid position for asymmetrical layout */
interface GridPanel extends ComicPanel {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface RealComicLayoutProps {
  groups: PhotoGroup[];
  eventName: string;
  eventDate?: string;
  eventDescription?: string;
}

const OBJECTS_EMOJIS: Record<string, string> = {
  cake: '🎂',
  people: '👥',
  phone: '📱',
  laptop: '💻',
  food: '🍽️',
  decorations: '🎉',
  dancing: '💃',
  singing: '🎤',
  laughing: '😄',
  cake_cutting: '🔪',
  balloon: '🎈',
  flower: '🌸',
  gift: '🎁',
  firework: '🎆',
  music: '🎵',
  camera: '📷',
  glasses: '👓',
  hat: '🎩',
};

// Halftone dot pattern SVG (reusable)
const HALFTONE_DOTS = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='3' cy='3' r='1.5' fill='%23000' opacity='0.12'/%3E%3Ccircle cx='9' cy='9' r='1.2' fill='%23000' opacity='0.08'/%3E%3C/svg%3E")`;

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function RealComicBookLayout({
  groups,
  eventName,
  eventDate,
  eventDescription,
}: RealComicLayoutProps) {
  const pageContentRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  // Grid columns: 4 on desktop, 2 on phones so panels stay wide enough to see photos
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const updateCols = () => setCols(mq.matches ? 4 : 2);
    updateCols();
    mq.addEventListener('change', updateCols);
    return () => mq.removeEventListener('change', updateCols);
  }, []);

  const pages = useMemo(() => generateComicPages(groups, eventName), [groups, eventName]);
  const currentPage = pages[currentPageIndex] || pages[0];
  const totalPages = pages.length;

  const totalPhotos = groups.reduce((sum, g) => sum + g.photos.length, 0);

  const downloadAllPages = useCallback(async () => {
    if (!pageContentRef.current || downloadingAll) return;
    cancelRef.current = false;
    setDownloadingAll(true);
    const originalIndex = currentPageIndex;
    try {
      for (let i = 0; i < totalPages; i++) {
        if (cancelRef.current) break;

        // Set the page
        setCurrentPageIndex(i);
        // Wait for React to render the new page
        await new Promise((r) => setTimeout(r, 300));

        // Wait for images to load
        if (pageContentRef.current) {
          const imgs = pageContentRef.current.querySelectorAll('img');
          await Promise.all(
            Array.from(imgs).map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete) resolve();
                  else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                  }
                })
            )
          );
          // Extra wait for layout to settle
          await new Promise((r) => setTimeout(r, 200));
        }

        if (cancelRef.current) break;

        // Capture
        const canvas = await html2canvas(pageContentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#f5f0e8',
          logging: false,
        });

        // Download
        const link = document.createElement('a');
        const pageNum = String(i + 1).padStart(2, '0');
        link.download = `${eventName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}-page-${pageNum}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small gap between downloads
        await new Promise((r) => setTimeout(r, 500));
      }
    } finally {
      setCurrentPageIndex(originalIndex);
      setDownloadingAll(false);
    }
  }, [totalPages, eventName]);

  if (pages.length === 0) {
    return (
      <div className="text-center py-24 bg-yellow-50 rounded-2xl border-4 border-black">
        <div className="text-6xl mb-4">📖</div>
        <p className="text-xl font-black mb-2">No Photos Yet!</p>
        <p className="text-slate-500">Upload photos to generate your comic book.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* ══════ COMIC BOOK COVER ══════ */}
        <ComicCover
          eventName={eventName}
          eventDate={eventDate}
          eventDescription={eventDescription}
          totalPhotos={totalPhotos}
          totalGroups={groups.length}
        />

        {/* ══════ CURRENT PAGE ══════ */}
        <div className="mt-10 mb-8" ref={pageContentRef}>
          {/* Page header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-black text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2">
              {currentPage.actLabel || 'Chapter'}
            </div>
            <h2
              className="text-3xl md:text-4xl font-black text-black leading-tight"
              style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive" }}
            >
              {currentPage.title}
            </h2>
            {currentPage.subtitle && (
              <p className="text-sm text-slate-600 mt-1 italic">{currentPage.subtitle}</p>
            )}
            {currentPage.highlightedObject && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-5 py-1.5 bg-yellow-300 border-3 border-black rounded-full text-xs font-black uppercase tracking-wider">
                🎯 featuring: {currentPage.highlightedObject}
              </div>
            )}
          </div>

          {/* ══════ ASYMMETRICAL PANELS ══════ */}
          <AsymmetricalGrid
            panels={currentPage.panels}
            onPhotoClick={setSelectedPhoto}
            cols={cols}
          />
        </div>

        {/* ══════ PAGE NAVIGATION ══════ */}
        <div className="sticky bottom-4 z-40">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl border-4 border-yellow-400 shadow-2xl px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                  disabled={currentPageIndex === 0}
                  aria-label="Previous page"
                  className="inline-flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto px-0 sm:px-4 py-2 bg-red-500 text-white font-black text-sm rounded-xl hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <button
                  onClick={downloadAllPages}
                  disabled={downloadingAll}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white font-black text-xs rounded-xl hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Download all pages as separate PNGs"
                >
                  {downloadingAll ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {totalPages > 1 ? `${totalPages} pages` : 'Download'}
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex gap-1">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPageIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentPageIndex
                          ? 'bg-yellow-400 scale-125'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-black text-sm tabular-nums">
                  <span className="text-yellow-400">{currentPageIndex + 1}</span>
                  <span className="opacity-50"> / {totalPages}</span>
                </span>
              </div>

              <button
                onClick={() => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPageIndex >= totalPages - 1}
                aria-label="Next page"
                className="inline-flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto px-0 sm:px-4 py-2 bg-blue-500 text-white font-black text-sm rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <span className="hidden sm:inline">Next</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Mobile-only full-width download button */}
            <button
              onClick={downloadAllPages}
              disabled={downloadingAll}
              className="mt-3 w-full sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-500 text-white font-black text-xs rounded-xl hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Download all pages as separate PNGs"
            >
              {downloadingAll ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download all {totalPages > 1 ? `${totalPages} pages` : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ══════ COMIC STATISTICS ══════ */}
        <ComicStatistics groups={groups} totalPages={totalPages} />

        {/* ══════ PHOTO MODAL ══════ */}
        {selectedPhoto && (
          <ComicPhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMIC COVER
// ─────────────────────────────────────────────

function ComicCover({
  eventName,
  eventDate,
  eventDescription,
  totalPhotos,
  totalGroups,
}: {
  eventName: string;
  eventDate?: string;
  eventDescription?: string;
  totalPhotos: number;
  totalGroups: number;
}) {
  return (
    <div className="relative bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 rounded-2xl p-8 md:p-14 shadow-2xl border-[8px] border-black overflow-hidden">
      {/* Decorative speed lines */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] bg-white"
            style={{
              left: '10%',
              top: `${8 + i * 11}%`,
              width: `${30 + (i * 17) % 50}%`,
              transform: `rotate(${i % 2 === 0 ? '2deg' : '-2deg'})`,
            }}
          />
        ))}
      </div>

      {/* Corner burst accents */}
      <div className="absolute -top-3 -left-3 w-16 h-16 bg-yellow-300 rotate-12 border-4 border-black rounded-lg opacity-80" />
      <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-yellow-300 -rotate-12 border-4 border-black rounded-lg opacity-80" />

      {/* Badge */}
      <div className="absolute top-4 right-4 bg-yellow-300 rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border-[5px] border-black shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300 z-10">
        <span className="text-4xl md:text-5xl">⭐</span>
      </div>

      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          📖 Limited Edition
        </div>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-3 leading-tight"
          style={{
            textShadow: '4px 4px 0 #000, 8px 8px 0 rgba(0,0,0,0.3)',
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive",
          }}
        >
          {eventName}
        </h1>
        <div className="h-1 bg-white/60 w-24 mx-auto mb-4 rounded-full" />
        <p className="text-xl md:text-2xl text-yellow-200 font-black mb-2">
          COMIC BOOK EDITION
        </p>
        {eventDate && (
          <p className="text-white/90 text-sm md:text-base font-bold">{eventDate}</p>
        )}
        {eventDescription && (
          <p className="text-white/80 text-sm mt-4 italic max-w-xl mx-auto leading-relaxed">
            &ldquo;{eventDescription}&rdquo;
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-6 text-white/80 text-xs font-bold">
          <span>{totalPhotos} 📸 photos</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>{totalGroups} 👥 characters</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>⚡ SnapSpot</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ASYMMETRICAL GRID — all panels in one interlocking grid
// ─────────────────────────────────────────────

interface AsymmetricalGridProps {
  panels: ComicPanel[];
  onPhotoClick: (photo: Photo) => void;
  cols: number;
}

function AsymmetricalGrid({ panels, onPhotoClick, cols }: AsymmetricalGridProps) {
  const gridPanels = useMemo(() => layoutAsymmetrical(panels, cols), [panels, cols]);
  const maxRow = Math.max(...gridPanels.map((p) => p.row + p.rowSpan), 1);

  return (
    <div
      className="relative"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${maxRow}, auto)`,
        gap: '12px',
      }}
    >
      {gridPanels.map((panel, idx) => (
        <AsymPanelCell
          key={idx}
          panel={panel}
          index={idx}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </div>
  );
}

interface AsymPanelCellProps {
  panel: GridPanel;
  index: number;
  onPhotoClick: (photo: Photo) => void;
}

function AsymPanelCell({ panel, index, onPhotoClick }: AsymPanelCellProps) {
  const isHero = panel.type === 'large';
  const subGridClass = getSubGridClass(panel.type);

  return (
    <div
      className="relative group"
      style={{
        gridColumn: `${panel.col + 1} / span ${panel.colSpan}`,
        gridRow: `${panel.row + 1} / span ${panel.rowSpan}`,
      }}
    >
      <div className="relative h-full bg-white border-[5px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] rounded-lg overflow-hidden flex flex-col">
        {/* Comic Effect bubble */}
        {panel.effect && (
          <div
            className="absolute -top-4 -left-3 z-20 bg-yellow-300 rounded-full px-4 py-2 border-[4px] border-black font-black text-sm md:text-base shadow-lg"
            style={{
              transform: `rotate(${index % 2 === 0 ? '-8deg' : '6deg'})`,
              fontFamily: "'Comic Sans MS', cursive",
            }}
          >
            {panel.effect}
          </div>
        )}

        {/* Halftone background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: HALFTONE_DOTS }}
        />

        {/* Caption bar */}
        <div className="relative z-10 bg-black text-white px-3 py-2 font-black text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-yellow-300">📍</span>
          <span className="truncate">{panel.caption}</span>
        </div>

        {/* Photos sub-grid — no padding, images touch the border */}
        <div className="relative z-10 flex-1">
          <div className={`grid ${subGridClass} gap-0 h-full`}>
            {panel.photos.map((photo) => (
              <PanelPhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => onPhotoClick(photo)}
                isLarge={isHero}
              />
            ))}
          </div>
        </div>

        {/* Speech bubble */}
        {panel.speechBubble && (
          <div className="relative z-10 px-3 pb-3">
            <SpeechBubble text={panel.speechBubble} />
          </div>
        )}
      </div>
    </div>
  );
}

function getSubGridClass(type: string): string {
  switch (type) {
    case 'large':
      return 'grid-cols-1';
    case 'double':
      return 'grid-cols-1 md:grid-cols-2';
    case 'medium':
      return 'grid-cols-2';
    case 'small':
      return 'grid-cols-2';
    default:
      return 'grid-cols-1';
  }
}

// ─────────────────────────────────────────────
// PANEL PHOTO CARD
// ─────────────────────────────────────────────

interface PanelPhotoCardProps {
  photo: Photo;
  onClick: () => void;
  isLarge?: boolean;
}

function PanelPhotoCard({ photo, onClick, isLarge }: PanelPhotoCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer group relative bg-black overflow-hidden h-full"
    >
      {/* Image — full photo always visible, letterboxed on black so nothing gets cropped */}
      <div
        className={`relative overflow-hidden bg-black h-full ${
          isLarge ? 'min-h-[180px] sm:min-h-[240px]' : 'min-h-[120px] sm:min-h-[160px]'
        }`}
      >
        <img
          src={photo.cloudinaryUrl}
          alt={photo.labels?.[0] || 'Event photo'}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          crossOrigin="anonymous"
        />

        {/* Comic halftone overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage: HALFTONE_DOTS }}
        />

        {/* Hover glow */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SPEECH BUBBLE
// ─────────────────────────────────────────────

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="relative mt-2">
      {/* Bubble tail */}
      <div className="absolute -top-2.5 left-8 w-0 h-0">
        <div
          className="border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-white"
          style={{
            filter: 'drop-shadow(0 -2px 0 #000)',
          }}
        />
        <div className="absolute top-[2px] left-[-8px] border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-white" />
      </div>

      {/* Bubble */}
      <div
        className="bg-white border-[4px] border-black rounded-2xl px-5 py-3 shadow-lg"
        style={{
          borderRadius: '20px 20px 20px 4px',
        }}
      >
        <p
          className="font-black text-sm md:text-base italic text-center leading-relaxed"
          style={{ fontFamily: "'Comic Sans MS', cursive" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMIC STATISTICS
// ─────────────────────────────────────────────

interface ComicStatisticsProps {
  groups: PhotoGroup[];
  totalPages: number;
}

function ComicStatistics({ groups, totalPages }: ComicStatisticsProps) {
  const totalPhotos = groups.reduce((sum, g) => sum + g.photos.length, 0);
  const totalFaces = groups.filter((g) => g.type === 'face').length;
  const totalLabels = groups.filter((g) => g.type === 'label').length;

  return (
    <div className="mt-12 bg-black border-[5px] border-yellow-400 rounded-2xl p-6 md:p-8">
      <h3 className="text-2xl font-black text-yellow-300 mb-6 text-center">
        Comic Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value={totalFaces > 0 ? totalFaces : groups.length} label="CHARACTERS" />
        <StatCard value={totalPhotos} label="PHOTOS" />
        <StatCard value={totalPages} label="PAGES" />
        <StatCard value={totalLabels > 0 ? totalLabels : '∞'} label="OBJECTS" />
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center bg-black/40 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors">
      <div className="text-3xl md:text-4xl font-black text-yellow-300">{value}</div>
      <div className="text-xs font-bold text-white/70 mt-1 tracking-wider">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PHOTO MODAL
// ─────────────────────────────────────────────

interface ComicPhotoModalProps {
  photo: Photo;
  onClose: () => void;
}

function ComicPhotoModal({ photo, onClose }: ComicPhotoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border-[6px] border-black relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white border-[4px] border-black rounded-full flex items-center justify-center font-black text-xl hover:bg-red-50 transition-colors shadow-lg z-10 hover:scale-110 active:scale-95"
        >
          ✕
        </button>

        {/* Comic header bar */}
        <div className="bg-black text-white px-5 py-3 rounded-t-lg border-b-[4px] border-black flex items-center gap-2">
          <span className="text-yellow-300">📸</span>
          <span className="font-black text-sm uppercase tracking-wider">
            {photo.labels?.[0] || 'Event Photo'}
          </span>
        </div>

        {/* Image */}
        <div className="relative overflow-hidden bg-gray-100">
          <img
            src={photo.cloudinaryUrl}
            alt={photo.labels?.[0] || 'Event photo'}
            className="w-full h-auto max-h-[75vh] object-contain"
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: HALFTONE_DOTS }}
          />
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[5px] border-l-[5px] border-black/20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[5px] border-r-[5px] border-black/20 pointer-events-none" />
        </div>

        {/* Labels */}
        {photo.labels && photo.labels.length > 0 && (
          <div className="bg-yellow-50 px-5 py-3 border-t-[3px] border-black">
            <p className="font-bold text-xs text-black/60 mb-2">DETECTED OBJECTS</p>
            <div className="flex flex-wrap gap-1.5">
              {photo.labels.map((obj) => (
                <span
                  key={obj}
                  className="inline-flex items-center gap-1 bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-bold border-2 border-black"
                >
                  {OBJECTS_EMOJIS[obj.toLowerCase()] || '🏷️'} {obj}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMIC PAGE GENERATION – DYNAMIC SCALING ENGINE
// ─────────────────────────────────────────────

function generateComicPages(groups: PhotoGroup[], eventName: string): ComicPage[] {
  const pages: ComicPage[] = [];
  if (groups.length === 0) return pages;

  const allPhotos = groups.flatMap((g) => g.photos);
  let usedCount = 0;

  // ── PAGE 1: ACT 1 — Character Introduction ──
  const firstGroup = groups[0];
  const introCount = Math.min(5, firstGroup.photos.length);
  const introPhotos = firstGroup.photos.slice(0, introCount);

  if (introPhotos.length > 0) {
    pages.push(makePage(introPhotos, {
      act: 'Act 1',
      title: `🎬 ACT 1: The Beginning`,
      subtitle: `Introducing ${firstGroup.label}`,
      firstCaption: `${firstGroup.label} makes an entrance!`,
      firstEffect: pickEffect('action'),
      isFirstPage: true,
      eventName,
    }));
    usedCount = introPhotos.length;
  }

  // ── MIDDLE PAGES: Keep creating pages until photos run out ──
  const remaining = allPhotos.slice(usedCount);
  const actNames = ['Scene', 'Moments', 'Highlights', 'Memories', 'Story', 'Captured', 'Moments II', 'Continued', 'Scenes II'];
  let actIndex = 1;

  // Reserve last 1-4 photos for the finale
  const finaleReserve = Math.min(4, Math.max(1, Math.floor(remaining.length / 6)));
  const availableForMiddle = remaining.length - finaleReserve;

  let sliceStart = 0;
  while (sliceStart < availableForMiddle) {
    const photosLeft = availableForMiddle - sliceStart;
    // Each middle page gets 4-6 photos (more for the ones with more left)
    const batchSize = Math.min(photosLeft, photosLeft <= 4 ? photosLeft : 4 + Math.min(2, Math.floor(photosLeft / 4)));
    const batch = remaining.slice(sliceStart, sliceStart + batchSize);
    if (batch.length === 0) break;

    const actNum = actIndex + 1;
    const name = actNames[(actIndex - 1) % actNames.length];
    pages.push(makePage(batch, {
      act: `Act ${actNum}`,
      title: `🎪 ${name}`,
      subtitle: `Scene ${actIndex}`,
      firstCaption: `The ${name.toLowerCase()} continue!`,
      firstEffect: pickEffect(actIndex % 2 === 0 ? 'together' : 'wow'),
      isFirstPage: false,
      eventName,
    }));

    sliceStart += batchSize;
    actIndex++;
  }

  // ── FINALE PAGE ──
  const finalePhotos = remaining.slice(-finaleReserve);
  if (finalePhotos.length > 0) {
    pages.push(makePage(finalePhotos, {
      act: 'Finale',
      title: `🌟 Grand Finale`,
      subtitle: `A perfect ending to an amazing story`,
      firstCaption: `The grand finale`,
      firstEffect: pickEffect('end'),
      isFirstPage: false,
      eventName,
    }));
  }

  return pages;
}

function makePage(
  photos: Photo[],
  opts: {
    act: string;
    title: string;
    subtitle: string;
    firstCaption: string;
    firstEffect: string;
    isFirstPage: boolean;
    eventName: string;
  }
): ComicPage {
  const panels: ComicPanel[] = [];

  // Hero panel — largest photo first
  panels.push({
    type: 'large',
    photos: photos.slice(0, 1),
    caption: opts.firstCaption,
    speechBubble: opts.isFirstPage
      ? `Welcome to ${opts.eventName || 'the event'}! Let the adventure begin! 🎉`
      : `Every moment tells a story! ✨`,
    effect: opts.firstEffect,
  });

  // Remaining photos distributed into panels
  const rest = photos.slice(1);
  if (rest.length === 1) {
    panels.push({
      type: 'large',
      photos: rest,
      caption: `A moment to remember`,
      speechBubble: `This is going to be legendary! ⚡`,
    });
  } else if (rest.length === 2) {
    panels.push({
      type: 'double',
      photos: rest,
      caption: `Captured moments`,
    });
  } else if (rest.length >= 3) {
    panels.push({
      type: 'double',
      photos: rest.slice(0, 2),
      caption: `More highlights`,
      speechBubble: `The adventure continues!`,
    });
    if (rest.length > 2) {
      const extra = rest.slice(2);
      if (extra.length > 0) {
        panels.push({
          type: extra.length <= 2 ? 'medium' : 'small',
          photos: extra,
          caption: `Candid moments`,
        });
      }
    }
  }

  return {
    title: opts.title,
    subtitle: opts.subtitle,
    actLabel: opts.act,
    panels,
  };
}

// ─────────────────────────────────────────────
// ASYMMETRICAL LAYOUT ENGINE
// ─────────────────────────────────────────────

function layoutAsymmetrical(panels: ComicPanel[], cols: number): GridPanel[] {
  const gridPanels: GridPanel[] = [];
  let row = 0;
  let col = 0;
  let hasTallPanel = false; // track if any panel on this page has rowSpan > 1

  for (const panel of panels) {
    let colSpan: number;
    let rowSpan = 1;

    switch (panel.type) {
      case 'large':
      case 'double':
        colSpan = 2;
        break;
      default:
        colSpan = 1;
    }

    // On phones (2 columns) every panel spans the full row so photos stay big
    if (cols === 2) {
      colSpan = 2;
    }

    // Give the first panel on the page extra height for the hero effect
    if (gridPanels.length === 0 && panel.type === 'large') {
      rowSpan = 2;
      hasTallPanel = true;
    }

    // Medium panels also get extra height — but only if no previous tall panel overlaps
    if (panel.type === 'medium' && !hasTallPanel && cols > 2) {
      rowSpan = 2;
      hasTallPanel = true;
    }

    // Wrap to next row if doesn't fit
    if (col + colSpan > cols) {
      col = 0;
      row += 1;
    }

    // If a previous tall panel occupies this row, skip to the next free row
    if (hasTallPanel && row < 2 && gridPanels.length > 0) {
      const tallEndRow = 2; // first panel occupies rows 0-1
      if (row < tallEndRow) {
        row = tallEndRow;
        col = 0;
      }
    }

    // Clamp spans to prevent overflow
    if (row + rowSpan > 12) {
      colSpan = 1;
      rowSpan = 1;
    }

    gridPanels.push({ ...panel, colSpan, rowSpan, row, col });

    col += colSpan;
    if (col >= cols) {
      col = 0;
      row += rowSpan;
    }
  }

  return gridPanels;
}

// ─────────────────────────────────────────────
// EFFECT PICKER — deterministic from context
// ─────────────────────────────────────────────

function pickEffect(context: 'action' | 'together' | 'boom' | 'wow' | 'end'): string {
  const effects: Record<string, string[]> = {
    action: ['💥 POW!', '⚡ SHOCK!', '💪 STRIKE!', '🎯 PERFECT!'],
    together: ['👥 TOGETHER!', '🎉 ACTION!', '⭐ BOOM!', '🎊 PARTY!'],
    boom: ['⭐ BOOM!', '🔥 BAM!', '💥 POW!'],
    wow: ['✨ WOW!', '💫 ZAP!', '🌟 AMAZING!'],
    end: ['💫 THE END!', '🌟 FINALE!', '🎬 CURTAIN!', '🏆 CHAMPIONS!'],
  };
  const pool = effects[context] || effects.action;
  return pool[Math.floor(Math.random() * pool.length)];
}
