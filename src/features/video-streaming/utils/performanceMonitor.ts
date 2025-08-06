/**
 * Performance Monitor for Video Streaming
 * 
 * Tracks and reports performance metrics for video streaming operations.
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number;

  constructor(maxMetrics: number = 1000) {
    this.maxMetrics = maxMetrics;
  }

  /**
   * Start tracking an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      success: false,
      metadata,
    };

    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return id;
  }

  /**
   * End tracking an operation
   */
  endOperation(operation: string, success: boolean, error?: string): void {
    const metric = this.metrics
      .slice()
      .reverse()
      .find(m => m.operation === operation && !m.endTime);

    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;
    }
  }

  /**
   * Track a complete operation
   */
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startOperation(operation, metadata);
    
    try {
      const result = await fn();
      this.endOperation(operation, true);
      return result;
    } catch (error) {
      this.endOperation(operation, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  getStats(operation?: string): PerformanceStats {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation && m.duration !== undefined)
      : this.metrics.filter(m => m.duration !== undefined);

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
      };
    }

    const durations = filteredMetrics.map(m => m.duration!);
    const successfulOps = filteredMetrics.filter(m => m.success).length;
    const failedOps = filteredMetrics.length - successfulOps;

    return {
      totalOperations: filteredMetrics.length,
      successfulOperations: successfulOps,
      failedOperations: failedOps,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successfulOps / filteredMetrics.length,
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration !== undefined)
      .slice(-count)
      .reverse();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get a performance report
   */
  getReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    let report = 'Video Streaming Performance Report\n';
    report += '=====================================\n\n';

    for (const operation of operations) {
      const stats = this.getStats(operation);
      report += `${operation}:\n`;
      report += `  Total Operations: ${stats.totalOperations}\n`;
      report += `  Success Rate: ${(stats.successRate * 100).toFixed(1)}%\n`;
      report += `  Average Duration: ${stats.averageDuration.toFixed(2)}ms\n`;
      report += `  Min Duration: ${stats.minDuration.toFixed(2)}ms\n`;
      report += `  Max Duration: ${stats.maxDuration.toFixed(2)}ms\n\n`;
    }

    return report;
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for common operations
export const trackVideoLoad = (fileId: string) => 
  performanceMonitor.startOperation('video_load', { fileId });

export const trackThumbnailLoad = (fileId: string, width: number, height: number) =>
  performanceMonitor.startOperation('thumbnail_load', { fileId, width, height });

export const trackApiCall = (endpoint: string) =>
  performanceMonitor.startOperation('api_call', { endpoint });

// Log performance stats periodically in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = performanceMonitor.getStats();
    if (stats.totalOperations > 0) {
      console.log('Video Streaming Performance:', stats);
    }
  }, 60000); // Every minute
}
