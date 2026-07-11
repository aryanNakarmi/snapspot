import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // If no API key is configured, skip analysis (pass through)
    if (!GOOGLE_VISION_API_KEY) {
      console.warn('GOOGLE_VISION_API_KEY not set — analysis is disabled');
      return NextResponse.json({
        moderated: false,
        flagged: false,
        reason: null,
        safeSearch: null,
        labels: [],
        faces: [],
      });
    }

    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: {
              source: { imageUri: imageUrl },
            },
            features: [
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'FACE_DETECTION', maxResults: 10 },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error:', response.status, errorText);
      // Fail-open: if the Vision service is unavailable, allow the upload
      return NextResponse.json({
        moderated: false,
        flagged: false,
        reason: null,
        safeSearch: null,
        labels: [],
        faces: [],
      });
    }

    const data = await response.json();
    const responses = data.responses?.[0];
    const safeSearch = responses?.safeSearchAnnotation;
    const labelAnnotations = responses?.labelAnnotations || [];
    const faceAnnotations = responses?.faceAnnotations || [];

    // --- Safe Search (existing moderation) ---
    let flagged = false;
    let moderationReason: string | null = null;
    if (safeSearch) {
      const rejectionThresholds = ['LIKELY', 'VERY_LIKELY'];
      const isAdult = rejectionThresholds.includes(safeSearch.adult);
      const isViolent = rejectionThresholds.includes(safeSearch.violence);
      const isRacy = rejectionThresholds.includes(safeSearch.racy);

      flagged = isAdult || isViolent;
      const reasons: string[] = [];
      if (isAdult) reasons.push('adult');
      if (isViolent) reasons.push('violent');
      if (isRacy) reasons.push('suggestive');
      if (flagged) {
        moderationReason = `Inappropriate content detected: ${reasons.join(', ')}`;
      }
    }

    // --- Labels (for object/scene grouping) ---
    const labels = labelAnnotations.map((label: any) => ({
      description: label.description,
      score: label.score,
      topicality: label.topicality,
    }));

    // --- Faces (for counting faces per photo) ---
    const faces = faceAnnotations.map((face: any) => ({
      boundingPoly: face.boundingPoly,
      fdBrightness: face.fdBrightness,
      detectionConfidence: face.detectionConfidence,
      landmarkingConfidence: face.landmarkingConfidence,
      joyLikelihood: face.joyLikelihood,
      sorrowLikelihood: face.sorrowLikelihood,
      angerLikelihood: face.angerLikelihood,
      surpriseLikelihood: face.surpriseLikelihood,
    }));

    return NextResponse.json({
      moderated: true,
      flagged,
      reason: moderationReason,
      safeSearch: safeSearch
        ? {
            adult: safeSearch.adult,
            violence: safeSearch.violence,
            racy: safeSearch.racy,
            medical: safeSearch.medical,
            spoof: safeSearch.spoof,
          }
        : null,
      labels,
      faces,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    // Fail-open on internal errors — don't block uploads
    return NextResponse.json({
      moderated: false,
      flagged: false,
      reason: null,
      safeSearch: null,
      labels: [],
      faces: [],
    });
  }
}
