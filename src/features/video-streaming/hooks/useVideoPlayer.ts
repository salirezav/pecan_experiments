/**
 * useVideoPlayer Hook
 * 
 * Custom React hook for managing video player state and controls.
 * Provides a comprehensive interface for video playback functionality.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// Video player state interface
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseVideoPlayerReturn {
  state: VideoPlayerState;
  actions: {
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleFullscreen: () => void;
    skip: (seconds: number) => void;
    setPlaybackRate: (rate: number) => void;
    reset: () => void;
  };
  ref: React.RefObject<HTMLVideoElement>;
}

interface UseVideoPlayerOptions {
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export function useVideoPlayer(options: UseVideoPlayerOptions = {}) {
  const {
    autoPlay = false,
    loop = false,
    muted = false,
    volume = 1,
    onPlay,
    onPause,
    onEnded,
    onError,
    onTimeUpdate,
    onDurationChange,
  } = options;

  // Video element ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Player state
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: volume,
    isMuted: muted,
    isFullscreen: false,
    isLoading: false,
    error: null,
  });

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<VideoPlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Play video
   */
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      updateState({ isLoading: true, error: null });
      await video.play();
      updateState({ isPlaying: true, isLoading: false });
      onPlay?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play video';
      updateState({ isLoading: false, error: errorMessage });
      onError?.(errorMessage);
    }
  }, [updateState, onPlay, onError]);

  /**
   * Pause video
   */
  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    updateState({ isPlaying: false });
    onPause?.();
  }, [updateState, onPause]);

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  /**
   * Seek to specific time
   */
  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }, []);

  /**
   * Set volume (0-1)
   */
  const setVolume = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    video.volume = clampedVolume;
    updateState({ volume: clampedVolume });
  }, [updateState]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    updateState({ isMuted: video.muted });
  }, [updateState]);

  /**
   * Enter/exit fullscreen
   */
  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!document.fullscreenElement) {
        await video.requestFullscreen();
        updateState({ isFullscreen: true });
      } else {
        await document.exitFullscreen();
        updateState({ isFullscreen: false });
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error);
    }
  }, [updateState]);

  /**
   * Skip forward/backward
   */
  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = video.currentTime + seconds;
    seek(newTime);
  }, [seek]);

  /**
   * Set playback rate
   */
  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = Math.max(0.25, Math.min(4, rate));
  }, []);

  /**
   * Reset video to beginning
   */
  const reset = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    pause();
  }, [pause]);

  // Event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      updateState({ isLoading: true, error: null });
    };

    const handleLoadedData = () => {
      updateState({ isLoading: false });
    };

    const handleTimeUpdate = () => {
      updateState({ currentTime: video.currentTime });
      onTimeUpdate?.(video.currentTime);
    };

    const handleDurationChange = () => {
      updateState({ duration: video.duration });
      onDurationChange?.(video.duration);
    };

    const handlePlay = () => {
      updateState({ isPlaying: true });
    };

    const handlePause = () => {
      updateState({ isPlaying: false });
    };

    const handleEnded = () => {
      updateState({ isPlaying: false });
      onEnded?.();
    };

    const handleError = () => {
      const errorMessage = video.error?.message || 'Video playback error';
      updateState({ isLoading: false, error: errorMessage, isPlaying: false });
      onError?.(errorMessage);
    };

    const handleVolumeChange = () => {
      updateState({ 
        volume: video.volume,
        isMuted: video.muted 
      });
    };

    const handleFullscreenChange = () => {
      updateState({ isFullscreen: !!document.fullscreenElement });
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Set initial properties
    video.autoplay = autoPlay;
    video.loop = loop;
    video.muted = muted;
    video.volume = volume;

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [autoPlay, loop, muted, volume, updateState, onTimeUpdate, onDurationChange, onEnded, onError]);

  return {
    state,
    actions: {
      play,
      pause,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      toggleFullscreen,
      skip,
      setPlaybackRate,
      reset,
    },
    ref: videoRef,
  };
}
