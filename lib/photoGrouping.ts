import { matchFaceToCluster } from './faceRecognition';

export interface Photo {
  id: string;
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  phash?: string;
  uploadedAt: any;
  uploaderDevice?: string;
  labels?: string[];
  /**
   * Face descriptors stored as array of wrapper objects from Firestore:
   * [{ values: [0.1, 0.2, ...] }, ...]
   * (Firestore doesn't support nested arrays, so we use this format)
   */
  faceDescriptors?: { values: number[] }[];
}

export interface PhotoGroup {
  id: string;
  label: string;
  type: 'face' | 'label' | 'time';
  icon: string;
  startTime: Date;
  endTime: Date;
  photos: Photo[];
}

/**
 * Safely extract a Date from various Firestore timestamp formats
 */
function getDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
  if (typeof timestamp === 'string') return new Date(timestamp);
  if (typeof timestamp === 'number') return new Date(timestamp);
  return new Date();
}

/**
 * Format a time label for a group, e.g. "Around 7:30 PM" or "7:28 - 7:35 PM"
 */
function formatTimeLabel(start: Date, end: Date): string {
  const timeFormat = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const startStr = timeFormat(start);
  const endStr = timeFormat(end);

  if (startStr === endStr) {
    return `Around ${startStr}`;
  }
  return `${startStr} - ${endStr}`;
}

/**
 * Labels that are too generic or metadata-like for object grouping.
 * These describe image composition or medium rather than specific objects/scenes.
 */
const GENERIC_LABELS = new Set([
  'person', 'people', 'face', 'portrait', 'human', 'crowd',
  'gesture', 'smile', 'facial expression', 'eye', 'photography',
  'image', 'photo', 'picture', 'snapshot', 'selfie', 'indoors', 'outdoors',
  'event', 'recreation', 'fun', 'leisure', 'graphics', 'illustration',
  'design', 'font', 'technology', 'organization', 'text', 'plant',
  'accessories', 'fashion accessory', 'clothing', 'garment', 'suit',
  'shorts', 'footwear', 'shoe', 'dress', 'hat', 'jacket', 'coat',
]);

/**
 * Human-readable label overrides and icons for display.
 * Keys are the raw COCO-SSD / detection class names (lowercase).
 */
