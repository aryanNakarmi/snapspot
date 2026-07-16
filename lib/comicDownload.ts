'use client';

import { getEventPhotos } from './eventService';
import type { Photo } from './photoGrouping';

// ===================== Configuration =====================
// A4-ish proportions at ~144 DPI
const PAGE_W = 1200;
const PAGE_H = 1697;
const PAD = 24;
const TITLE_H = 76;

// Comic-book color palette
const COMIC_COLORS = [
  { bg: '#fef3c7', accent: '#dc2626' },  // Yellow/Red
  { bg: '#e0f2fe', accent: '#0284c7' },  // Light blue/Dark blue
  { bg: '#fae8ff', accent: '#c026d3' },  // Purple/Magenta
  { bg: '#d1fae5', accent: '#059669' },  // Green/Emerald
  { bg: '#fff7ed', accent: '#ea580c' },  // Orange/Burnt
  { bg: '#fce7f3', accent: '#db2777' },  // Pink/Rose
];

// ===================== Types =====================
interface Panel {
  photo: Photo;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  isHero?: boolean;
}

interface ComicPage {
  panels: Panel[];
  pageNum: number;
  colors: typeof COMIC_COLORS[0];
}

// ===================== Layout Strategies =====================
// Each produces panels from a slice of photos.

function layoutHeroStrip(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // Big hero panel top, then 2-3 smaller bottom row
  const avail = photos.length - start;
  if (avail === 0) return { panels: [], used: 0, height: 0 };

  const heroH = Math.min(380, maxH * 0.55);
  const restH = Math.min(200, maxH - heroH - 12);

  const panels: Panel[] = [];
  const hero: Panel = {
    photo: photos[start],
    x: PAD,
    y: y0,
    w: cw,
    h: heroH,
    isHero: true,
    label: pickLabel(photos[start]),
  };
  panels.push(hero);

  let used = 1;
  const cols = Math.min(avail - 1, 3);
  if (cols > 0) {
    const pw = (cw - (cols - 1) * 8) / cols;
    for (let c = 0; c < cols && start + 1 + c < photos.length; c++) {
      panels.push({
        photo: photos[start + 1 + c],
        x: PAD + c * (pw + 8),
        y: y0 + heroH + 12,
        w: pw,
        h: restH,
        label: pickLabel(photos[start + 1 + c]),
      });
      used++;
    }
  }

  return { panels, used, height: heroH + 12 + restH };
}

function layoutSplitFeature(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // Large left panel (2/3) + 2 stacked right (1/3)
  const avail = photos.length - start;
  if (avail === 0) return { panels: [], used: 0, height: 0 };

  const leftW = Math.round(cw * 0.62);
  const rightW = cw - leftW - 8;
  const rowH = Math.min(280, maxH);

  const panels: Panel[] = [];
  panels.push({
    photo: photos[start],
    x: PAD,
    y: y0,
    w: leftW,
    h: rowH,
    isHero: true,
    label: pickLabel(photos[start]),
  });

  let used = 1;
  const stackH = (rowH - 8) / 2;
  for (let i = 0; i < 2 && start + 1 + i < photos.length; i++) {
    panels.push({
      photo: photos[start + 1 + i],
      x: PAD + leftW + 8,
      y: y0 + i * (stackH + 8),
      w: rightW,
      h: stackH,
      label: pickLabel(photos[start + 1 + i]),
    });
    used++;
  }

  return { panels, used, height: rowH };
}

function layoutTripleRow(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // 3 equal columns
  const avail = photos.length - start;
  const cols = Math.min(avail, 3);
  if (cols === 0) return { panels: [], used: 0, height: 0 };

  const rowH = Math.min(200, maxH);
  const pw = (cw - (cols - 1) * 8) / cols;
  const panels: Panel[] = [];

  for (let c = 0; c < cols && start + c < photos.length; c++) {
    panels.push({
      photo: photos[start + c],
      x: PAD + c * (pw + 8),
      y: y0,
      w: pw,
      h: rowH,
      label: pickLabel(photos[start + c]),
    });
  }

  return { panels, used: cols, height: rowH };
}

