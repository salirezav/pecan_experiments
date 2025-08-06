/**
 * VideoDebugger Component
 * 
 * A development tool for debugging video streaming issues.
 * Provides direct access to test video URLs and diagnose problems.
 */

import React, { useState } from 'react';
import { videoApiService } from '../services/videoApi';

interface VideoDebuggerProps {
  fileId: string;
  className?: string;
}

export const VideoDebugger: React.FC<VideoDebuggerProps> = ({
  fileId,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const streamingUrl = videoApiService.getStreamingUrl(fileId);
  const thumbnailUrl = videoApiService.getThumbnailUrl(fileId);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      fileId,
      streamingUrl,
      thumbnailUrl,
      tests: {}
    };

    try {
      // Test 1: Video Info
      try {
        const videoInfo = await videoApiService.getVideoInfo(fileId);
        results.tests.videoInfo = { success: true, data: videoInfo };
      } catch (error) {
        results.tests.videoInfo = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 2: Streaming Info
      try {
        const streamingInfo = await videoApiService.getStreamingInfo(fileId);
        results.tests.streamingInfo = { success: true, data: streamingInfo };
      } catch (error) {
        results.tests.streamingInfo = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 3: HEAD request to streaming URL
      try {
        const response = await fetch(streamingUrl, { method: 'HEAD' });
        results.tests.streamingHead = {
          success: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        results.tests.streamingHead = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 4: Range request test
      try {
        const response = await fetch(streamingUrl, {
          headers: { 'Range': 'bytes=0-1023' }
        });
        results.tests.rangeRequest = {
          success: response.ok,
          status: response.status,
          supportsRanges: response.headers.get('accept-ranges') === 'bytes',
          contentRange: response.headers.get('content-range')
        };
      } catch (error) {
        results.tests.rangeRequest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 5: Thumbnail test
      try {
        const response = await fetch(thumbnailUrl, { method: 'HEAD' });
        results.tests.thumbnail = {
          success: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type')
        };
      } catch (error) {
        results.tests.thumbnail = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setTestResults(results);
    setIsLoading(false);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors ${className}`}
        title="Open Video Debugger"
      >
        🔧 Debug
      </button>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-2xl ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Video Debugger</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Basic Info</h4>
          <div className="text-sm space-y-1">
            <div><strong>File ID:</strong> {fileId}</div>
            <div><strong>Streaming URL:</strong> <a href={streamingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{streamingUrl}</a></div>
            <div><strong>Thumbnail URL:</strong> <a href={thumbnailUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{thumbnailUrl}</a></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
          <div className="flex space-x-2">
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Run Diagnostics'}
            </button>
            <button
              onClick={() => window.open(streamingUrl, '_blank')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Open Video
            </button>
            <button
              onClick={() => window.open(thumbnailUrl, '_blank')}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Open Thumbnail
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Diagnostic Results</h4>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono max-h-64 overflow-y-auto">
              <pre>{JSON.stringify(testResults, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Native Video Test */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Native Video Test</h4>
          <video
            controls
            width="100%"
            height="200"
            className="border rounded"
            onLoadStart={() => console.log('Native video load started')}
            onLoadedData={() => console.log('Native video data loaded')}
            onError={(e) => console.error('Native video error:', e)}
          >
            <source src={streamingUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};