const LABEL_DISPLAY: Record<string, { label: string; icon: string }> = {
  // Animals
  'dog': { label: 'Dogs', icon: '🐕' },
  'cat': { label: 'Cats', icon: '🐱' },
  'bird': { label: 'Birds', icon: '🐦' },
  'horse': { label: 'Horses', icon: '🐴' },
  'sheep': { label: 'Sheep', icon: '🐑' },
  'cow': { label: 'Cows', icon: '🐄' },
  'elephant': { label: 'Elephants', icon: '🐘' },
  'bear': { label: 'Bears', icon: '🐻' },
  'zebra': { label: 'Zebras', icon: '🦓' },
  'giraffe': { label: 'Giraffes', icon: '🦒' },
  // Food & drinks
  'banana': { label: 'Bananas', icon: '🍌' },
  'apple': { label: 'Apples', icon: '🍎' },
  'sandwich': { label: 'Sandwiches', icon: '🥪' },
  'orange': { label: 'Oranges', icon: '🍊' },
  'broccoli': { label: 'Broccoli', icon: '🥦' },
  'carrot': { label: 'Carrots', icon: '🥕' },
  'hot dog': { label: 'Hot Dogs', icon: '🌭' },
  'pizza': { label: 'Pizza', icon: '🍕' },
  'donut': { label: 'Donuts', icon: '🍩' },
  'cake': { label: 'Cake', icon: '🎂' },
  'cup': { label: 'Cups', icon: '🥤' },
  'bottle': { label: 'Bottles', icon: '🍾' },
  'wine glass': { label: 'Wine', icon: '🍷' },
  'bowl': { label: 'Bowls', icon: '🥣' },
  // Electronics
  'laptop': { label: 'Laptops', icon: '💻' },
  'cell phone': { label: 'Phones', icon: '📱' },
  'tv': { label: 'TVs', icon: '📺' },
  'remote': { label: 'Remotes', icon: '📱' },
  'keyboard': { label: 'Keyboards', icon: '⌨️' },
  'mouse': { label: 'Mice', icon: '🖱️' },
  // Vehicles
  'car': { label: 'Cars', icon: '🚗' },
  'bicycle': { label: 'Bicycles', icon: '🚲' },
  'motorcycle': { label: 'Motorcycles', icon: '🏍️' },
  'airplane': { label: 'Airplanes', icon: '✈️' },
  'bus': { label: 'Buses', icon: '🚌' },
  'train': { label: 'Trains', icon: '🚆' },
  'truck': { label: 'Trucks', icon: '🚚' },
  'boat': { label: 'Boats', icon: '⛵' },
  // Sports & recreation
  'sports ball': { label: 'Sports Balls', icon: '⚽' },
  'baseball bat': { label: 'Baseball Bats', icon: '🏏' },
  'baseball glove': { label: 'Baseball Gloves', icon: '🧤' },
  'skateboard': { label: 'Skateboards', icon: '🛹' },
  'surfboard': { label: 'Surfboards', icon: '🏄' },
  'tennis racket': { label: 'Tennis Rackets', icon: '🎾' },
  'kite': { label: 'Kites', icon: '🪁' },
  'frisbee': { label: 'Frisbees', icon: '🥏' },
  'skis': { label: 'Skis', icon: '🎿' },
  'snowboard': { label: 'Snowboards', icon: '🏂' },
  // Furniture & household
  'chair': { label: 'Chairs', icon: '🪑' },
  'couch': { label: 'Couches', icon: '🛋️' },
  'bed': { label: 'Beds', icon: '🛏️' },
  'dining table': { label: 'Tables', icon: '🍽️' },
  'toilet': { label: 'Toilets', icon: '🚽' },
  'sink': { label: 'Sinks', icon: '🚰' },
  'refrigerator': { label: 'Fridges', icon: '🧊' },
  'microwave': { label: 'Microwaves', icon: '📟' },
  'oven': { label: 'Ovens', icon: '🔥' },
  'toaster': { label: 'Toasters', icon: '🍞' },
  'clock': { label: 'Clocks', icon: '🕐' },
  'vase': { label: 'Vases', icon: '🏺' },
  'book': { label: 'Books', icon: '📚' },
  'potted plant': { label: 'Plants', icon: '🪴' },
  // Personal items
  'backpack': { label: 'Backpacks', icon: '🎒' },
  'umbrella': { label: 'Umbrellas', icon: '☂️' },
  'handbag': { label: 'Handbags', icon: '👜' },
  'tie': { label: 'Ties', icon: '👔' },
  'suitcase': { label: 'Suitcases', icon: '🧳' },
  // Other
  'traffic light': { label: 'Traffic Lights', icon: '🚦' },
  'fire hydrant': { label: 'Fire Hydrants', icon: '🔥' },
  'stop sign': { label: 'Stop Signs', icon: '🛑' },
  'parking meter': { label: 'Parking Meters', icon: '🅿️' },
  'bench': { label: 'Benches', icon: '🪑' },
  'teddy bear': { label: 'Teddy Bears', icon: '🧸' },
  'hair drier': { label: 'Hair Dryers', icon: '💨' },
  'toothbrush': { label: 'Toothbrushes', icon: '🪥' },
  'scissors': { label: 'Scissors', icon: '✂️' },
};

/**
 * Default icon for labels not explicitly listed.
 */
function getLabelDisplay(label: string): { label: string; icon: string } {
  const key = label.toLowerCase();
  const display = LABEL_DISPLAY[key];
  if (display) return display;
  // For unknown labels, pluralize and use a generic camera icon
  const pluralized = label.endsWith('s') ? label : `${label}s`;
  return { label: pluralized, icon: '📷' };
}

/**
 * Pick the best label for a photo from its detected labels.
 * Prefers the label that is most common across other photos (for grouping).
 */
function pickBestLabel(labels: string[], allPhotoLabels: Map<string, number>): string | null {
  const candidates = labels.filter((l) => !GENERIC_LABELS.has(l.toLowerCase()));
  if (candidates.length === 0) return null;

  // Sort by global frequency (most common = best for grouping)
  candidates.sort((a, b) => {
    const aFreq = allPhotoLabels.get(a.toLowerCase()) || 0;
    const bFreq = allPhotoLabels.get(b.toLowerCase()) || 0;
    return bFreq - aFreq;
  });

  return candidates[0];
}

