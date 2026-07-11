export interface LabelAnnotation {
  description: string;
  score: number;
  topicality: number;
}

export interface FaceAnnotation {
  boundingPoly: any;
  detectionConfidence: number;
  landmarkingConfidence: number;
  joyLikelihood: string;
  sorrowLikelihood: string;
  angerLikelihood: string;
  surpriseLikelihood: string;
}

export interface ModerationResult {
  moderated: boolean;
  flagged: boolean;
  reason: string | null;
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
    medical: string;
    spoof: string;
  } | null;
  labels: LabelAnnotation[];
  faces: FaceAnnotation[];
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  try {
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', response.status);
      // Fail open — if the API is down, allow the upload
      return {
        moderated: false,
        flagged: false,
        reason: null,
        safeSearch: null,
        labels: [],
        faces: [],
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Moderation service call failed:', error);
    // Fail open on network errors
    return {
      moderated: false,
      flagged: false,
      reason: null,
      safeSearch: null,
      labels: [],
      faces: [],
    };
  }
}
