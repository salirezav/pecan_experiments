import { memo, useState, useEffect } from 'react'
import { visionApi, type AutoRecordingStatusResponse } from '../lib/visionApi'
import { useAuth } from '../hooks/useAuth'

const AutoRecordingStatus = memo(() => {
  const { isAdmin } = useAuth()
  const isAdminUser = isAdmin()
  const [status, setStatus] = useState<AutoRecordingStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch auto-recording status
  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const statusData = await visionApi.getAutoRecordingStatus()
      setStatus(statusData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch auto-recording status'
      setError(errorMessage)
      console.error('Failed to fetch auto-recording status:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch status on mount and set up polling
  useEffect(() => {
    if (!isAdminUser) {
      return
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [isAdminUser])

  // Only show to admins
  if (!isAdminUser) {
    return null
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Auto-Recording System</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Server-side automatic recording based on machine state changes
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.running ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {status?.running ? 'Running' : 'Stopped'}
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {status && (
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">System Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">System Running:</span>
                  <span className={`font-medium ${status.running ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {status.running ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto-Recording Enabled:</span>
                  <span className={`font-medium ${status.auto_recording_enabled ? 'text-green-600' : 'text-gray-600'
                    }`}>
                    {status.auto_recording_enabled ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Enabled Cameras:</span>
                  <span className="font-medium text-gray-900">
                    {status.enabled_cameras.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Retry Queue:</span>
                  <span className="font-medium text-gray-900">
                    {Object.keys(status.retry_queue).length} items
                  </span>
                </div>
              </div>
            </div>

            {status.enabled_cameras.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Enabled Cameras:</h5>
                <div className="flex flex-wrap gap-2">
                  {status.enabled_cameras.map((camera) => (
                    <span
                      key={camera}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {camera}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(status.retry_queue).length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Retry Queue:</h5>
                <div className="space-y-1">
                  {Object.entries(status.retry_queue).map(([camera, retryInfo]) => (
                    <div key={camera} className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                      <strong>{camera}:</strong> {JSON.stringify(retryInfo)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!status && !loading && !error && (
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="text-center text-gray-500">
            <p>Auto-recording status not available</p>
            <p className="text-sm mt-1">Click "Refresh" to fetch the current status</p>
          </div>
        </div>
      )}
    </div>
  )
})

AutoRecordingStatus.displayName = 'AutoRecordingStatus'

export { AutoRecordingStatus }