function layoutQuadGrid(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // 2x2 grid
  const avail = photos.length - start;
  const total = Math.min(avail, 4);
  const cols = 2;
  const rows = Math.ceil(total / cols);
  const pw = (cw - 8) / 2;
  const rowH = Math.min((maxH - 8) / rows, 220);
  const panels: Panel[] = [];

  let idx = 0;
  for (let r = 0; r < rows && start + idx < photos.length; r++) {
    for (let c = 0; c < cols && start + idx < photos.length; c++) {
      panels.push({
        photo: photos[start + idx],
        x: PAD + c * (pw + 8),
        y: y0 + r * (rowH + 8),
        w: pw,
        h: rowH,
        label: pickLabel(photos[start + idx]),
      });
      idx++;
    }
  }

  return { panels, used: idx, height: rows * (rowH + 8) - 8 };
}

function layoutWideStandout(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // A medium hero with caption, then a strip below
  const avail = photos.length - start;
  if (avail === 0) return { panels: [], used: 0, height: 0 };

  const topH = Math.min(260, maxH * 0.6);
  const bottomH = Math.min(160, maxH - topH - 12);
  const panels: Panel[] = [];

  panels.push({
    photo: photos[start],
    x: PAD,
    y: y0,
    w: cw,
    h: topH,
    isHero: true,
    label: pickLabel(photos[start]),
  });

  let used = 1;
  const cols = Math.min(avail - 1, 3);
  if (cols > 0) {
    const pw = (cw - (cols - 1) * 8) / cols;
    for (let c = 0; c < cols && start + 1 + c < photos.length; c++) {
      panels.push({
        photo: photos[start + 1 + c],
        x: PAD + c * (pw + 8),
        y: y0 + topH + 12,
        w: pw,
        h: bottomH,
        label: pickLabel(photos[start + 1 + c]),
      });
      used++;
    }
  }

  return { panels, used, height: topH + 12 + bottomH };
}

function layoutDuo(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // Two equal side-by-side panels
  const avail = photos.length - start;
  const cols = Math.min(avail, 2);
  if (cols === 0) return { panels: [], used: 0, height: 0 };

  const rowH = Math.min(300, maxH);
  const pw = (cw - 8) / 2;
  const panels: Panel[] = [];

  for (let c = 0; c < cols && start + c < photos.length; c++) {
    panels.push({
      photo: photos[start + c],
      x: PAD + c * (pw + 8),
      y: y0,
      w: pw,
      h: rowH,
      label: pickLabel(photos[start + c]),
    });
  }

  return { panels, used: cols, height: rowH };
}

function layoutMasonry(
  photos: Photo[], start: number, cw: number, y0: number, maxH: number
): { panels: Panel[]; used: number; height: number } {
  // 3 columns, graphic novel page feel
  const avail = photos.length - start;
  if (avail === 0) return { panels: [], used: 0, height: 0 };

  const panels: Panel[] = [];
  const gutter = 8;
  const colW = (cw - gutter * 2) / 3;
  const rowH = Math.min(180, maxH / 3);
  let used = 0;
  let y = y0;

  while (start + used < photos.length && y + rowH + PAD < y0 + maxH) {
    // Check what we have left – if < 3, use a simpler strip row
    const remaining = avail - used;

    if (remaining >= 3 && (used % 2 === 0)) {
      // Even row: tall left, 2 stacked center, tall right
      const tallH = Math.min(rowH * 2 + gutter, maxH - (y - y0) - gutter);
      if (y + tallH > y0 + maxH) break;

      panels.push({
        photo: photos[start + used],
        x: PAD,
        y,
        w: colW,
        h: tallH,
        label: pickLabel(photos[start + used]),
        isHero: true,
      });
      panels.push({
        photo: photos[start + used + 1],
        x: PAD + colW + gutter,
        y,
        w: colW,
        h: (tallH - gutter) / 2,
        label: pickLabel(photos[start + used + 1]),
      });
      panels.push({
        photo: photos[start + used + 2],
        x: PAD + colW + gutter,
        y: y + (tallH - gutter) / 2 + gutter,
        w: colW,
        h: (tallH - gutter) / 2,
        label: pickLabel(photos[start + used + 2]),
      });
      used += 3;

      // Optional 4th for third column
      if (start + used < photos.length) {
        panels.push({
          photo: photos[start + used],
          x: PAD + (colW + gutter) * 2,
          y,
          w: colW,
          h: tallH,
          label: pickLabel(photos[start + used]),
        });
        used++;
      }
      y += tallH + gutter;
    } else {
      // Odd row (or few remaining): full-width strip
      const stripH = Math.min(160, maxH / 4);
      if (y + stripH > y0 + maxH) break;

      const cols = Math.min(remaining, 3);
      const pw = (cw - (cols - 1) * gutter) / cols;
      for (let c = 0; c < cols && start + used < photos.length; c++) {
        panels.push({
          photo: photos[start + used],
          x: PAD + c * (pw + gutter),
          y,
          w: pw,
          h: stripH,
          label: pickLabel(photos[start + used]),
        });
        used++;
      }
      y += stripH + gutter;
    }
  }

  return { panels, used, height: y - y0 };
}

