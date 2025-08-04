/**
 * Video Streaming Hooks - Index
 *
 * Centralized export for all video streaming hooks.
 * This makes it easy to import hooks from a single location.
 */

export { useVideoList, type UseVideoListReturn } from './useVideoList';
export { useVideoPlayer, type UseVideoPlayerReturn, type VideoPlayerState } from './useVideoPlayer';
export { useVideoInfo, type UseVideoInfoReturn } from './useVideoInfo';

// Re-export types that are commonly used with hooks
export type {
  VideoListFilters,
  VideoListSortOptions,
} from '../types';
