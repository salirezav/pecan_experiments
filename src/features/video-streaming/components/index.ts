/**
 * Video Streaming Components - Index
 *
 * Centralized export for all video streaming components.
 * This makes it easy to import components from a single location.
 */

export { VideoPlayer } from './VideoPlayer';
export { VideoThumbnail } from './VideoThumbnail';
export { VideoCard } from './VideoCard';
export { VideoList } from './VideoList';
export { VideoModal } from './VideoModal';
export { Pagination, PageInfo } from './Pagination';

// Re-export component prop types for convenience
export type {
  VideoPlayerProps,
  VideoThumbnailProps,
  VideoCardProps,
  VideoListProps,
  PaginationProps,
} from '../types';
