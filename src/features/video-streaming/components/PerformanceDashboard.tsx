/**
 * PerformanceDashboard Component
 * 
 * A development tool for monitoring video streaming performance.
 * Only shown in development mode.
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, thumbnailCache } from '../utils';

interface PerformanceDashboardProps {
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const updateStats = () => {
        setStats({
          overall: performanceMonitor.getStats(),
          getVideos: performanceMonitor.getStats('get_videos'),
          getThumbnail: performanceMonitor.getStats('get_thumbnail'),
          recentMetrics: performanceMonitor.getRecentMetrics(5),
        });
        setCacheStats(thumbnailCache.getStats());
      };

      updateStats();
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 ${className}`}
        title="Open Performance Dashboard"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md w-80 max-h-96 overflow-y-auto z-50 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {stats && (
        <div className="space-y-4">
          {/* Overall Stats */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Overall</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Operations: {stats.overall.totalOperations}</div>
              <div>Success: {(stats.overall.successRate * 100).toFixed(1)}%</div>
              <div>Avg: {stats.overall.averageDuration.toFixed(0)}ms</div>
              <div>Max: {stats.overall.maxDuration.toFixed(0)}ms</div>
            </div>
          </div>

          {/* Video Loading Stats */}
          {stats.getVideos.totalOperations > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Video Loading</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Calls: {stats.getVideos.totalOperations}</div>
                <div>Success: {(stats.getVideos.successRate * 100).toFixed(1)}%</div>
                <div>Avg: {stats.getVideos.averageDuration.toFixed(0)}ms</div>
                <div>Max: {stats.getVideos.maxDuration.toFixed(0)}ms</div>
              </div>
            </div>
          )}

          {/* Thumbnail Stats */}
          {stats.getThumbnail.totalOperations > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Thumbnails</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Calls: {stats.getThumbnail.totalOperations}</div>
                <div>Success: {(stats.getThumbnail.successRate * 100).toFixed(1)}%</div>
                <div>Avg: {stats.getThumbnail.averageDuration.toFixed(0)}ms</div>
                <div>Max: {stats.getThumbnail.maxDuration.toFixed(0)}ms</div>
              </div>
            </div>
          )}

          {/* Cache Stats */}
          {cacheStats && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cache</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Cached: {cacheStats.size}</div>
                <div>Memory: {(cacheStats.totalMemory / 1024 / 1024).toFixed(1)}MB</div>
                <div>Hits: {cacheStats.totalAccess}</div>
                <div>Avg Size: {(cacheStats.averageSize / 1024).toFixed(0)}KB</div>
              </div>
            </div>
          )}

          {/* Recent Operations */}
          {stats.recentMetrics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent</h4>
              <div className="space-y-1">
                {stats.recentMetrics.map((metric: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className={metric.success ? 'text-green-600' : 'text-red-600'}>
                      {metric.operation}
                    </span>
                    <span>{metric.duration?.toFixed(0)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                performanceMonitor.clear();
                thumbnailCache.clear();
              }}
              className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                console.log(performanceMonitor.getReport());
                console.log('Cache Stats:', thumbnailCache.getStats());
              }}
              className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Log Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
