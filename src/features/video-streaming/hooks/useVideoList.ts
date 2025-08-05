/**
 * useVideoList Hook
 * 
 * Custom React hook for managing video list state, fetching, filtering, and pagination.
 * Provides a clean interface for components to interact with video data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { videoApiService } from '../services/videoApi';
import {
  type VideoFile,
  type VideoListParams,
  type VideoError,
  type LoadingState,
  type VideoListFilters,
  type VideoListSortOptions
} from '../types';

export interface UseVideoListReturn {
  videos: VideoFile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  loading: LoadingState;
  error: VideoError | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  updateFilters: (filters: VideoListFilters) => void;
  updateSort: (sortOptions: VideoListSortOptions) => void;
  clearCache: () => void;
  reset: () => void;
}
import { filterVideos, sortVideos } from '../utils/videoUtils';

interface UseVideoListOptions {
  initialParams?: VideoListParams;
  autoFetch?: boolean;
  cacheKey?: string;
}

export function useVideoList(options: UseVideoListOptions = {}) {
  const {
    initialParams = {},
    autoFetch = true,
    cacheKey = 'default'
  } = options;

  // State
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<VideoError | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Refs for cleanup and caching
  const abortControllerRef = useRef<AbortController | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch videos from API
   */
  const fetchVideos = useCallback(async (
    params: VideoListParams = initialParams,
    append: boolean = false
  ): Promise<void> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading('loading');
      setError(null);

      // Fetch from API
      const response = await videoApiService.getVideos(params);

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      // Update state
      setVideos(append ? prev => [...prev, ...response.videos] : response.videos);
      setTotalCount(response.total_count);

      // Update pagination state
      if (response.page && response.total_pages) {
        setCurrentPage(response.page);
        setTotalPages(response.total_pages);
        setHasMore(response.has_next || false);
      } else {
        // Fallback for offset-based pagination
        setHasMore(response.videos.length === (params.limit || 50));
      }

      setLoading('success');

    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      const videoError: VideoError = err instanceof Error
        ? { code: 'FETCH_ERROR', message: err.message, details: err }
        : { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' };

      setError(videoError);
      setLoading('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [initialParams]);

  /**
   * Refetch videos with current page
   */
  const refetch = useCallback(async (): Promise<void> => {
    const currentParams = {
      ...initialParams,
      page: currentPage,
      limit: initialParams.limit || 20,
    };
    await fetchVideos(currentParams, false);
  }, [fetchVideos, initialParams, currentPage]);

  /**
   * Load more videos (pagination) - for backward compatibility
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading === 'loading') {
      return;
    }

    const offset = videos.length;
    const params = { ...initialParams, offset };
    await fetchVideos(params, true);
  }, [hasMore, loading, videos.length, initialParams, fetchVideos]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(async (page: number): Promise<void> => {
    if (page < 1 || (totalPages > 0 && page > totalPages) || loading === 'loading') {
      return;
    }

    const params = { ...initialParams, page, limit: initialParams.limit || 20 };
    await fetchVideos(params, false);
  }, [initialParams, totalPages, loading, fetchVideos]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(async (): Promise<void> => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(async (): Promise<void> => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  /**
   * Update filters and refetch
   */
  const updateFilters = useCallback((filters: VideoListFilters): void => {
    const newParams: VideoListParams = {
      ...initialParams,
      camera_name: filters.cameraName,
      start_date: filters.dateRange?.start,
      end_date: filters.dateRange?.end,
      page: 1, // Reset to first page when filters change
      limit: initialParams.limit || 20,
    };

    fetchVideos(newParams, false);
  }, [initialParams, fetchVideos]);

  /**
   * Update sort options and refetch
   */
  const updateSort = useCallback((sortOptions: VideoListSortOptions): void => {
    // Since the API doesn't support sorting, we'll sort locally
    setVideos(prev => sortVideos(prev, sortOptions.field, sortOptions.direction));
  }, []);

  /**
   * Clear cache (placeholder for future caching implementation)
   */
  const clearCache = useCallback((): void => {
    // TODO: Implement cache clearing when caching is added
    console.log('Cache cleared');
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback((): void => {
    setVideos([]);
    setTotalCount(0);
    setCurrentPage(1);
    setTotalPages(0);
    setLoading('idle');
    setError(null);
    setHasMore(true);
  }, []);

  // Auto-fetch on mount only
  useEffect(() => {
    if (autoFetch) {
      fetchVideos(initialParams, false);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return {
    videos,
    totalCount,
    currentPage,
    totalPages,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    // Pagination methods
    goToPage,
    nextPage,
    previousPage,
    // Additional utility methods
    updateFilters,
    updateSort,
    clearCache,
    reset,
  };
}
