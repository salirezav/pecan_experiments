/**
 * Video File Utilities
 * 
 * Utility functions for handling video files, extensions, MIME types, and format validation.
 * Supports both MP4 and AVI formats with backward compatibility.
 */

/**
 * Supported video file extensions
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.webm', '.mov', '.mkv'] as const;

/**
 * Video format to MIME type mapping
 */
export const VIDEO_MIME_TYPES: Record<string, string> = {
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'mkv': 'video/x-matroska',
} as const;

/**
 * Video codec options for each format
 */
export const VIDEO_CODECS: Record<string, string[]> = {
  'mp4': ['mp4v', 'h264', 'h265'],
  'avi': ['XVID', 'MJPG', 'h264'],
  'webm': ['vp8', 'vp9'],
  'mov': ['h264', 'h265', 'prores'],
  'mkv': ['h264', 'h265', 'vp9'],
} as const;

/**
 * Check if a filename has a video file extension
 */
export function isVideoFile(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  const lowerFilename = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lowerFilename.endsWith(ext));
}

/**
 * Extract file extension from filename (without the dot)
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  
  return filename.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * Get video format from filename
 */
export function getVideoFormat(filename: string): string {
  const extension = getFileExtension(filename);
  return extension || 'unknown';
}

/**
 * Get MIME type for a video file based on filename
 */
export function getVideoMimeType(filename: string): string {
  const format = getVideoFormat(filename);
  return VIDEO_MIME_TYPES[format] || 'video/mp4'; // Default to MP4 for new files
}

/**
 * Check if a video format is web-compatible (can be played in browsers)
 */
export function isWebCompatibleFormat(format: string): boolean {
  const webCompatibleFormats = ['mp4', 'webm', 'ogg'];
  return webCompatibleFormats.includes(format.toLowerCase());
}

/**
 * Get display name for video format
 */
export function getFormatDisplayName(format: string): string {
  const formatNames: Record<string, string> = {
    'mp4': 'MP4',
    'avi': 'AVI',
    'webm': 'WebM',
    'mov': 'QuickTime',
    'mkv': 'Matroska',
  };
  
  return formatNames[format.toLowerCase()] || format.toUpperCase();
}

/**
 * Validate video format setting
 */
export function isValidVideoFormat(format: string): boolean {
  const validFormats = ['mp4', 'avi', 'webm', 'mov', 'mkv'];
  return validFormats.includes(format.toLowerCase());
}

/**
 * Validate video codec for a given format
 */
export function isValidCodecForFormat(codec: string, format: string): boolean {
  const validCodecs = VIDEO_CODECS[format.toLowerCase()];
  return validCodecs ? validCodecs.includes(codec) : false;
}

/**
 * Get available codecs for a video format
 */
export function getAvailableCodecs(format: string): string[] {
  return VIDEO_CODECS[format.toLowerCase()] || [];
}

/**
 * Validate video quality setting (0-100)
 */
export function isValidVideoQuality(quality: number): boolean {
  return typeof quality === 'number' && quality >= 0 && quality <= 100;
}

/**
 * Get recommended video settings for different use cases
 */
export function getRecommendedVideoSettings(useCase: 'production' | 'storage-optimized' | 'legacy') {
  const settings = {
    production: {
      video_format: 'mp4',
      video_codec: 'mp4v',
      video_quality: 95,
    },
    'storage-optimized': {
      video_format: 'mp4',
      video_codec: 'mp4v',
      video_quality: 85,
    },
    legacy: {
      video_format: 'avi',
      video_codec: 'XVID',
      video_quality: 95,
    },
  };
  
  return settings[useCase];
}

/**
 * Check if video format change requires camera restart
 */
export function requiresRestart(currentFormat: string, newFormat: string): boolean {
  // Format changes always require restart
  return currentFormat !== newFormat;
}

/**
 * Get format-specific file size estimation factor
 * (relative to AVI baseline)
 */
export function getFileSizeFactor(format: string): number {
  const factors: Record<string, number> = {
    'mp4': 0.6,  // ~40% smaller than AVI
    'avi': 1.0,  // baseline
    'webm': 0.5, // even smaller
    'mov': 0.8,  // slightly smaller
    'mkv': 0.7,  // moderately smaller
  };
  
  return factors[format.toLowerCase()] || 1.0;
}

/**
 * Estimate file size for a video recording
 */
export function estimateFileSize(
  durationSeconds: number,
  format: string,
  quality: number,
  baselineMBPerMinute: number = 30
): number {
  const durationMinutes = durationSeconds / 60;
  const qualityFactor = quality / 100;
  const formatFactor = getFileSizeFactor(format);
  
  return durationMinutes * baselineMBPerMinute * qualityFactor * formatFactor;
}

/**
 * Generate video filename with proper extension
 */
export function generateVideoFilename(
  cameraName: string,
  format: string,
  timestamp?: Date
): string {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
  const extension = format.toLowerCase();
  
  return `${cameraName}_recording_${dateStr}.${extension}`;
}

/**
 * Parse video filename to extract metadata
 */
export function parseVideoFilename(filename: string): {
  cameraName?: string;
  timestamp?: Date;
  format: string;
  isValid: boolean;
} {
  const format = getVideoFormat(filename);
  
  // Try to match pattern: cameraName_recording_YYYYMMDD_HHMMSS.ext
  const match = filename.match(/^([^_]+)_recording_(\d{8})_(\d{6})\./);
  
  if (match) {
    const [, cameraName, dateStr, timeStr] = match;
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.slice(6, 8));
    const hour = parseInt(timeStr.slice(0, 2));
    const minute = parseInt(timeStr.slice(2, 4));
    const second = parseInt(timeStr.slice(4, 6));
    
    const timestamp = new Date(year, month, day, hour, minute, second);
    
    return {
      cameraName,
      timestamp,
      format,
      isValid: true,
    };
  }
  
  return {
    format,
    isValid: false,
  };
}

/**
 * Video format configuration validation
 */
export interface VideoFormatValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate complete video format configuration
 */
export function validateVideoFormatConfig(config: {
  video_format?: string;
  video_codec?: string;
  video_quality?: number;
}): VideoFormatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate format
  if (config.video_format && !isValidVideoFormat(config.video_format)) {
    errors.push(`Invalid video format: ${config.video_format}`);
  }
  
  // Validate codec
  if (config.video_format && config.video_codec) {
    if (!isValidCodecForFormat(config.video_codec, config.video_format)) {
      errors.push(`Codec ${config.video_codec} is not valid for format ${config.video_format}`);
    }
  }
  
  // Validate quality
  if (config.video_quality !== undefined && !isValidVideoQuality(config.video_quality)) {
    errors.push(`Video quality must be between 0 and 100, got: ${config.video_quality}`);
  }
  
  // Add warnings
  if (config.video_format === 'avi') {
    warnings.push('AVI format has limited web compatibility. Consider using MP4 for better browser support.');
  }
  
  if (config.video_quality && config.video_quality < 70) {
    warnings.push('Low video quality may affect analysis accuracy.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
