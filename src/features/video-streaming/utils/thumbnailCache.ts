/**
 * Thumbnail Cache Utility
 * 
 * Provides efficient caching for video thumbnails to improve performance
 * and reduce API calls.
 */

interface CacheEntry {
  blob: Blob;
  url: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface ThumbnailCacheOptions {
  maxSize: number; // Maximum number of cached thumbnails
  maxAge: number; // Maximum age in milliseconds
  maxMemory: number; // Maximum memory usage in bytes
}

export class ThumbnailCache {
  private cache = new Map<string, CacheEntry>();
  private options: ThumbnailCacheOptions;

  constructor(options: Partial<ThumbnailCacheOptions> = {}) {
    this.options = {
      maxSize: options.maxSize || 100,
      maxAge: options.maxAge || 30 * 60 * 1000, // 30 minutes
      maxMemory: options.maxMemory || 50 * 1024 * 1024, // 50MB
    };
  }

  /**
   * Generate cache key for a thumbnail
   */
  private generateKey(fileId: string, timestamp: number, width: number, height: number): string {
    return `${fileId}_${timestamp}_${width}x${height}`;
  }

  /**
   * Get thumbnail from cache
   */
  get(fileId: string, timestamp: number, width: number, height: number): string | null {
    const key = this.generateKey(fileId, timestamp, width, height);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.options.maxAge) {
      this.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.url;
  }

  /**
   * Store thumbnail in cache
   */
  set(fileId: string, timestamp: number, width: number, height: number, blob: Blob): string {
    const key = this.generateKey(fileId, timestamp, width, height);
    const url = URL.createObjectURL(blob);
    const now = Date.now();

    // Clean up existing entry if it exists
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      URL.revokeObjectURL(existingEntry.url);
    }

    // Create new entry
    const entry: CacheEntry = {
      blob,
      url,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    };

    this.cache.set(key, entry);

    // Cleanup if necessary
    this.cleanup();

    return url;
  }

  /**
   * Delete specific entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all cached thumbnails
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.blob.size, 0);
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);

    return {
      size: this.cache.size,
      totalMemory: totalSize,
      totalAccess,
      averageSize: entries.length > 0 ? totalSize / entries.length : 0,
      averageAccess: entries.length > 0 ? totalAccess / entries.length : 0,
    };
  }

  /**
   * Cleanup expired and least used entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.options.maxAge) {
        this.delete(key);
      }
    }

    // Check if we need to remove more entries
    if (this.cache.size <= this.options.maxSize) {
      const stats = this.getStats();
      if (stats.totalMemory <= this.options.maxMemory) {
        return; // No cleanup needed
      }
    }

    // Sort by access frequency and recency (LRU with access count)
    const sortedEntries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
      // Prioritize by access count, then by last accessed time
      const scoreA = a.accessCount * 1000 + (a.lastAccessed / 1000);
      const scoreB = b.accessCount * 1000 + (b.lastAccessed / 1000);
      return scoreA - scoreB; // Ascending order (least valuable first)
    });

    // Remove least valuable entries until we're under limits
    while (
      (this.cache.size > this.options.maxSize || 
       this.getStats().totalMemory > this.options.maxMemory) &&
      sortedEntries.length > 0
    ) {
      const [key] = sortedEntries.shift()!;
      this.delete(key);
    }
  }

  /**
   * Preload thumbnails for a list of videos
   */
  async preload(
    videos: Array<{ file_id: string }>,
    getThumbnailBlob: (fileId: string, params: any) => Promise<Blob>,
    options: { timestamp?: number; width?: number; height?: number } = {}
  ): Promise<void> {
    const { timestamp = 1.0, width = 320, height = 240 } = options;

    const promises = videos.slice(0, 10).map(async (video) => {
      const key = this.generateKey(video.file_id, timestamp, width, height);
      
      // Skip if already cached
      if (this.cache.has(key)) {
        return;
      }

      try {
        const blob = await getThumbnailBlob(video.file_id, {
          timestamp,
          width,
          height,
        });
        this.set(video.file_id, timestamp, width, height, blob);
      } catch (error) {
        // Silently fail for preloading
        console.warn(`Failed to preload thumbnail for ${video.file_id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Create a singleton instance
export const thumbnailCache = new ThumbnailCache({
  maxSize: 100,
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxMemory: 50 * 1024 * 1024, // 50MB
});

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    thumbnailCache.clear();
  });
}
