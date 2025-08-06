/**
 * VideoStreamingPage Component
 * 
 * Main page component for the video streaming feature.
 * Demonstrates how to compose the modular components together.
 */

import React, { useState, useMemo } from 'react';
import { VideoList, VideoModal, ApiStatusIndicator, VideoErrorBoundary, PerformanceDashboard } from './components';
import { type VideoFile, type VideoListFilters, type VideoListSortOptions } from './types';

export const VideoStreamingPage: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<VideoListFilters>({});
  const [sortOptions, setSortOptions] = useState<VideoListSortOptions>({
    field: 'created_at',
    direction: 'desc',
  });

  // Available cameras for filtering (this could come from an API)
  const availableCameras = ['camera1', 'camera2', 'camera3']; // This should be fetched from your camera API

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleCameraFilterChange = (cameraName: string) => {
    setFilters(prev => ({
      ...prev,
      cameraName: cameraName === 'all' ? undefined : cameraName,
    }));
  };

  const handleSortChange = (field: VideoListSortOptions['field'], direction: VideoListSortOptions['direction']) => {
    setSortOptions({ field, direction });
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: start && end ? { start, end } : undefined,
    }));
  };

  return (
    <VideoErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
            <p className="mt-2 text-gray-600">
              Browse and view recorded videos from your camera system
            </p>
          </div>
          <div className="flex-shrink-0">
            <ApiStatusIndicator showDetails={false} />
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-theme-sm">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Camera Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera
              </label>
              <div className="relative">
                <select
                  value={filters.cameraName || 'all'}
                  onChange={(e) => handleCameraFilterChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-theme-xs transition-colors"
                >
                  <option value="all">All Cameras</option>
                  {availableCameras.map(camera => (
                    <option key={camera} value={camera}>
                      {camera}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={sortOptions.field}
                    onChange={(e) => handleSortChange(e.target.value as VideoListSortOptions['field'], sortOptions.direction)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-theme-xs transition-colors"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="file_size_bytes">File Size</option>
                    <option value="camera_name">Camera Name</option>
                    <option value="filename">Filename</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => handleSortChange(sortOptions.field, sortOptions.direction === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-theme-xs transition-colors"
                  title={`Sort ${sortOptions.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOptions.direction === 'asc' ? (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange(e.target.value, filters.dateRange?.end || '')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-theme-xs transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange(filters.dateRange?.start || '', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-theme-xs transition-colors"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.cameraName || filters.dateRange) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setFilters({})}
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium transition rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-theme-xs"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Video List */}
        <VideoList
          filters={filters}
          sortOptions={sortOptions}
          onVideoSelect={handleVideoSelect}
          limit={24}
        />

        {/* Video Modal */}
        <VideoModal
          video={selectedVideo}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />

        {/* Performance Dashboard (development only) */}
        <PerformanceDashboard />
      </div>
    </VideoErrorBoundary>
  );
};
