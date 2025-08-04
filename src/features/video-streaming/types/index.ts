/**
 * Video Streaming Feature Types
 *
 * This file contains all TypeScript type definitions for the video streaming feature.
 * Following the modular architecture pattern where types are centralized and reusable.
 * Updated to fix import issues.
 */

// Base video information from the API
export interface VideoFile {
  file_id: string;
  camera_name: string;
  filename: string;
  file_size_bytes: number;
  format: string;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  is_streamable: boolean;
  needs_conversion: boolean;
}

// Extended video information with metadata
export interface VideoWithMetadata extends VideoFile {
  metadata?: {
    duration_seconds: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    aspect_ratio: number;
  };
}

// API response for video list
export interface VideoListResponse {
  videos: VideoFile[];
  total_count: number;
}

// API response for video info
export interface VideoInfoResponse {
  file_id: string;
  metadata: {
    duration_seconds: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    aspect_ratio: number;
  };
}

// Streaming technical information
export interface VideoStreamingInfo {
  file_id: string;
  file_size_bytes: number;
  content_type: string;
  supports_range_requests: boolean;
  chunk_size_bytes: number;
}

// Query parameters for video list API
export interface VideoListParams {
  camera_name?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  include_metadata?: boolean;
}

// Thumbnail request parameters
export interface ThumbnailParams {
  timestamp?: number;
  width?: number;
  height?: number;
}

// Video player state is now defined in useVideoPlayer hook to avoid circular imports

// Video list filter and sort options
export interface VideoListFilters {
  cameraName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: VideoFile['status'];
  format?: string;
}

export interface VideoListSortOptions {
  field: 'created_at' | 'file_size_bytes' | 'camera_name' | 'filename';
  direction: 'asc' | 'desc';
}

// Component props interfaces
export interface VideoPlayerProps {
  fileId: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export interface VideoCardProps {
  video: VideoFile;
  onClick?: (video: VideoFile) => void;
  showMetadata?: boolean;
  className?: string;
}

export interface VideoListProps {
  filters?: VideoListFilters;
  sortOptions?: VideoListSortOptions;
  limit?: number;
  onVideoSelect?: (video: VideoFile) => void;
  className?: string;
}

export interface VideoThumbnailProps {
  fileId: string;
  timestamp?: number;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

// Error types
export interface VideoError {
  code: string;
  message: string;
  details?: any;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Hook return types are exported from their respective hook files
// This avoids circular import issues