/**
 * Cluster photos by face descriptor similarity.
 *
 * @returns Array of face clusters, each containing photo indices and a representative descriptor
 */
function clusterByFaces(photos: Photo[]): { photoIndices: number[] }[] {
  const allFaces: { photoIndex: number; descriptor: number[] }[] = [];

  // Collect all faces from all photos
  // Normalize from Firestore format: [{ values: [0.1, 0.2, ...] }, ...]
  photos.forEach((photo, idx) => {
    const fd = photo.faceDescriptors;
    if (fd && fd.length > 0) {
      for (const item of fd) {
        if (item?.values && Array.isArray(item.values)) {
          allFaces.push({ photoIndex: idx, descriptor: item.values });
        }
      }
    }
  });

  if (allFaces.length === 0) return [];

  // Cluster faces by descriptor similarity
  const clusters: { photoIndices: Set<number>; descriptors: number[][] }[] = [];
  const faceThreshold = 0.6;

  for (const face of allFaces) {
    let matched = false;
    for (const cluster of clusters) {
      const matchIdx = matchFaceToCluster(
        face.descriptor,
        [cluster.descriptors],
        faceThreshold
      );
      if (matchIdx >= 0) {
        cluster.photoIndices.add(face.photoIndex);
        cluster.descriptors.push(face.descriptor);
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({
        photoIndices: new Set([face.photoIndex]),
        descriptors: [face.descriptor],
      });
    }
  }

  // Only return clusters with 2+ photos
  return clusters
    .filter((c) => c.photoIndices.size >= 2)
    .map((c) => ({
      photoIndices: Array.from(c.photoIndices),
    }));
}

/**
 * Dynamic label-based grouping — like Google Photos.
 *
 * Groups photos by their most specific detected object label.
 * No hardcoded categories — whatever the AI finds, that's what we group by.
 *
 * @param photos - photos to group (those not already in a face group)
 * @param usedIndices - indices already assigned to face groups
 * @returns label-based groups
 */
function groupByLabels(
  photos: Photo[],
  usedIndices: Set<number>
): { photoIndices: number[]; label: string; icon: string }[] {
  const available = photos
    .map((p, idx) => ({ photo: p, index: idx }))
    .filter(({ index }) => !usedIndices.has(index));

  // Build global label frequency map (across all photos)
  // to help pick the best label per photo
  const labelFrequency = new Map<string, number>();
  for (const { photo } of available) {
    if (!photo.labels || photo.labels.length === 0) continue;
    for (const label of photo.labels) {
      const key = label.toLowerCase();
      labelFrequency.set(key, (labelFrequency.get(key) || 0) + 1);
    }
  }

  // Assign each photo to its best label
  // Store as label → photo indices map
  const labelToPhotos = new Map<string, number[]>();

  for (const { photo, index } of available) {
    if (!photo.labels || photo.labels.length === 0) continue;

    const bestLabel = pickBestLabel(photo.labels, labelFrequency);
    if (!bestLabel) continue;

    const key = bestLabel.toLowerCase();
    if (!labelToPhotos.has(key)) {
      labelToPhotos.set(key, []);
    }
    labelToPhotos.get(key)!.push(index);
  }

  // Create groups for labels with 2+ photos
  const groups: { photoIndices: number[]; label: string; icon: string }[] = [];
  const assignedInLabels = new Set<number>();

  // Sort labels by group size (biggest groups first)
  const sortedLabels = Array.from(labelToPhotos.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  for (const [labelKey, indices] of sortedLabels) {
    if (indices.length >= 2) {
      const display = getLabelDisplay(labelKey);
      groups.push({
        photoIndices: indices,
        label: display.label,
        icon: display.icon,
      });
      indices.forEach((i) => assignedInLabels.add(i));
    }
  }

  return groups;
}

/**
 * Smart grouping of photos by semantic content.
 *
 * Priority:
 * 1. Face grouping — cluster photos by the same person (face descriptor similarity)
 * 2. Label grouping — cluster photos by objects/scenes (Google Vision labels)
 * 3. Time-based grouping — fallback by upload time proximity
 *
 * @param photos - Array of photos to group
 * @returns Array of PhotoGroup objects sorted by time
 */
export function groupPhotos(
  photos: Photo[],
  options?: {
    phashThreshold?: number;
    timeWindowMs?: number;
    faceThreshold?: number;
  }
): PhotoGroup[] {
  if (photos.length === 0) return [];

  const TIME_WINDOW_MS = options?.timeWindowMs ?? 5 * 60 * 1000; // 5 minutes

  // Sort by time ascending
  const sorted = [...photos].sort(
    (a, b) => getDate(a.uploadedAt).getTime() - getDate(b.uploadedAt).getTime()
  );

  const groups: PhotoGroup[] = [];
  const assignedIndices = new Set<number>();

  // --- Phase 1: Face-based groups ---
  const faceClusters = clusterByFaces(sorted);
  let faceCounter = 0;

  for (const cluster of faceClusters) {
    const memberPhotos = cluster.photoIndices.map((i) => sorted[i]);
    memberPhotos.forEach((p) => {
      const idx = sorted.indexOf(p);
      if (idx >= 0) assignedIndices.add(idx);
    });

    // Sort by time
    memberPhotos.sort(
      (a, b) => getDate(a.uploadedAt).getTime() - getDate(b.uploadedAt).getTime()
    );

    faceCounter++;
    groups.push({
      id: `face-group-${faceCounter}`,
      label: `Person ${faceCounter}`,
      type: 'face',
      icon: '👤',
      startTime: getDate(memberPhotos[0].uploadedAt),
      endTime: getDate(memberPhotos[memberPhotos.length - 1].uploadedAt),
      photos: memberPhotos,
    });
  }

  // --- Phase 2: Label-based groups ---
  const labelGroups = groupByLabels(sorted, assignedIndices);
  let labelCounter = 0;

  for (const lg of labelGroups) {
    const memberPhotos = lg.photoIndices.map((i) => sorted[i]);
    memberPhotos.forEach((p) => {
      const idx = sorted.indexOf(p);
      if (idx >= 0) assignedIndices.add(idx);
    });

    memberPhotos.sort(
      (a, b) => getDate(a.uploadedAt).getTime() - getDate(b.uploadedAt).getTime()
    );

    labelCounter++;
    groups.push({
      id: `label-group-${labelCounter}`,
      label: lg.label,
      type: 'label',
      icon: lg.icon,
      startTime: getDate(memberPhotos[0].uploadedAt),
      endTime: getDate(memberPhotos[memberPhotos.length - 1].uploadedAt),
      photos: memberPhotos,
    });
  }

  // --- Phase 3: Time-based grouping (fallback) ---
  const remainingIndices: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (!assignedIndices.has(i)) {
      remainingIndices.push(i);
    }
  }

  if (remainingIndices.length > 0) {
    // Simple sliding-window time grouping
    const timeGroups: number[][] = [];
    let currentGroup: number[] = [remainingIndices[0]];

    for (let i = 1; i < remainingIndices.length; i++) {
      const prevTime = getDate(sorted[remainingIndices[i - 1]].uploadedAt).getTime();
      const currTime = getDate(sorted[remainingIndices[i]].uploadedAt).getTime();
      const diff = currTime - prevTime;

      if (diff <= TIME_WINDOW_MS) {
        currentGroup.push(remainingIndices[i]);
      } else {
        timeGroups.push(currentGroup);
        currentGroup = [remainingIndices[i]];
      }
    }
    timeGroups.push(currentGroup);

    let timeCounter = 0;
    for (const tg of timeGroups) {
      const memberPhotos = tg.map((i) => sorted[i]);
      const startTime = getDate(memberPhotos[0].uploadedAt);
      const endTime = getDate(memberPhotos[memberPhotos.length - 1].uploadedAt);

      timeCounter++;
      groups.push({
        id: `time-group-${timeCounter}`,
        label: formatTimeLabel(startTime, endTime),
        type: 'time',
        icon: '🕐',
        startTime,
        endTime,
        photos: memberPhotos,
      });
    }
  }

  // Sort all groups by start time
  groups.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return groups;
}
