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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Camera Preview: {cameraName}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
