/**
 * VideoCard Component
 * 
 * A reusable card component for displaying video information with thumbnail, metadata, and actions.
 */

import React from 'react';
import { type VideoCardProps } from '../types';
import { VideoThumbnail } from './VideoThumbnail';
import {
  formatFileSize,
  formatVideoDate,
  getRelativeTime,
  getFormatDisplayName,
  getStatusBadgeClass,
  getResolutionString,
} from '../utils/videoUtils';

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onClick,
  showMetadata = true,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(video);
    }
  };

  const handleThumbnailClick = () => {
    handleClick();
  };

  const cardClasses = [
    'bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-theme-md',
    onClick ? 'cursor-pointer hover:border-gray-300' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick ? handleClick : undefined}>
      {/* Thumbnail */}
      <div className="relative">
        <VideoThumbnail
          fileId={video.file_id}
          width={320}
          height={180}
          alt={`Thumbnail for ${video.filename}`}
          onClick={onClick ? handleThumbnailClick : undefined}
          className="w-full"
        />

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(video.status)}`}>
            {video.status}
          </span>
        </div>

        {/* Format Badge */}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {getFormatDisplayName(video.format)}
          </span>
        </div>

        {/* Streamable Indicator */}
        {video.is_streamable && (
          <div className="absolute bottom-2 left-2">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Streamable
            </div>
          </div>
        )}

        {/* Conversion Needed Indicator */}
        {video.needs_conversion && (
          <div className="absolute bottom-2 right-2">
            <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Needs Conversion
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={video.filename}>
          {video.filename}
        </h3>

        {/* Camera Name */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          {video.camera_name}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
          <div>
            <span className="font-medium">Size:</span> {formatFileSize(video.file_size_bytes)}
          </div>
          <div>
            <span className="font-medium">Created:</span> {getRelativeTime(video.created_at)}
          </div>
        </div>

        {/* Metadata (if available and requested) */}
        {showMetadata && 'metadata' in video && video.metadata && (
          <div className="border-t pt-3 mt-3 border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Duration:</span> {Math.round(video.metadata.duration_seconds)}s
              </div>
              <div>
                <span className="font-medium">Resolution:</span> {getResolutionString(video.metadata.width, video.metadata.height)}
              </div>
              <div>
                <span className="font-medium">FPS:</span> {video.metadata.fps}
              </div>
              <div>
                <span className="font-medium">Codec:</span> {video.metadata.codec}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {formatVideoDate(video.created_at)}
          </div>

          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium transition rounded-lg border border-transparent bg-brand-500 text-white hover:bg-brand-600 shadow-theme-xs"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
