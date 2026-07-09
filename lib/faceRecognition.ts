'use client';

import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load face-api.js models from the public/models/ directory.
 * Models are loaded once and cached for subsequent calls.
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      modelsLoaded = true;
      console.log('Face models loaded successfully');
    } catch (error) {
      console.error('Failed to load face models:', error);
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Check if face models are loaded.
 */
export function areFaceModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Detect faces in an image from a URL and return face descriptors.
 * Each descriptor is a 128-dimensional array (Float32Array converted to regular array).
 *
 * @param imageUrl - URL of the image to analyze
 * @returns Array of face descriptors (each is number[128]), empty if no faces found
 */
export async function detectFaceDescriptors(imageUrl: string): Promise<number[][]> {
  await loadFaceModels();

  try {
    // Load the image
    const img = await faceapi.fetchImage(imageUrl);

    // Detect faces with landmarks and descriptors
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Convert Float32Array descriptors to regular arrays for storage
    return detections.map((d) => Array.from(d.descriptor));
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
}

/**
 * Compute Euclidean distance between two face descriptors.
 * Lower distance = more similar. Threshold ~0.6 for "same person".
 */
export function faceDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Match a face descriptor against a list of known face clusters.
 * Returns the index of the closest matching cluster, or -1 if no match.
 *
 * @param descriptor - Face descriptor to match
 * @param clusters - Array of face clusters, each containing an array of descriptors
 * @param threshold - Distance threshold (lower = stricter). Default 0.6
 * @returns Index of matched cluster, or -1
 */
export function matchFaceToCluster(
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
