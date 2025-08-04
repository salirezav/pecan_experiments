/**
 * Video Streaming Utilities
 * 
 * Pure utility functions for video operations, formatting, and data processing.
 * These functions have no side effects and can be easily tested.
 */

import { type VideoFile, type VideoWithMetadata } from '../types';

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to human readable format (HH:MM:SS or MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date string to human readable format
 */
export function formatVideoDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return formatVideoDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Extract camera name from filename if not provided
 */
export function extractCameraName(filename: string): string {
  // Try to extract camera name from filename pattern like "camera1_recording_20250804_143022.avi"
  const match = filename.match(/^([^_]+)_/);
  return match ? match[1] : 'Unknown';
}

/**
 * Get video format display name
 */
export function getFormatDisplayName(format: string): string {
  const formatMap: Record<string, string> = {
    'avi': 'AVI',
    'mp4': 'MP4',
    'webm': 'WebM',
    'mov': 'MOV',
    'mkv': 'MKV',
  };
  
  return formatMap[format.toLowerCase()] || format.toUpperCase();
}

/**
 * Check if video format is web-compatible
 */
export function isWebCompatible(format: string): boolean {
  const webFormats = ['mp4', 'webm', 'ogg'];
  return webFormats.includes(format.toLowerCase());
}

/**
 * Get status badge color class
 */
export function getStatusBadgeClass(status: VideoFile['status']): string {
  const statusClasses = {
    'completed': 'bg-green-100 text-green-800',
    'processing': 'bg-yellow-100 text-yellow-800',
    'failed': 'bg-red-100 text-red-800',
  };
  
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get video resolution display string
 */
export function getResolutionString(width?: number, height?: number): string {
  if (!width || !height) return 'Unknown';
  
  // Common resolution names
  const resolutions: Record<string, string> = {
    '1920x1080': '1080p',
    '1280x720': '720p',
    '854x480': '480p',
    '640x360': '360p',
    '426x240': '240p',
  };
  
  const key = `${width}x${height}`;
  return resolutions[key] || `${width}×${height}`;
}

/**
 * Calculate aspect ratio string
 */
export function getAspectRatioString(aspectRatio: number): string {
  if (!aspectRatio || aspectRatio <= 0) return 'Unknown';
  
  // Common aspect ratios
  const ratios: Array<[number, string]> = [
    [16/9, '16:9'],
    [4/3, '4:3'],
    [21/9, '21:9'],
    [1, '1:1'],
  ];
  
  // Find closest match (within 0.1 tolerance)
  for (const [ratio, display] of ratios) {
    if (Math.abs(aspectRatio - ratio) < 0.1) {
      return display;
    }
  }
  
  // Return calculated ratio
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const width = Math.round(aspectRatio * 100);
  const height = 100;
  const divisor = gcd(width, height);
  
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Sort videos by different criteria
 */
export function sortVideos(
  videos: VideoFile[],
  field: 'created_at' | 'file_size_bytes' | 'camera_name' | 'filename',
  direction: 'asc' | 'desc' = 'desc'
): VideoFile[] {
  return [...videos].sort((a, b) => {
    let aValue: any = a[field];
    let bValue: any = b[field];
    
    // Handle date strings
    if (field === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    let result = 0;
    if (aValue < bValue) result = -1;
    else if (aValue > bValue) result = 1;
    
    return direction === 'desc' ? -result : result;
  });
}

/**
 * Filter videos by criteria
 */
export function filterVideos(
  videos: VideoFile[],
  filters: {
    cameraName?: string;
    status?: VideoFile['status'];
    format?: string;
    dateRange?: { start: string; end: string };
  }
): VideoFile[] {
  return videos.filter(video => {
    // Filter by camera name
    if (filters.cameraName && video.camera_name !== filters.cameraName) {
      return false;
    }
    
    // Filter by status
    if (filters.status && video.status !== filters.status) {
      return false;
    }
    
    // Filter by format
    if (filters.format && video.format !== filters.format) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange) {
      const videoDate = new Date(video.created_at);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (videoDate < startDate || videoDate > endDate) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Generate a unique key for video caching
 */
export function generateVideoKey(fileId: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return fileId;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
    
  return `${fileId}?${sortedParams}`;
}

/**
 * Validate video file ID format
 */
export function isValidFileId(fileId: string): boolean {
  // Basic validation - adjust based on your file ID format
  return typeof fileId === 'string' && fileId.length > 0 && !fileId.includes('/');
}

/**
 * Get video thumbnail timestamp suggestions
 */
export function getThumbnailTimestamps(duration: number): number[] {
  if (duration <= 0) return [0];
  
  // Generate timestamps at 10%, 25%, 50%, 75%, 90% of video duration
  return [
    Math.floor(duration * 0.1),
    Math.floor(duration * 0.25),
    Math.floor(duration * 0.5),
    Math.floor(duration * 0.75),
    Math.floor(duration * 0.9),
  ].filter(t => t >= 0 && t < duration);
}
