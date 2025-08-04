/**
 * VideoStreamingPage Component
 * 
 * Main page component for the video streaming feature.
 * Demonstrates how to compose the modular components together.
 */

import React, { useState, useMemo } from 'react';
import { VideoList, VideoModal } from './components';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
            <p className="mt-2 text-gray-600">
              Browse and view recorded videos from your camera system
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Camera Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Camera
              </label>
              <select
                value={filters.cameraName || 'all'}
                onChange={(e) => handleCameraFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Cameras</option>
                {availableCameras.map(camera => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortOptions.field}
                  onChange={(e) => handleSortChange(e.target.value as VideoListSortOptions['field'], sortOptions.direction)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="file_size_bytes">File Size</option>
                  <option value="camera_name">Camera Name</option>
                  <option value="filename">Filename</option>
                </select>
                <button
                  onClick={() => handleSortChange(sortOptions.field, sortOptions.direction === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title={`Sort ${sortOptions.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOptions.direction === 'asc' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange(e.target.value, filters.dateRange?.end || '')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange(filters.dateRange?.start || '', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.cameraName || filters.dateRange) && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setFilters({})}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
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
      </div>

      {/* Video Modal */}
      <VideoModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};
