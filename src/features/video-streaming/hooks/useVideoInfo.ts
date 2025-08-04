/**
 * useVideoInfo Hook
 * 
 * Custom React hook for fetching and managing video metadata and streaming information.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { videoApiService } from '../services/videoApi';
import {
  type VideoInfoResponse,
  type VideoStreamingInfo,
  type VideoError,
  type LoadingState
} from '../types';

export interface UseVideoInfoReturn {
  videoInfo: VideoInfoResponse | null;
  streamingInfo: VideoStreamingInfo | null;
  loading: LoadingState;
  error: VideoError | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  reset: () => void;
}

interface UseVideoInfoOptions {
  autoFetch?: boolean;
  cacheKey?: string;
}

export function useVideoInfo(
  fileId: string | null,
  options: UseVideoInfoOptions = {}
) {
  const { autoFetch = true, cacheKey = 'default' } = options;

  // State
  const [videoInfo, setVideoInfo] = useState<VideoInfoResponse | null>(null);
  const [streamingInfo, setStreamingInfo] = useState<VideoStreamingInfo | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<VideoError | null>(null);

  // Refs for cleanup and caching
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, {
    videoInfo: VideoInfoResponse;
    streamingInfo: VideoStreamingInfo;
    timestamp: number;
  }>>(new Map());

  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, [CACHE_DURATION]);

  /**
   * Fetch video information
   */
  const fetchVideoInfo = useCallback(async (id: string): Promise<void> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading('loading');
      setError(null);

      // Check cache first
      const key = `${cacheKey}_${id}`;
      const cached = cacheRef.current.get(key);
      
      if (cached && isCacheValid(cached.timestamp)) {
        setVideoInfo(cached.videoInfo);
        setStreamingInfo(cached.streamingInfo);
        setLoading('success');
        return;
      }

      // Fetch both video info and streaming info in parallel
      const [videoInfoResponse, streamingInfoResponse] = await Promise.all([
        videoApiService.getVideoInfo(id),
        videoApiService.getStreamingInfo(id)
      ]);

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      // Update cache
      cacheRef.current.set(key, {
        videoInfo: videoInfoResponse,
        streamingInfo: streamingInfoResponse,
        timestamp: Date.now()
      });

      // Update state
      setVideoInfo(videoInfoResponse);
      setStreamingInfo(streamingInfoResponse);
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
  }, [cacheKey, isCacheValid]);

  /**
   * Refetch video information
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!fileId) return;
    await fetchVideoInfo(fileId);
  }, [fileId, fetchVideoInfo]);

  /**
   * Clear cache for current video
   */
  const clearCache = useCallback((): void => {
    if (!fileId) return;
    const key = `${cacheKey}_${fileId}`;
    cacheRef.current.delete(key);
  }, [fileId, cacheKey]);

  /**
   * Reset state
   */
  const reset = useCallback((): void => {
    setVideoInfo(null);
    setStreamingInfo(null);
    setLoading('idle');
    setError(null);
  }, []);

  // Auto-fetch when fileId changes
  useEffect(() => {
    if (fileId && autoFetch) {
      fetchVideoInfo(fileId);
    } else if (!fileId) {
      reset();
    }

    // Cleanup on unmount or fileId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fileId, autoFetch, fetchVideoInfo, reset]);

  // Cleanup cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      for (const [key, value] of cacheRef.current.entries()) {
        if (!isCacheValid(value.timestamp)) {
          cacheRef.current.delete(key);
        }
      }
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [isCacheValid, CACHE_DURATION]);

  return {
    videoInfo,
    streamingInfo,
    loading,
    error,
    refetch,
    clearCache,
    reset,
  };
}
