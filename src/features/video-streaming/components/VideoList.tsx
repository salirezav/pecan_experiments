/**
 * VideoList Component
 * 
 * A reusable component for displaying a list/grid of videos with filtering, sorting, and pagination.
 */

import React, { useState, useEffect } from 'react';
import { type VideoListProps, type VideoListFilters, type VideoListSortOptions } from '../types';
import { useVideoList } from '../hooks/useVideoList';
import { VideoCard } from './VideoCard';
import { Pagination, PageInfo } from './Pagination';

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
    currentPage,
    totalPages,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    goToPage,
    nextPage,
    previousPage,
    updateFilters,
    updateSort,
  } = useVideoList({
    initialParams: {
      camera_name: localFilters.cameraName,
      start_date: localFilters.dateRange?.start,
      end_date: localFilters.dateRange?.end,
      limit,
      include_metadata: true,
      page: 1, // Start with page 1
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
          {totalPages > 0 ? (
            <>Showing page {currentPage} of {totalPages} ({totalCount} total videos)</>
          ) : (
            <>Showing {videos.length} of {totalCount} videos</>
          )}
        </div>

        <button
          onClick={refetch}
          disabled={loading === 'loading'}
          className="inline-flex items-center px-3 py-2 text-sm font-medium transition rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading === 'loading' ? 'Refreshing...' : 'Refresh'}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 space-y-4">
          {/* Page Info */}
          <PageInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={limit}
            className="text-center"
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            showFirstLast={true}
            showPrevNext={true}
            maxVisiblePages={5}
            className="justify-center"
          />
        </div>
      )}

      {/* Loading Indicator */}
      {loading === 'loading' && (
        <div className="flex justify-center mt-8">
          <div className="text-sm text-gray-600 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500 mr-2"></div>
            Loading videos...
          </div>
        </div>
      )}
    </div>
  );
};
