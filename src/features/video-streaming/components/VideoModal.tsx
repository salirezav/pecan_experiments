/**
 * VideoModal Component
 * 
 * A modal component for displaying videos in fullscreen with detailed information.
 */

import React, { useEffect } from 'react';
import { type VideoFile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { VideoDebugger } from './VideoDebugger';
import { useVideoInfo } from '../hooks/useVideoInfo';
import {
  formatFileSize,
  formatVideoDate,
  getFormatDisplayName,
  getStatusBadgeClass,
  getResolutionString,
  formatDuration,
  isWebCompatible,
} from '../utils/videoUtils';

interface VideoModalProps {
  video: VideoFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  const { videoInfo, streamingInfo, loading, error } = useVideoInfo(
    video?.file_id || null,
    { autoFetch: isOpen && !!video }
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
              {video.filename}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
            {/* Video Player */}
            <div className="flex-1 bg-black">
              <VideoPlayer
                fileId={video.file_id}
                controls={true}
                className="w-full h-full min-h-[300px] lg:min-h-[400px]"
              />
            </div>

            {/* Sidebar with Video Info */}
            <div className="w-full lg:w-80 bg-gray-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Status and Format */}
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(video.status)}`}>
                    {video.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isWebCompatible(video.format)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {getFormatDisplayName(video.format)}
                  </span>
                  {isWebCompatible(video.format) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Web Compatible
                    </span>
                  )}
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Camera:</dt>
                        <dd className="text-gray-900">{video.camera_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">File Size:</dt>
                        <dd className="text-gray-900">{formatFileSize(video.file_size_bytes)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Created:</dt>
                        <dd className="text-gray-900">{formatVideoDate(video.created_at)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Streamable:</dt>
                        <dd className="text-gray-900">{video.is_streamable ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Video Metadata */}
                  {videoInfo?.metadata && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Video Details</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Duration:</dt>
                          <dd className="text-gray-900">{formatDuration(videoInfo.metadata.duration_seconds)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Resolution:</dt>
                          <dd className="text-gray-900">
                            {getResolutionString(videoInfo.metadata.width, videoInfo.metadata.height)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Frame Rate:</dt>
                          <dd className="text-gray-900">{videoInfo.metadata.fps} fps</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Codec:</dt>
                          <dd className="text-gray-900">{videoInfo.metadata.codec}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Aspect Ratio:</dt>
                          <dd className="text-gray-900">{videoInfo.metadata.aspect_ratio.toFixed(2)}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Streaming Info */}
                  {streamingInfo && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Streaming Details</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Content Type:</dt>
                          <dd className="text-gray-900">{streamingInfo.content_type}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Range Requests:</dt>
                          <dd className="text-gray-900">{streamingInfo.supports_range_requests ? 'Supported' : 'Not Supported'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Chunk Size:</dt>
                          <dd className="text-gray-900">{formatFileSize(streamingInfo.chunk_size_bytes)}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading === 'loading' && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading video details...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error loading video details</h3>
                          <p className="text-sm text-red-700 mt-1">{error.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Debugger (development only) */}
                  <VideoDebugger fileId={video.file_id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
