import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

// Hugging Face Inference API - free tier, no time limit
// Get your free token at: https://huggingface.co/settings/tokens
const HF_TOKEN = process.env.HF_TOKEN;

// Model for object detection - good at detecting common objects
const DETECTION_MODEL = 'facebook/detr-resnet-50';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // If no HF token configured, skip analysis (pass through)
    if (!HF_TOKEN) {
      console.warn('HF_TOKEN not set — object detection is disabled');
      return NextResponse.json({
        analyzed: false,
        tags: [],
        tagCount: 0,
        message: 'Hugging Face token not configured. Set HF_TOKEN in .env.local',
      });
    }

    const hf = new HfInference(HF_TOKEN);

    // Fetch the image from Cloudinary (server-to-server)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from Cloudinary: ${imageResponse.status}`);
    }

    // Get the image as a Blob (Hugging Face SDK accepts Blob directly)
    const imageBlob = await imageResponse.blob();

    // Run object detection using Hugging Face's free Inference API
    const detections = await hf.objectDetection({
      data: imageBlob,
      model: DETECTION_MODEL,
    });

    // Lower threshold (0.3) to catch more detections
    // The free API can return conservative confidence scores
    const tags: string[] = [];
    for (const detection of detections) {
      if (detection.score >= 0.3) {
        const label = detection.label.toLowerCase();
        if (!tags.includes(label)) {
          tags.push(label);
        }
      }
    }

    console.log(`Hugging Face raw: ${detections.length} detections`);
    detections.forEach((d, i) => {
      console.log(`  #${i}: label="${d.label}" score=${d.score}`);
    });
    console.log(`Hugging Face filtered tags:`, tags);

    return NextResponse.json({
      analyzed: true,
      tags,
      tagCount: tags.length,
    });
  } catch (error: any) {
    console.error('Hugging Face analysis error:', error);

    // Check for common errors
    const errorMessage = error?.message || 'Analysis failed';

    // Handle rate limiting
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json({
        analyzed: false,
        tags: [],
        tagCount: 0,
        error: 'RATE_LIMITED',
        message: 'Hugging Face API rate limit reached. Try again later.',
      });
    }

    // Handle model loading (cold start - first request may take longer)
    if (errorMessage.includes('loading') || errorMessage.includes('cold start')) {
      return NextResponse.json({
        analyzed: false,
        tags: [],
        tagCount: 0,
        error: 'MODEL_LOADING',
        message: 'Model is loading. Please try again.',
      });
    }

    // Fail-open — don't block uploads
    console.warn('Returning empty tags due to error:', errorMessage);
    return NextResponse.json({
      analyzed: false,
      tags: [],
      tagCount: 0,
      error: errorMessage,
    });
  }
}
