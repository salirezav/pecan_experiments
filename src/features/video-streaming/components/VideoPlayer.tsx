/**
 * VideoPlayer Component
 * 
 * A reusable video player component with full controls and customization options.
 * Uses the useVideoPlayer hook for state management and provides a clean interface.
 */

import React, { forwardRef, useState, useEffect } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { videoApiService } from '../services/videoApi';
import { type VideoPlayerProps } from '../types';
import { formatDuration, getVideoMimeType } from '../utils/videoUtils';

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  fileId,
  autoPlay = false,
  controls = true,
  width = '100%',
  height = 'auto',
  className = '',
  onPlay,
  onPause,
  onEnded,
  onError,
}, forwardedRef) => {
  const [videoInfo, setVideoInfo] = useState<{ filename?: string; mimeType: string }>({
    mimeType: 'video/mp4' // Default to MP4
  });

  const { state, actions, ref } = useVideoPlayer({
    autoPlay,
    onPlay,
    onPause,
    onEnded,
    onError,
  });

  // Combine refs
  React.useImperativeHandle(forwardedRef, () => ref.current!, [ref]);

  const streamingUrl = videoApiService.getStreamingUrl(fileId);

  // Fetch video info to determine MIME type
  useEffect(() => {
    const fetchVideoInfo = async () => {
      try {
        const info = await videoApiService.getVideoInfo(fileId);
        if (info.file_id) {
          // Extract filename from file_id or use a default pattern
          const filename = info.file_id.includes('.') ? info.file_id : `${info.file_id}.mp4`;
          const mimeType = getVideoMimeType(filename);
          setVideoInfo({ filename, mimeType });
        }
      } catch (error) {
        console.warn('Could not fetch video info, using default MIME type:', error);
        // Keep default MP4 MIME type
      }
    };

    fetchVideoInfo();
  }, [fileId]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;

    actions.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setVolume(parseFloat(e.target.value));
  };

  return (
    <div className={`video-player relative ${className}`} style={{ width, height }}>
      {/* Video Element */}
      <video
        ref={ref}
        className="w-full h-full bg-black"
        controls={!controls} // Use native controls if custom controls are disabled
        style={{ width, height }}
        playsInline // Important for iOS compatibility
      >
        <source src={streamingUrl} type={videoInfo.mimeType} />
        {/* Fallback for MP4 if original format fails */}
        {videoInfo.mimeType !== 'video/mp4' && (
          <source src={streamingUrl} type="video/mp4" />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}

      {/* Error Overlay */}
      {state.error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-red-400 text-center">
            <div className="text-lg mb-2">Playback Error</div>
            <div className="text-sm">{state.error}</div>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <div
              className="w-full h-2 bg-gray-600 rounded cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-blue-500 rounded"
                style={{
                  width: `${state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0}%`
                }}
              />
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between text-white">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              {/* Play/Pause Button */}
              <button
                onClick={actions.togglePlay}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                disabled={state.isLoading}
              >
                {state.isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => actions.skip(-10)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                title="Skip backward 10s"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 9H17a1 1 0 110 2h-5.586l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => actions.skip(10)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                title="Skip forward 10s"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 11H3a1 1 0 110-2h5.586L4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Time Display */}
              <div className="text-sm">
                {formatDuration(state.currentTime)} / {formatDuration(state.duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={actions.toggleMute}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  {state.isMuted || state.volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776L4.83 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.83l3.553-3.776a1 1 0 011.617.776zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.776L4.83 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.83l3.553-3.776a1 1 0 011.617.776zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={actions.toggleFullscreen}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
              >
                {state.isFullscreen ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
