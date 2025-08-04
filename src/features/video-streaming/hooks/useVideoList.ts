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
  loading: LoadingState;
  error: VideoError | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
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
      setHasMore(response.videos.length === (params.limit || 50));
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
   * Refetch videos with initial parameters
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchVideos(initialParams, false);
  }, [fetchVideos, initialParams]);

  /**
   * Load more videos (pagination)
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
   * Update filters and refetch
   */
  const updateFilters = useCallback((filters: VideoListFilters): void => {
    const newParams: VideoListParams = {
      ...initialParams,
      camera_name: filters.cameraName,
      start_date: filters.dateRange?.start,
      end_date: filters.dateRange?.end,
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
   * Reset to initial state
   */
  const reset = useCallback((): void => {
    setVideos([]);
    setTotalCount(0);
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
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    // Additional utility methods
    updateFilters,
    updateSort,
    reset,
  };
}
