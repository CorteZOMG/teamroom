import { useState } from 'react';
import { getThumbnailLink, getViewLink, getDownloadLink } from '../api/cloudStorage';

interface FilePreviewProps {
  fileName: string;
  fileUrl: string;
  showThumbnail?: boolean;
}

export function FilePreview({ fileName, fileUrl, showThumbnail = true }: FilePreviewProps) {
  const [loading, setLoading] = useState(false);

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const isImage = (name: string): boolean => {
    const ext = getFileExtension(name);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  };

  const isPDF = (name: string): boolean => {
    return getFileExtension(name) === 'pdf';
  };

  const isDocument = (name: string): boolean => {
    const ext = getFileExtension(name);
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(ext);
  };

  const canShowThumbnail = (name: string): boolean => {
    // Only images can have thumbnails from pCloud
    return isImage(name);
  };

  const getFileIcon = (name: string): string => {
    const ext = getFileExtension(name);
    
    if (isImage(name)) return '🖼️';
    if (isPDF(name)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    if (['mp4', 'avi', 'mov'].includes(ext)) return '🎥';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎵';
    
    return '📎';
  };

  const handleView = async () => {
    try {
      setLoading(true);
      
      // For Office documents, use Google Docs viewer
      if (isDocument(fileName)) {
        // Get the download URL first (will fail with CORS error until backend fixes it)
        const downloadUrl = await getDownloadLink(fileUrl);
        // Use Google Docs viewer which can render Office files
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}&embedded=true`;
        window.open(viewerUrl, '_blank');
      } else {
        // For images and PDFs, use pCloud's viewer
        const viewUrl = getViewLink(fileUrl);
        window.open(viewUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Не вдалося відкрити файл для перегляду. Проблема CORS - потрібне виправлення бекенду.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      // This will fail with CORS error (7010) until backend implements proxy endpoint
      const downloadUrl = await getDownloadLink(fileUrl);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Не вдалося завантажити файл. Проблема CORS - потрібне виправлення бекенду.');
    } finally {
      setLoading(false);
    }
  };

  const canPreview = isImage(fileName) || isPDF(fileName) || isDocument(fileName);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-[10px] transition-colors">
      {/* Thumbnail or Icon */}
      {showThumbnail && canShowThumbnail(fileName) ? (
        <img 
          src={getThumbnailLink(fileUrl, 64)}
          alt={fileName}
          className="w-12 h-12 object-cover rounded-md flex-shrink-0"
          onError={(e) => {
            // Fallback to icon if thumbnail fails
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-md flex-shrink-0 text-2xl">
          {getFileIcon(fileName)}
        </div>
      )}

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium font-montserrat text-primary truncate">{fileName}</p>
        <p className="text-xs text-gray-500 font-montserrat">
          {getFileExtension(fileName).toUpperCase()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {canPreview && (
          <button
            onClick={handleView}
            disabled={loading}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
            title="Переглянути у браузері (Google Docs для документів)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
        
        <button
          onClick={handleDownload}
          disabled={loading}
          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
          title="Завантажити файл (поки не працює через CORS)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

