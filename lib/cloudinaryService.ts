import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'snapspot_uploads';

export const uploadToCloudinary = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'snapspot/events');

    // Note: `phash` is not available for unsigned uploads per Cloudinary's
    // allowed parameter list. See photoGrouping.ts for the fallback behavior.

    // IMPORTANT: Do NOT set Content-Type manually when using FormData with axios.
    // The browser needs to set it automatically with the correct multipart boundary.
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      phash: response.data.phash || null,
      width: response.data.width,
      height: response.data.height,
    };
  } catch (error: any) {
    // Extract the actual Cloudinary error message from the response
    const cloudinaryError =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error.message;
    console.error('Cloudinary upload error:', cloudinaryError);
    throw new Error(cloudinaryError);
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    // Note: This requires backend route with API secret for security
    const response = await axios.post('/api/delete-photo', { publicId });
    return response.data;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};
