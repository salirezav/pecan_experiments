/**
 * Video Streaming API Service
 * 
 * This service handles all API interactions for the video streaming feature.
 * It provides a clean interface for components to interact with the video API
 * without knowing the implementation details.
 */

import {
  type VideoListResponse,
  type VideoInfoResponse,
  type VideoStreamingInfo,
  type VideoListParams,
  type ThumbnailParams,
} from '../types';
import { performanceMonitor } from '../utils/performanceMonitor';

// Configuration - Use environment variable or default to vision container
// The API is accessible at vision:8000 in the current setup
const API_BASE_URL = import.meta.env.VITE_VISION_API_URL || 'http://vision:8000';

/**
 * Custom error class for video API errors
 */
export class VideoApiError extends Error {
  public code: string;
  public details?: unknown;

  constructor(
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'VideoApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Helper function to handle API responses
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new VideoApiError(
      `HTTP_${response.status}`,
      `API request failed: ${response.statusText}`,
      { status: response.status, body: errorText }
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  throw new VideoApiError(
    'INVALID_RESPONSE',
    'Expected JSON response from API'
  );
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: VideoListParams | ThumbnailParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Video API Service Class
 */
export class VideoApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get total count of videos with filters (without pagination)
   */
  private totalCountCache = new Map<string, { count: number; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  private async getTotalCount(params: Omit<VideoListParams, 'limit' | 'offset' | 'page'>): Promise<number> {
    // Create cache key from params
    const cacheKey = JSON.stringify(params);
    const cached = this.totalCountCache.get(cacheKey);

    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.count;
    }

    const queryString = buildQueryString({ ...params, limit: 1000 }); // Use high limit to get accurate total
    const url = `${this.baseUrl}/videos/${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await handleApiResponse<VideoListResponse>(response);
    const count = result.videos.length; // Since backend returns wrong total_count, count the actual videos

    // Cache the result
    this.totalCountCache.set(cacheKey, { count, timestamp: Date.now() });

    return count;
  }

  /**
   * Get list of videos with optional filtering
   */
  async getVideos(params: VideoListParams = {}): Promise<VideoListResponse> {
    return performanceMonitor.trackOperation('get_videos', async () => {
      // Convert page-based params to offset-based for API compatibility
      const apiParams = { ...params };

      // If page is provided, convert to offset
      if (params.page && params.limit) {
        apiParams.offset = (params.page - 1) * params.limit;
        delete apiParams.page; // Remove page param as API expects offset
      }

      const queryString = buildQueryString(apiParams);
      const url = `${this.baseUrl}/videos/${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await handleApiResponse<VideoListResponse>(response);

      // Add pagination metadata if page was requested
      if (params.page && params.limit) {
        // Get accurate total count by calling without pagination
        const totalCount = await this.getTotalCount({
          camera_name: params.camera_name,
          start_date: params.start_date,
          end_date: params.end_date,
          include_metadata: params.include_metadata,
        });

        const totalPages = Math.ceil(totalCount / params.limit);
        return {
          ...result,
          total_count: totalCount, // Use accurate total count
          page: params.page,
          total_pages: totalPages,
          has_next: params.page < totalPages,
          has_previous: params.page > 1,
        };
      }

      return result;
    }, { params });
  }

  /**
   * Get detailed information about a specific video
   */
  async getVideoInfo(fileId: string): Promise<VideoInfoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${fileId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      return await handleApiResponse<VideoInfoResponse>(response);
    } catch (error) {
      if (error instanceof VideoApiError) {
        throw error;
      }
      throw new VideoApiError(
        'NETWORK_ERROR',
        `Failed to fetch video info for ${fileId}`,
        { originalError: error, fileId }
      );
    }
  }

  /**
   * Get streaming information for a video
   */
  async getStreamingInfo(fileId: string): Promise<VideoStreamingInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${fileId}/info`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      return await handleApiResponse<VideoStreamingInfo>(response);
    } catch (error) {
      if (error instanceof VideoApiError) {
        throw error;
      }
      throw new VideoApiError(
        'NETWORK_ERROR',
        `Failed to fetch streaming info for ${fileId}`,
        { originalError: error, fileId }
      );
    }
  }

  /**
   * Get the streaming URL for a video
   */
  getStreamingUrl(fileId: string): string {
    return `${this.baseUrl}/videos/${fileId}/stream`;
  }

  /**
   * Get the thumbnail URL for a video
   */
  getThumbnailUrl(fileId: string, params: ThumbnailParams = {}): string {
    const queryString = buildQueryString(params);
    return `${this.baseUrl}/videos/${fileId}/thumbnail${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Download thumbnail as blob
   */
  async getThumbnailBlob(fileId: string, params: ThumbnailParams = {}): Promise<Blob> {
    return performanceMonitor.trackOperation('get_thumbnail', async () => {
      const url = this.getThumbnailUrl(fileId, params);
      const response = await fetch(url);

      if (!response.ok) {
        throw new VideoApiError(
          `HTTP_${response.status}`,
          `Failed to fetch thumbnail: ${response.statusText}`,
          { status: response.status, fileId }
        );
      }

      return await response.blob();
    }, { fileId, params });
  }

  /**
   * Check if the video API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export a default instance
export const videoApiService = new VideoApiService();

// Export utility functions
export { buildQueryString, handleApiResponse };