// ===================== Layout Engine =====================
const STRATEGIES = [
  layoutHeroStrip,
  layoutSplitFeature,
  layoutTripleRow,
  layoutQuadGrid,
  layoutWideStandout,
  layoutDuo,
  layoutMasonry,
];

function buildPages(photos: Photo[]): ComicPage[] {
  const pages: ComicPage[] = [];
  const contentW = PAGE_W - PAD * 2;
  let idx = 0;
  let pageNum = 1;
  let stratIdx = 0;

  while (idx < photos.length) {
    const colors = COMIC_COLORS[pageNum % COMIC_COLORS.length];
    const panels: Panel[] = [];
    let y = PAD + TITLE_H + 12;

    while (idx < photos.length) {
      const strategy = STRATEGIES[stratIdx % STRATEGIES.length];
      stratIdx++;
      const remaining = PAGE_H - y - PAD;
      if (remaining < 120) break;

      const result = strategy(photos, idx, contentW, y, remaining);
      if (result.used === 0) break;

      panels.push(...result.panels);
      idx += result.used;
      y += result.height + 10;
    }

    if (panels.length === 0) break;
    pages.push({ panels, pageNum: pageNum++, colors });
  }

  return pages;
}

// ===================== Label Picking =====================
function pickLabel(photo: Photo): string | undefined {
  if (!photo.labels || photo.labels.length === 0) return undefined;
  const generic = new Set([
    'person', 'people', 'face', 'portrait', 'human', 'crowd',
    'photo', 'photography', 'snapshot', 'selfie', 'image',
    'indoors', 'outdoors', 'event', 'recreation', 'fun',
    'text', 'font', 'design', 'illustration',
  ]);
  for (const label of photo.labels) {
    const lower = label.toLowerCase().trim();
    if (!generic.has(lower) && lower.length < 20) return label;
  }
  return undefined;
}

// ===================== Canvas Rendering =====================
async function renderPage(page: ComicPage, eventName: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d')!;
  const { colors } = page;

  // ── 1. Background with halftone ──
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  
  // Subtle halftone dot pattern in background
  drawHalftonePattern(ctx, PAGE_W, PAGE_H, colors.accent);

  // ── 2. Outer comic frame ──
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 3;
  roundRect(ctx, PAD - 4, PAD - 4, PAGE_W - PAD * 2 + 8, PAGE_H - PAD * 2 + 8, 6);
  ctx.stroke();
  // Inner line
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  roundRect(ctx, PAD - 1, PAD - 1, PAGE_W - PAD * 2 + 2, PAGE_H - PAD * 2 + 2, 4);
  ctx.stroke();

  // ── 3. Title bar ──
  drawTitleBar(ctx, eventName, page.pageNum, colors);

  // ── 4. Load images ──
  const images = await Promise.all(
    page.panels.map((p) => loadImage(p.photo.cloudinaryUrl))
  );

  // ── 5. Draw panels ──
  for (let i = 0; i < page.panels.length; i++) {
    const panel = page.panels[i];
    const img = images[i];

    // Draw panel shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    roundRect(ctx, panel.x + 3, panel.y + 3, panel.w, panel.h, 4);
    ctx.fill();

    // Panel border (thicker for hero)
    const borderW = panel.isHero ? 3 : 2;
    ctx.fillStyle = '#1c1917';
    roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 3);
    ctx.fill();

    // Inner image area
    const ix = panel.x + borderW;
    const iy = panel.y + borderW;
    const iw = panel.w - borderW * 2;
    const ih = panel.h - borderW * 2;

    if (img) {
      ctx.save();
      beginRoundRect(ctx, ix, iy, iw, ih, 2);
      ctx.clip();

      // Draw the image with posterize filter applied
      drawImageCover(ctx, img, ix, iy, iw, ih);

      // Apply comic posterize effect via canvas pixel manipulation
      const imageData = ctx.getImageData(ix, iy, iw, ih);
      applyPosterize(imageData, panel.isHero ? 5 : 4);
      applyContrastBoost(imageData, 0.15);
      ctx.putImageData(imageData, ix, iy);

      ctx.restore();

      // Double-line border accent (comic style)
      if (panel.isHero) {
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        roundRect(ctx, panel.x + 5, panel.y + 5, panel.w - 10, panel.h - 10, 4);
        ctx.stroke();
      }

      // Speed lines for hero panels
      if (panel.isHero) {
        drawSpeedLines(ctx, panel.x + panel.w / 2, panel.y + panel.h / 2, panel.w, panel.h, colors.accent);
      }

      // Speech bubble label
      if (panel.label) {
        drawSpeechBubble(ctx, panel, panel.label, colors);
      }
    } else {
      // Fallback
      ctx.fillStyle = '#e7e5e4';
      roundRect(ctx, ix, iy, iw, ih, 2);
      ctx.fill();
      ctx.fillStyle = '#a8a29e';
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷', ix + iw / 2, iy + ih / 2);
    }
  }

  // ── 6. Footer ──
  ctx.fillStyle = '#78716c';
  ctx.font = '8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `SnapSpot Comic · Page ${page.pageNum} · ${new Date().toLocaleDateString()}`,
    PAGE_W / 2,
    PAGE_H - 8
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

