'use client';

// TF.js-based models (coco-ssd) have known bundling conflicts with Next.js/webpack.
// Instead of npm imports, we load them dynamically from CDN at runtime.
// This completely bypasses the webpack version conflict.

let modelLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load a script dynamically from a URL.
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load COCO-SSD model from CDN.
 * TF.js and COCO-SSD are loaded as scripts to avoid webpack bundling conflicts.
 * Models are loaded once and cached for subsequent calls.
 */
export async function loadObjectDetectionModel(): Promise<void> {
  if (modelLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Load TF.js core first, then COCO-SSD on top
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
      modelLoaded = true;
      console.log('COCO-SSD model loaded successfully from CDN');
    } catch (error) {
      console.error('Failed to load COCO-SSD model from CDN:', error);
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Check if object detection model is loaded.
 */
export function isObjectDetectionModelLoaded(): boolean {
  return modelLoaded;
}

/**
 * Get unique detected labels from an image.
 * Uses COCO-SSD (80 object classes) running entirely client-side.
 * Free, no API key needed.
 *
 * @param imageUrl - URL of the image to analyze
 * @returns Array of unique class names (e.g. ["dog", "laptop"])
 */
export async function detectLabels(imageUrl: string): Promise<string[]> {
  await loadObjectDetectionModel();

  try {
    const cocoSsd = (window as any).cocoSsd;
    if (!cocoSsd) {
      console.warn('COCO-SSD not available on window');
      return [];
    }

    const model = await cocoSsd.load();
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for object detection'));
      img.src = imageUrl;
    });

    const predictions = await model.detect(img);

    // Return unique class names for predictions with confidence > 0.4
    const labels: string[] = (predictions as any[])
      .filter((p: any) => p.score > 0.4)
      .map((p: any) => p.class);

    return [...new Set(labels)];
  } catch (error) {
    console.error('Object detection error:', error);
    return [];
  }
}
