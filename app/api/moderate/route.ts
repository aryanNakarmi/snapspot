import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HF_TOKEN;
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// ── Hugging Face NSFW models ──
// Run multiple models in parallel for better coverage
const NSFW_MODELS = [
  { name: 'Falconsai/nsfw_image_detection', restrictive: false },
  { name: 'AdamCodd/vit-base-nsfw-detector', restrictive: true },
];

// Expanded NSFW label keywords — catches more explicit content variants
const NSFW_LABELS = new Set([
  'nsfw', 'porn', 'pornographic', 'hentai', 'explicit',
  'adult', 'nudity', 'nude', 'naked', 'sexual', 'sex',
  'erotica', 'erotic', 'xxx', '18+', 'mature',
  'provocative', 'suggestive', 'intimate',
]);

// Lower threshold — catches borderline content that the high threshold misses
const NSFW_THRESHOLD = 0.35;

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

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
    let allHfResults: any[] = [];
    let googleSafeSearch: any = null;
    let labels: any[] = [];
    let faces: any[] = [];

    // ── Run Hugging Face and Google Vision in parallel ──
    const results = await Promise.allSettled([
      // Task 1: Hugging Face multi-model NSFW detection
      (async () => {
        if (!HF_TOKEN) return [];
        const hf = new HfInference(HF_TOKEN);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) return [];

        const imageBlob = await imageResponse.blob();
        const modelResults: { model: string; label: string; score: number }[] = [];

        for (const model of NSFW_MODELS) {
          try {
            const classifications = await hf.imageClassification({
              data: imageBlob,
              model: model.name,
            });

            for (const c of classifications) {
              modelResults.push({
                model: model.name,
                label: c.label.toLowerCase(),
                score: c.score,
              });
            }
          } catch (err: any) {
            console.warn(`HF model ${model.name} failed:`, err?.message || err);
          }
        }

        return modelResults;
      })(),

      // Task 2: Google Vision Safe Search (if configured)
      (async () => {
        if (!GOOGLE_VISION_API_KEY) return null;

        const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: imageUrl } },
              features: [
                { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
                { type: 'LABEL_DETECTION', maxResults: 20 },
                { type: 'FACE_DETECTION', maxResults: 10 },
              ],
            }],
          }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const annotations = data.responses?.[0];

        return {
          safeSearch: annotations?.safeSearchAnnotation || null,
          labels: annotations?.labelAnnotations?.map((l: any) => ({
            description: l.description,
            score: l.score,
            topicality: l.topicality,
          })) || [],
          faces: annotations?.faceAnnotations?.map((f: any) => ({
            boundingPoly: f.boundingPoly,
            detectionConfidence: f.detectionConfidence,
            landmarkingConfidence: f.landmarkingConfidence,
            joyLikelihood: f.joyLikelihood,
            sorrowLikelihood: f.sorrowLikelihood,
            angerLikelihood: f.angerLikelihood,
            surpriseLikelihood: f.surpriseLikelihood,
          })) || [],
        };
      })(),
    ]);

    // ── Process HF results ──
    if (results[0].status === 'fulfilled') {
      allHfResults = results[0].value;

      // Check each model result for NSFW labels
      for (const r of allHfResults) {
        if (NSFW_LABELS.has(r.label) && r.score >= NSFW_THRESHOLD) {
          flagged = true;
          const modelName = r.model.split('/').pop() || 'unknown';
          moderationReason = `Inappropriate content detected (${modelName}: ${r.label} at ${Math.round(r.score * 100)}% confidence)`;
          break;
        }
      }
    }

    // ── Process Google Vision results ──
    if (results[1].status === 'fulfilled' && results[1].value) {
      const gv = results[1].value;
      googleSafeSearch = gv.safeSearch;
      labels = gv.labels;
      faces = gv.faces;

      if (gv.safeSearch) {
        const ss = gv.safeSearch;
        const rejectionLevels = ['LIKELY', 'VERY_LIKELY'];

        // Check adult content
        if (rejectionLevels.includes(ss.adult)) {
          flagged = true;
          moderationReason = `Inappropriate content detected: adult content (${ss.adult})`;
        }
        // Check violence
        else if (rejectionLevels.includes(ss.violence)) {
          flagged = true;
          moderationReason = `Inappropriate content detected: violent content (${ss.violence})`;
        }
        // Check racy at VERY_LIKELY (suggestive/sexual content)
        else if (ss.racy === 'VERY_LIKELY') {
          flagged = true;
          moderationReason = `Inappropriate content detected: suggestive content (${ss.racy})`;
        }
        // Combined signal: racy LIKELY + any HF detection above a lower threshold
        else if (ss.racy === 'LIKELY' && !flagged) {
          // Check if any HF model flagged something at a lower threshold
          const hasHfSignal = allHfResults.some(
            (r) => NSFW_LABELS.has(r.label) && r.score >= 0.2
          );
          if (hasHfSignal) {
            flagged = true;
            moderationReason = 'Inappropriate content detected: combined signals (racy + NSFW)';
          }
        }
      }
    }

    // ── Log detection details ──
    if (allHfResults.length > 0) {
      console.log('HF NSFW results:', JSON.stringify(allHfResults));
    }
    if (googleSafeSearch) {
      console.log('Google SafeSearch:', JSON.stringify(googleSafeSearch));
    }

    return NextResponse.json({
      moderated: true,
      configured: true,
      flagged,
      reason: moderationReason,
      hfNsfw: allHfResults.length > 0 ? allHfResults : null,
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
