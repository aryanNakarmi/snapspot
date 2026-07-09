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

    // If no API key is configured, skip moderation (pass through)
    if (!GOOGLE_VISION_API_KEY) {
      console.warn('GOOGLE_VISION_API_KEY not set — moderation is disabled');
      return NextResponse.json({
        moderated: false,
        flagged: false,
        reason: 'Moderation not configured',
        safeSearch: null,
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
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
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
      });
    }

    const data = await response.json();
    const safeSearch = data.responses?.[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      return NextResponse.json({
        moderated: true,
        flagged: false,
        safeSearch: null,
      });
    }

    // Determine if the image is inappropriate based on likelihood ratings
    // VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    const rejectionThresholds = ['LIKELY', 'VERY_LIKELY'];

    const isAdult = rejectionThresholds.includes(safeSearch.adult);
    const isViolent = rejectionThresholds.includes(safeSearch.violence);
    const isRacy = rejectionThresholds.includes(safeSearch.racy);

    const flagged = isAdult || isViolent;
    const reasons: string[] = [];
    if (isAdult) reasons.push('adult');
    if (isViolent) reasons.push('violent');
    if (isRacy) reasons.push('suggestive');

    return NextResponse.json({
      moderated: true,
      flagged,
      reason: flagged ? `Inappropriate content detected: ${reasons.join(', ')}` : null,
      safeSearch: {
        adult: safeSearch.adult,
        violence: safeSearch.violence,
        racy: safeSearch.racy,
        medical: safeSearch.medical,
        spoof: safeSearch.spoof,
      },
    });
  } catch (error: any) {
    console.error('Moderation error:', error);
    // Fail-open on internal errors — don't block uploads
    return NextResponse.json({
      moderated: false,
      flagged: false,
      reason: null,
      safeSearch: null,
    });
  }
}
