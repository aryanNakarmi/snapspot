import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HF_TOKEN;
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// NSFW detection model on Hugging Face — free to use with any HF token
const NSFW_MODEL = 'Falconsai/nsfw_image_detection';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // Check if any moderation is configured at all
    const noModerationConfigured = !HF_TOKEN && !GOOGLE_VISION_API_KEY;

    if (noModerationConfigured) {
      console.warn(
        '⚠️ No moderation configured! Set HF_TOKEN or GOOGLE_VISION_API_KEY in .env.local'
      );
      return NextResponse.json({
        moderated: false,
        configured: false,
        flagged: false,
        reason: null,
        safeSearch: null,
        labels: [],
        faces: [],
      });
    }

    let flagged = false;
    let moderationReason: string | null = null;
    let hfNsfwResult: any = null;
    let googleSafeSearch: any = null;
    let labels: any[] = [];
    let faces: any[] = [];

    // --- Phase 1: Hugging Face NSFW detection (free, no API key needed beyond HF_TOKEN) ---
    if (HF_TOKEN) {
      try {
        const hf = new HfInference(HF_TOKEN);

        // Fetch the image
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();

          const classifications = await hf.imageClassification({
            data: imageBlob,
            model: NSFW_MODEL,
          });

          hfNsfwResult = classifications;

          // The model returns labels like "normal", "nsfw" with confidence scores
          // Flag if the highest NSFW label crosses the threshold
          const nsfwThreshold = 0.6;
          for (const c of classifications) {
            const label = c.label.toLowerCase();
            const score = c.score;
            if (
              (label === 'nsfw' || label === 'porn' || label === 'hentai') &&
              score >= nsfwThreshold
            ) {
              flagged = true;
              moderationReason = `Inappropriate content detected (${Math.round(score * 100)}% confidence)`;
              break;
            }
          }
        }
      } catch (error: any) {
        console.error('Hugging Face NSFW detection error:', error?.message || error);
        // Don't fail the whole moderation — let Google Vision try if available
      }
    }

    // --- Phase 2: Google Vision Safe Search (secondary, if configured) ---
    if (GOOGLE_VISION_API_KEY && !flagged) {
      try {
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

        if (response.ok) {
          const data = await response.json();
          const annotations = data.responses?.[0];
          const safeSearch = annotations?.safeSearchAnnotation;

          if (safeSearch) {
            googleSafeSearch = safeSearch;
            const rejectionThresholds = ['LIKELY', 'VERY_LIKELY'];
            const isAdult = rejectionThresholds.includes(safeSearch.adult);
            const isViolent = rejectionThresholds.includes(safeSearch.violence);

            if (isAdult || isViolent) {
              flagged = true;
              const reasons: string[] = [];
              if (isAdult) reasons.push('adult');
              if (isViolent) reasons.push('violent');
              moderationReason = `Inappropriate content detected: ${reasons.join(', ')}`;
            }
          }

          // Labels and faces for grouping
          labels = annotations?.labelAnnotations?.map((label: any) => ({
            description: label.description,
            score: label.score,
            topicality: label.topicality,
          })) || [];

          faces = annotations?.faceAnnotations?.map((face: any) => ({
            boundingPoly: face.boundingPoly,
            detectionConfidence: face.detectionConfidence,
            landmarkingConfidence: face.landmarkingConfidence,
            joyLikelihood: face.joyLikelihood,
            sorrowLikelihood: face.sorrowLikelihood,
            angerLikelihood: face.angerLikelihood,
            surpriseLikelihood: face.surpriseLikelihood,
          })) || [];
        }
      } catch (error: any) {
        console.error('Google Vision API error:', error?.message || error);
        // If Google Vision fails but Hugging Face already checked, we still have that result
      }
    }

    // If Hugging Face flagged it, add NSFW detail to the response
    if (hfNsfwResult && flagged) {
      console.log('NSFW detection result:', JSON.stringify(hfNsfwResult));
    }

    return NextResponse.json({
      moderated: true,
      configured: true,
      flagged,
      reason: moderationReason,
      hfNsfw: hfNsfwResult,
      safeSearch: googleSafeSearch
        ? {
            adult: googleSafeSearch.adult,
            violence: googleSafeSearch.violence,
            racy: googleSafeSearch.racy,
            medical: googleSafeSearch.medical,
            spoof: googleSafeSearch.spoof,
          }
        : null,
      labels,
      faces,
    });
  } catch (error: any) {
    console.error('Moderation error:', error);
    // Fail-closed: if moderation itself crashes, block the upload for safety
    return NextResponse.json({
      moderated: false,
      configured: true,
      flagged: true,
      reason: 'Moderation system error. Please try again.',
      safeSearch: null,
      labels: [],
      faces: [],
    });
  }
}
