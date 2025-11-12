import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { uploadFileAndGetPublicLink, getThumbnailLink, type FilePurpose } from '../api/cloudStorage';

interface ImageUploadProps {
  purpose: FilePurpose;
  generateUniqueFileName: (file: File) => string;
  onUploadComplete: (publicLink: string) => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

/**
 * Reusable image upload component with preview
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  purpose,
  generateUniqueFileName,
  onUploadComplete,
  currentImageUrl,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing image from pCloud if currentImageUrl is provided
  useEffect(() => {
    console.log('ImageUpload: currentImageUrl changed:', currentImageUrl);
    console.log('ImageUpload: currentImageUrl type:', typeof currentImageUrl);
    console.log('ImageUpload: currentImageUrl length:', currentImageUrl?.length);
    
    // Check for empty string or null/undefined
    if (!currentImageUrl || currentImageUrl.trim() === '') {
      console.log('ImageUpload: No valid currentImageUrl, setting preview to null');
      setPreview(null);
      setError(null); // Clear any previous errors
      return;
    }

    // If it's a pCloud public link, convert it to download link
    if (currentImageUrl.includes('pcloud.link')) {
      console.log('ImageUpload: Detected pCloud link, converting to thumbnail link');
      setLoadingPreview(true);
      try {
        const thumbnailUrl = getThumbnailLink(currentImageUrl);
        console.log('ImageUpload: Got thumbnail link:', thumbnailUrl);
        setPreview(thumbnailUrl);
        setLoadingPreview(false);
      } catch (err) {
        console.error('ImageUpload: Failed to load image preview:', err);
        setLoadingPreview(false);
        setError(err instanceof Error ? err.message : 'Failed to load existing image');
        // Show placeholder
        setPreview(null);
      }
    } else {
      console.log('ImageUpload: Using direct URL');
      // Direct URL (like data URL from file reader)
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    return null;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      const uniqueFileName = generateUniqueFileName(file);
      const publicLink = await uploadFileAndGetPublicLink(file, purpose, uniqueFileName);
      onUploadComplete(publicLink);
      setUploading(false);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      // Preview will be restored by useEffect if currentImageUrl is still valid
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {loadingPreview ? (
        <div className="w-32 h-32 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 rounded-full object-contain border-2 border-gray-300"
            onError={() => {
              console.error('Failed to load image:', preview);
              setPreview(null);
            }}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleButtonClick}
          className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-gray-50"
        >
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-1 text-xs text-gray-500">Upload image</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        className="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-montserrat"
      >
        {uploading ? 'Завантаження...' : preview ? 'Змінити зображення' : 'Вибрати зображення'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-montserrat">{error}</p>
      )}

      <p className="mt-1 text-xs text-gray-500 font-montserrat">
        Max size: {maxSizeMB}MB. Formats: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}
      </p>
    </div>
  );
};

