import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
  
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId is required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      public_id: publicId,
      api_key: CLOUDINARY_API_KEY!,
      timestamp: Date.now().toString(),
    });

    // Create signature
    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(
        `public_id=${publicId}&timestamp=${Date.now()}${CLOUDINARY_API_SECRET}`
      )
      .digest('hex');

    params.append('signature', signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      params
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
