import { useEffect, useState } from 'react';
import { getDownloadLink } from '../api/cloudStorage';

interface CloudImageProps {
  publicLink: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Component that displays images from pCloud
 * Automatically converts public links to temporary download links
 */
export const CloudImage: React.FC<CloudImageProps> = ({
  publicLink,
  alt,
  className = '',
  fallbackSrc = '/default-avatar.png'
}) => {
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const link = await getDownloadLink(publicLink);
        
        if (isMounted) {
          setDownloadLink(link);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load image from pCloud:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [publicLink]);

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !downloadLink) {
    // If no fallback provided, show nothing
    if (!fallbackSrc) {
      return <div className={className}></div>;
    }
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <img
      src={downloadLink}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