// ===================== Comic Effects =====================

/** Halftone dot pattern in background corners */
function drawHalftonePattern(
  ctx: CanvasRenderingContext2D, w: number, h: number, color: string
) {
  const dotR = 3;
  const spacing = 18;
  ctx.globalAlpha = 0.07;

  // Top-left corner cluster
  for (let x = PAD - 2; x < PAD + 180; x += spacing) {
    for (let y = PAD + TITLE_H; y < PAD + TITLE_H + 120; y += spacing) {
      ctx.beginPath();
      ctx.arc(x + dotR, y + dotR, dotR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  // Bottom-right corner cluster
  for (let x = w - PAD - 180; x < w - PAD + 2; x += spacing) {
    for (let y = h - PAD - 160; y < h - PAD + 2; y += spacing) {
      ctx.beginPath();
      ctx.arc(x + dotR, y + dotR, dotR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  // Scatter some random dots along bottom edge
  const seed = 42;
  for (let i = 0; i < 30; i++) {
    const sx = PAD + 50 + ((seed * (i + 1) * 7) % (w - PAD * 2 - 100));
    const sy = h - PAD - 40 + ((seed * (i + 1) * 13) % 50);
    ctx.beginPath();
    ctx.arc(sx, sy, dotR * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

/** Speed lines radiating from center of hero panels */
function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, pw: number, ph: number, color: string
) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (i % 3) * 0.1;
    const len = 40 + (i * 7) % 60;
    const x1 = cx + Math.cos(angle) * 20;
    const y1 = cy + Math.sin(angle) * 20;
    const x2 = cx + Math.cos(angle) * (20 + len);
    const y2 = cy + Math.sin(angle) * (20 + len);

    // Tapered line (wider at start)
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw a comic speech bubble for labels */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  text: string,
  colors: typeof COMIC_COLORS[0]
) {
  const cx = panel.x + panel.w / 2;
  // Position bubble above bottom edge; ensure it's within panel bounds
  const by = Math.max(panel.y + 10, panel.y + panel.h - 24);
  const bubbleW = Math.min(ctx.measureText(text).width + 30, panel.w - 20);
  const bubbleH = 28;
  const bx = cx - bubbleW / 2;

  // Bubble shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(ctx, bx + 2, by + 2, bubbleW, bubbleH, 14);
  ctx.fill();

  // Bubble fill
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, bx, by, bubbleW, bubbleH, 14);
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  roundRect(ctx, bx, by, bubbleW, bubbleH, 14);
  ctx.stroke();

  // Tail
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 6, by + bubbleH);
  ctx.lineTo(cx, by + bubbleH + 10);
  ctx.lineTo(cx + 6, by + bubbleH);
  ctx.closePath();
  ctx.fill();

  // Tail border stroke
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 6, by + bubbleH);
  ctx.lineTo(cx, by + bubbleH + 10);
  ctx.lineTo(cx + 6, by + bubbleH);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, by + bubbleH / 2);
}

/** Comic-style title bar */
function drawTitleBar(
  ctx: CanvasRenderingContext2D,
  eventName: string,
  pageNum: number,
  colors: typeof COMIC_COLORS[0]
) {
  const tx = PAD;
  const ty = PAD;
  const tw = PAGE_W - PAD * 2;
  const th = TITLE_H;

  // Solid color bar with accent
  ctx.fillStyle = '#1c1917';
  roundRect(ctx, tx, ty, tw, th, 6);
  ctx.fill();

  // Accent stripe
  ctx.fillStyle = colors.accent;
  ctx.fillRect(tx + 8, ty + th - 5, tw - 16, 3);

  // Event name with drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  const displayName = eventName || 'SnapSpot Event';
  ctx.fillText(displayName, tx + 20, ty + th / 2 - 2);
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Comic-style "COMIC" badge
  const badgeX = tx + tw - 90;
  const badgeY = ty + 10;
  ctx.fillStyle = colors.accent;
  roundRect(ctx, badgeX, badgeY, 80, th - 20, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PAGE ${pageNum}`, badgeX + 40, badgeY + (th - 20) / 2);

  // Small decorative star burst near badge
  drawStarBurst(ctx, badgeX - 12, badgeY + (th - 20) / 2, colors.accent);
}

/** Small starburst accent */
function drawStarBurst(
  ctx: CanvasRenderingContext2D, x: number, y: number, color: string
) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  const spikes = 4;
  for (let i = 0; i < spikes; i++) {
    const angle = (Math.PI * 2 * i) / spikes;
    const len = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ===================== Image Filters =====================

/** Posterize: reduce color levels per channel */
function applyPosterize(data: ImageData, levels: number) {
  const factor = 255 / (levels - 1);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.round(data.data[i] / factor) * factor;
    data.data[i + 1] = Math.round(data.data[i + 1] / factor) * factor;
    data.data[i + 2] = Math.round(data.data[i + 2] / factor) * factor;
  }
}

/** Boost contrast slightly */
function applyContrastBoost(data: ImageData, amount: number) {
  // amount: 0 = no change, 0.15 = 15% boost
  // Map to C in range 0-255 for standard contrast formula
  const C = amount * 255;
  const factor = (259 * (C + 255)) / (255 * (259 - C));
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = clamp(Math.round(factor * (data.data[i] - 128) + 128));
    data.data[i + 1] = clamp(Math.round(factor * (data.data[i + 1] - 128) + 128));
    data.data[i + 2] = clamp(Math.round(factor * (data.data[i + 2] - 128) + 128));
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

// ===================== Image Loading & Drawing =====================

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = () => resolve(null);
      img2.src = url;
    };
    img.src = url;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number
) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const boxAspect = dw / dh;

  let sx: number, sy: number, sw: number, sh: number;
  if (imgAspect > boxAspect) {
    sh = img.naturalHeight;
    sw = img.naturalHeight * boxAspect;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = img.naturalWidth / boxAspect;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// ===================== Canvas Helpers =====================

function roundRect(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  w: number, h: number, r: number
) {
  ctx.beginPath();
  beginRoundRect(ctx, x, y, w, h, r);
  ctx.closePath();
}

function beginRoundRect(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  w: number, h: number, r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

// ===================== Public API =====================

export async function downloadComic(
  eventId: string,
  eventName: string
): Promise<{ downloaded: number; total: number }> {
  const rawPhotos = await getEventPhotos(eventId);
  if (rawPhotos.length === 0) {
    throw new Error('No photos to create comic');
  }

  const photos = rawPhotos as Photo[];

  // Sort chronologically (oldest first) for a story flow
  photos.sort((a, b) => {
    const ta = (a.uploadedAt as any)?.toDate?.()?.getTime() ?? 0;
    const tb = (b.uploadedAt as any)?.toDate?.()?.getTime() ?? 0;
    return ta - tb;
  });

  const pages = buildPages(photos);

  for (const page of pages) {
    const blob = await renderPage(page, eventName);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = pages.length > 1 ? `-page-${page.pageNum}` : '';
      a.download = `${sanitize(eventName || 'snapspot')}${suffix}-comic.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (pages.length > 1) await new Promise((r) => setTimeout(r, 400));
    }
  }

  return { downloaded: pages.length, total: photos.length };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
}
