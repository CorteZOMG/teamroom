import { useState, useRef, type ChangeEvent } from 'react';
import { uploadFileAndGetPublicLink, type FilePurpose } from '../api/cloudStorage';

export interface UploadedFile {
  name?: string;
  fileUrl: string;
}

interface FileUploadProps {
  purpose: FilePurpose;
  generateUniqueFileName: (file: File, index: number) => string;
  onFilesChange: (files: UploadedFile[]) => void;
  currentFiles?: UploadedFile[];
  maxSizeMB?: number;
  maxFiles?: number;
  acceptedFormats?: string[];
  className?: string;
  label?: string;
}

/**
 * Component for uploading multiple files (for materials, assignments, etc.)
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  purpose,
  generateUniqueFileName,
  onFilesChange,
  currentFiles = [],
  maxSizeMB = 10,
  maxFiles = 10,
  acceptedFormats = ['*/*'], // Accept all by default
  className = '',
  label = 'Файли'
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(currentFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Файл "${file.name}" перевищує ліміт ${maxSizeMB}MB`;
    }

    // Check file type if specific formats are required
    if (acceptedFormats.length > 0 && !acceptedFormats.includes('*/*')) {
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isAccepted = acceptedFormats.some(format => {
        if (format.startsWith('.')) {
          return fileExtension === format.toLowerCase();
        }
        return fileType === format;
      });

      if (!isAccepted) {
        return `Файл "${file.name}" має непідтримуваний формат`;
      }
    }

    return null;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Максимальна кількість файлів: ${maxFiles}`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(`Завантаження ${i + 1}/${selectedFiles.length}: ${file.name}`);

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        // Upload file
        const uniqueFileName = generateUniqueFileName(file, files.length + i);
        const publicLink = await uploadFileAndGetPublicLink(file, purpose, uniqueFileName);

        uploadedFiles.push({
          name: file.name,
          fileUrl: publicLink
        });
      }

      // Update files list
      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);

      setUploadProgress('');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return '🖼️';
    } else if (['pdf'].includes(extension || '')) {
      return '📄';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return '📊';
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return '📊';
    } else if (['zip', 'rar', '7z'].includes(extension || '')) {
      return '📦';
    } else if (['mp4', 'avi', 'mov', 'mkv'].includes(extension || '')) {
      return '🎥';
    } else if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
      return '🎵';
    } else {
      return '📎';
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        multiple
        className="hidden"
        disabled={uploading || files.length >= maxFiles}
      />

      <div className="flex items-center justify-between mb-3">
        <label className="text-primary text-sm font-medium font-montserrat">
          {label} {files.length > 0 && `(${files.length}/${maxFiles})`}
        </label>
        
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={uploading || files.length >= maxFiles}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-montserrat"
        >
          {uploading ? uploadProgress || 'Завантаження...' : '+ Додати файли'}
        </button>
      </div>

      {/* Files list */}
      {files.length > 0 && (
        <div className="space-y-2 mb-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(file.name || 'file')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate font-montserrat">
                    {file.name || 'Файл'}
                  </p>
                  <p className="text-xs text-gray-500 truncate font-montserrat">
                    {file.fileUrl}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                disabled={uploading}
                className="ml-3 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                title="Видалити файл"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 font-montserrat">{error}</p>
      )}

      <p className="mt-1 text-xs text-gray-500 font-montserrat">
        Макс. розмір: {maxSizeMB}MB на файл. Макс. кількість: {maxFiles} файлів
      </p>
    </div>
  );
};

