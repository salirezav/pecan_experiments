import { useState, useEffect, useRef } from 'react'
import { visionApi } from '../lib/visionApi'

interface CameraPreviewModalProps {
  cameraName: string
  isOpen: boolean
  onClose: () => void
  onError?: (error: string) => void
}

export function CameraPreviewModal({ cameraName, isOpen, onClose, onError }: CameraPreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const streamUrlRef = useRef<string | null>(null)

  // Start streaming when modal opens
  useEffect(() => {
    if (isOpen && cameraName) {
      startStreaming()
    }
  }, [isOpen, cameraName])

  // Stop streaming when modal closes
  useEffect(() => {
    if (!isOpen && streaming) {
      stopStreaming()
    }
  }, [isOpen, streaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streaming) {
        stopStreaming()
      }
    }
  }, [streaming])

  const startStreaming = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await visionApi.startStream(cameraName)

      if (result.success) {
        setStreaming(true)
        const streamUrl = visionApi.getStreamUrl(cameraName)
        streamUrlRef.current = streamUrl

        // Add timestamp to prevent caching
        if (imgRef.current) {
          imgRef.current.src = `${streamUrl}?t=${Date.now()}`
        }
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start stream'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const stopStreaming = async () => {
    try {
      if (streaming) {
        await visionApi.stopStream(cameraName)
        setStreaming(false)
        streamUrlRef.current = null

        // Clear the image source
        if (imgRef.current) {
          imgRef.current.src = ''
        }
      }
    } catch (err) {
      console.error('Error stopping stream:', err)
      // Don't show error to user for stop stream failures
    }
  }

  const handleClose = () => {
    stopStreaming()
    onClose()
  }

  const handleImageError = () => {
    setError('Failed to load camera stream')
  }

  const handleImageLoad = () => {
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-999999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        onClick={handleClose}
      />
      <div className="relative w-11/12 max-w-4xl rounded-2xl bg-white shadow-theme-xl dark:bg-gray-900 p-5" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white/90">
              Camera Preview: {cameraName}
            </h3>
          </div>

          {/* Content */}
          <div className="mb-4">
            {loading && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Starting camera stream...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Stream Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={startStreaming}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {streaming && !loading && !error && (
              <div className="bg-black rounded-lg overflow-hidden">
                <img
                  ref={imgRef}
                  alt={`Live stream from ${cameraName}`}
                  className="w-full h-auto max-h-96 object-contain"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {streaming && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">Live Stream Active</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
