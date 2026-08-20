/**
 * Unit Tests — Face Recognition Module
 *
 * Tests the pure functions: faceDistance and matchFaceToCluster.
 * These tests do NOT require a browser or face-api.js models.
 */

// Inline the pure functions to avoid 'use client' and browser-only imports
function faceDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function matchFaceToCluster(
  descriptor: number[],
  clusters: number[][][],
  threshold = 0.6
): number {
  let bestIndex = -1;
  let bestDistance = threshold;

  for (let i = 0; i < clusters.length; i++) {
    for (const clusterDescriptor of clusters[i]) {
      const dist = faceDistance(descriptor, clusterDescriptor);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestIndex = i;
      }
    }
  }

  return bestIndex;
}

// ─── faceDistance Tests ────────────────────────────────────────────

describe('faceDistance', () => {
  test('returns 0 for identical descriptors', () => {
    const desc = [0.1, 0.2, 0.3, 0.4, 0.5];
    expect(faceDistance(desc, desc)).toBe(0);
  });

  test('returns correct Euclidean distance for known values', () => {
    const a = [0, 0, 0];
    const b = [1, 0, 0];
    expect(faceDistance(a, b)).toBeCloseTo(1.0, 5);
  });

  test('returns correct distance for 3D vectors', () => {
    const a = [1, 2, 3];
    const b = [4, 6, 3];
    // sqrt((4-1)^2 + (6-2)^2 + (3-3)^2) = sqrt(9+16+0) = 5
    expect(faceDistance(a, b)).toBeCloseTo(5.0, 5);
  });

  test('returns Infinity for descriptors of different lengths', () => {
    const a = [0.1, 0.2, 0.3];
    const b = [0.1, 0.2];
    expect(faceDistance(a, b)).toBe(Infinity);
  });

  test('returns small distance for similar descriptors', () => {
    const a = [0.5, 0.5, 0.5, 0.5];
    const b = [0.51, 0.5, 0.5, 0.5];
    const dist = faceDistance(a, b);
    expect(dist).toBeLessThan(0.1);
    expect(dist).toBeGreaterThan(0);
  });

  test('returns large distance for very different descriptors', () => {
    const a = [0.0, 0.0, 0.0, 0.0];
    const b = [1.0, 1.0, 1.0, 1.0];
    const dist = faceDistance(a, b);
    expect(dist).toBeCloseTo(2.0, 5); // sqrt(4) = 2
  });

  test('works with 128-dimensional descriptors (FaceNet format)', () => {
    const a: number[] = Array(128).fill(0.5);
    const b: number[] = Array(128).fill(0.5);
    b[0] = 0.6; // one value differs
    const dist = faceDistance(a, b);
    expect(dist).toBeCloseTo(0.1, 5); // sqrt(0.1^2) = 0.1
  });

  test('handles empty arrays', () => {
    expect(faceDistance([], [])).toBe(0);
  });
});

// ─── matchFaceToCluster Tests ──────────────────────────────────────

describe('matchFaceToCluster', () => {
  const threshold = 0.6;

  test('matches descriptor to correct cluster', () => {
    const descriptor = [0.5, 0.5, 0.5];
    const clusters: number[][][] = [
      [[0.1, 0.1, 0.1]],  // cluster 0: far away
      [[0.5, 0.5, 0.5]],  // cluster 1: exact match
    ];
    expect(matchFaceToCluster(descriptor, clusters, threshold)).toBe(1);
  });

  test('returns -1 when no cluster is within threshold', () => {
    const descriptor = [0.0, 0.0, 0.0];
    const clusters: number[][][] = [
      [[0.9, 0.9, 0.9]],
      [[0.8, 0.8, 0.8]],
    ];
    expect(matchFaceToCluster(descriptor, clusters, threshold)).toBe(-1);
  });

  test('returns -1 for empty clusters', () => {
    const descriptor = [0.5, 0.5, 0.5];
    const clusters: number[][][] = [];
    expect(matchFaceToCluster(descriptor, clusters, threshold)).toBe(-1);
  });

  test('matches to nearest cluster when multiple are within threshold', () => {
    const descriptor = [0.5, 0.5, 0.5];
    const clusters: number[][][] = [
      [[0.4, 0.4, 0.4]],  // distance ~0.17
      [[0.52, 0.52, 0.52]], // distance ~0.03 (closer)
    ];
    expect(matchFaceToCluster(descriptor, clusters, threshold)).toBe(1);
  });

  test('matches cluster with multiple descriptors', () => {
    const descriptor = [0.5, 0.5, 0.5];
    const clusters: number[][][] = [
      [[0.1, 0.1, 0.1]],  // far
      [[0.48, 0.48, 0.48], [0.52, 0.52, 0.52]], // two close descriptors
    ];
    expect(matchFaceToCluster(descriptor, clusters, threshold)).toBe(1);
  });

  test('respects custom threshold', () => {
    const descriptor = [0.5, 0.5, 0.5];
    const clusters: number[][][] = [
      [[0.7, 0.7, 0.7]], // distance ~0.35
    ];
    // With strict threshold 0.3, should not match
    expect(matchFaceToCluster(descriptor, clusters, 0.3)).toBe(-1);
    // With loose threshold 0.4, should match
    expect(matchFaceToCluster(descriptor, clusters, 0.4)).toBe(0);
  });
});
