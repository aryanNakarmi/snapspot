'use client';

import { useRef, useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinaryService';
import { addPhoto } from '@/lib/eventService';

interface CameraCaptureProps {
  eventId: string;
  onUploadSuccess: () => void;
}

export default function CameraCapture({
  eventId,
  onUploadSuccess,
}: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      // Upload to Cloudinary
      const cloudinaryData = await uploadToCloudinary(selectedFile);

      // Save to Firestore
      await addPhoto(eventId, {
        cloudinaryUrl: cloudinaryData.url,
        cloudinaryPublicId: cloudinaryData.publicId,
        uploaderDevice: navigator.userAgent,
      });

      // Reset state
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center justify-center gap-2"
        >
          <span>📸</span> Take Photo
        </button>
      ) : (
        <div className="space-y-3">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-96 object-contain rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
    </div>
  );
}
