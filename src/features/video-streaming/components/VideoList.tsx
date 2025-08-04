/**
 * VideoList Component
 * 
 * A reusable component for displaying a list/grid of videos with filtering, sorting, and pagination.
 */

import React, { useState, useEffect } from 'react';
import { type VideoListProps, type VideoListFilters, type VideoListSortOptions } from '../types';
import { useVideoList } from '../hooks/useVideoList';
import { VideoCard } from './VideoCard';

export const VideoList: React.FC<VideoListProps> = ({
  filters,
  sortOptions,
  limit = 20,
  onVideoSelect,
  className = '',
}) => {
  const [localFilters, setLocalFilters] = useState<VideoListFilters>(filters || {});
  const [localSort, setLocalSort] = useState<VideoListSortOptions>(
    sortOptions || { field: 'created_at', direction: 'desc' }
  );

  const {
    videos,
    totalCount,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    updateFilters,
    updateSort,
  } = useVideoList({
    initialParams: {
      camera_name: localFilters.cameraName,
      start_date: localFilters.dateRange?.start,
      end_date: localFilters.dateRange?.end,
      limit,
      include_metadata: true,
    },
    autoFetch: true,
  });

  // Update filters when props change (but don't auto-fetch)
  useEffect(() => {
    if (filters) {
      setLocalFilters(filters);
    }
  }, [filters]);

  // Update sort when props change
  useEffect(() => {
    if (sortOptions) {
      setLocalSort(sortOptions);
      updateSort(sortOptions);
    }
  }, [sortOptions, updateSort]);

  const handleVideoClick = (video: any) => {
    if (onVideoSelect) {
      onVideoSelect(video);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && loading !== 'loading') {
      loadMore();
    }
  };

  const containerClasses = [
    'video-list',
    className,
  ].filter(Boolean).join(' ');

  if (loading === 'loading' && videos.length === 0) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Videos</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Videos Found</h3>
            <p className="text-gray-600">No videos match your current filters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Showing {videos.length} of {totalCount} videos
        </div>

        <button
          onClick={refetch}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.file_id}
            video={video}
            onClick={onVideoSelect ? handleVideoClick : undefined}
            showMetadata={true}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading === 'loading'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Load More Videos
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading Indicator for Additional Videos */}
      {loading === 'loading' && videos.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="text-sm text-gray-600 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Loading more videos...
          </div>
        </div>
      )}
    </div>
  );
};
