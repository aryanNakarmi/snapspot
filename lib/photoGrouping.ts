export interface Photo {
  id: string;
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  phash?: string;
  uploadedAt: any;
  uploaderDevice?: string;
}

export interface PhotoGroup {
  id: string;
  label: string;
  startTime: Date;
  endTime: Date;
  photos: Photo[];
}

/**
 * Calculate Hamming distance between two perceptual hash hex strings.
 * Lower distance = more visually similar.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return Infinity;
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const b1 = parseInt(hash1[i], 16);
    const b2 = parseInt(hash2[i], 16);
    let xor = b1 ^ b2;
    // Count set bits
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
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
function formatGroupLabel(start: Date, end: Date, count: number): string {
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

  // If same hour, just show the time range
  return `${startStr} - ${endStr}`;
}

/**
 * Group photos by visual similarity (pHash) and upload time proximity.
 *
 * Algorithm:
 * 1. Sort photos by upload time (assumed already sorted descending — we'll reverse for clustering)
 * 2. Build a graph where nodes are photos and edges connect photos that are:
 *    - Visually similar: pHash Hamming distance < PHASH_THRESHOLD, OR
 *    - Temporally close: uploaded within TIME_WINDOW_MS of each other
 * 3. Use union-find to cluster connected components into groups
 * 4. Label each group by its time range
 */
export function groupPhotos(
  photos: Photo[],
  options?: {
    phashThreshold?: number;
    timeWindowMs?: number;
  }
): PhotoGroup[] {
  if (photos.length === 0) return [];

  const PHASH_THRESHOLD = options?.phashThreshold ?? 10;
  const TIME_WINDOW_MS = options?.timeWindowMs ?? 5 * 60 * 1000; // 5 minutes

  // Sort ascending by time for grouping
  const sorted = [...photos].sort(
    (a, b) => getDate(a.uploadedAt).getTime() - getDate(b.uploadedAt).getTime()
  );

  const n = sorted.length;

  // Disjoint Set (Union-Find)
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(x: number, y: number) {
    const px = find(x);
    const py = find(y);
    if (px === py) return;
    if (rank[px] < rank[py]) {
      parent[px] = py;
    } else if (rank[px] > rank[py]) {
      parent[py] = px;
    } else {
      parent[py] = px;
      rank[px]++;
    }
  }

  // Compare every pair of photos within a sliding time window
  for (let i = 0; i < n; i++) {
    const photoA = sorted[i];
    const timeA = getDate(photoA.uploadedAt).getTime();

    for (let j = i + 1; j < n; j++) {
      const photoB = sorted[j];
      const timeB = getDate(photoB.uploadedAt).getTime();
      const timeDiff = Math.abs(timeB - timeA);

      // Skip if too far apart in time (optimization)
      if (timeDiff > TIME_WINDOW_MS * 3) break;

      let connected = false;

      // Check temporal proximity
      if (timeDiff <= TIME_WINDOW_MS) {
        connected = true;
      }

      // Check visual similarity (if both have pHash)
      if (!connected && photoA.phash && photoB.phash) {
        const dist = hammingDistance(photoA.phash, photoB.phash);
        if (dist <= PHASH_THRESHOLD) {
          connected = true;
        }
      }

      if (connected) {
        union(i, j);
      }
    }
  }

  // Build groups from connected components
  const groupsMap = new Map<number, Photo[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groupsMap.has(root)) groupsMap.set(root, []);
    groupsMap.get(root)!.push(sorted[i]);
  }

  // Convert to PhotoGroup array, sorted by time
  const groups: PhotoGroup[] = Array.from(groupsMap.entries())
    .map(([root, members]) => {
      // Sort members by time ascending
      members.sort(
        (a, b) => getDate(a.uploadedAt).getTime() - getDate(b.uploadedAt).getTime()
      );
      const startTime = getDate(members[0].uploadedAt);
      const endTime = getDate(members[members.length - 1].uploadedAt);

      return {
        id: `group-${root}`,
        label: formatGroupLabel(startTime, endTime, members.length),
        startTime,
        endTime,
        photos: members,
      };
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return groups;
}
