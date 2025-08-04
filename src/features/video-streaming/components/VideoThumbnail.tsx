/**
 * VideoThumbnail Component
 * 
 * A reusable component for displaying video thumbnails with loading states and error handling.
 */

import React, { useState, useEffect } from 'react';
import { videoApiService } from '../services/videoApi';
import { type VideoThumbnailProps } from '../types';

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  fileId,
  timestamp = 0,
  width = 320,
  height = 240,
  alt = 'Video thumbnail',
  className = '',
  onClick,
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadThumbnail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const blob = await videoApiService.getThumbnailBlob(fileId, {
          timestamp,
          width,
          height,
        });

        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setThumbnailUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load thumbnail');
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [fileId, timestamp, width, height]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  const handleClick = () => {
    if (onClick && !isLoading && !error) {
      onClick();
    }
  };

  const containerClasses = [
    'relative overflow-hidden bg-gray-200 rounded',
    onClick && !isLoading && !error ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      style={{ width, height }}
      onClick={handleClick}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm p-2 text-center">
          <div>
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>Failed to load thumbnail</div>
          </div>
        </div>
      )}

      {/* Thumbnail Image */}
      {thumbnailUrl && !isLoading && !error && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError('Failed to display thumbnail')}
        />
      )}

      {/* Play Overlay */}
      {onClick && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30">
          <div className="bg-white bg-opacity-90 rounded-full p-3">
            <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Timestamp Badge */}
      {timestamp > 0 && !isLoading && !error && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {Math.floor(timestamp / 60)}:{(timestamp % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
};
