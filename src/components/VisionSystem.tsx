import { useState, useEffect, useRef, useCallback } from 'react'
import {
  visionApi,
  type SystemStatus,
  type CameraStatus,
  type MachineStatus,
  type StorageStats,
  type RecordingInfo,
  type MqttStatus,
  type MqttEventsResponse,
  type MqttEvent,
  formatBytes,
  formatDuration,
  formatUptime
} from '../lib/visionApi'

export function VisionSystem() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [recordings, setRecordings] = useState<Record<string, RecordingInfo>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds default
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [mqttStatus, setMqttStatus] = useState<MqttStatus | null>(null)
  const [mqttEvents, setMqttEvents] = useState<MqttEvent[]>([])

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startAutoRefresh = useCallback(() => {
    clearAutoRefresh()
    if (autoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval)
    }
  }, [autoRefreshEnabled, refreshInterval])

  useEffect(() => {
    fetchData()
    startAutoRefresh()
    return clearAutoRefresh
  }, [startAutoRefresh])

  useEffect(() => {
    startAutoRefresh()
  }, [autoRefreshEnabled, refreshInterval, startAutoRefresh])

  const fetchData = useCallback(async (showRefreshIndicator = true) => {
    try {
      setError(null)
      if (!systemStatus) {
        setLoading(true)
      } else if (showRefreshIndicator) {
        setRefreshing(true)
      }

      const [statusData, storageData, recordingsData, mqttStatusData, mqttEventsData] = await Promise.all([
        visionApi.getSystemStatus(),
        visionApi.getStorageStats(),
        visionApi.getRecordings(),
        visionApi.getMqttStatus().catch(err => {
          console.warn('Failed to fetch MQTT status:', err)
          return null
        }),
        visionApi.getMqttEvents(10).catch(err => {
          console.warn('Failed to fetch MQTT events:', err)
          return { events: [], total_events: 0, last_updated: '' }
        })
      ])

      // If cameras don't have device_info, try to fetch individual camera status
      if (statusData.cameras) {
        const camerasNeedingInfo = Object.entries(statusData.cameras)
          .filter(([_, camera]) => !camera.device_info?.friendly_name)
          .map(([cameraName, _]) => cameraName)

        if (camerasNeedingInfo.length > 0) {
          console.log('Fetching individual camera info for:', camerasNeedingInfo)
          try {
            const individualCameraData = await Promise.all(
              camerasNeedingInfo.map(cameraName =>
                visionApi.getCameraStatus(cameraName).catch(err => {
                  console.warn(`Failed to get individual status for ${cameraName}:`, err)
                  return null
                })
              )
            )

            // Merge the individual camera data back into statusData
            camerasNeedingInfo.forEach((cameraName, index) => {
              const individualData = individualCameraData[index]
              if (individualData && individualData.device_info) {
                statusData.cameras[cameraName] = {
                  ...statusData.cameras[cameraName],
                  device_info: individualData.device_info
                }
              }
            })
          } catch (err) {
            console.warn('Failed to fetch individual camera data:', err)
          }
        }
      }

      // Only update state if data has actually changed to prevent unnecessary re-renders
      setSystemStatus(prevStatus => {
        if (JSON.stringify(prevStatus) !== JSON.stringify(statusData)) {
          return statusData
        }
        return prevStatus
      })

      setStorageStats(prevStats => {
        if (JSON.stringify(prevStats) !== JSON.stringify(storageData)) {
          return storageData
        }
        return prevStats
      })

      setRecordings(prevRecordings => {
        if (JSON.stringify(prevRecordings) !== JSON.stringify(recordingsData)) {
          return recordingsData
        }
        return prevRecordings
      })

      setLastUpdateTime(new Date())

      // Update MQTT status and events
      if (mqttStatusData) {
        setMqttStatus(mqttStatusData)
      }

      if (mqttEventsData && mqttEventsData.events) {
        setMqttEvents(mqttEventsData.events)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vision system data')
      console.error('Vision system fetch error:', err)
      // Don't disable auto-refresh on errors, just log them
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [systemStatus])

  const getStatusColor = (status: string, isRecording: boolean = false) => {
    // If camera is recording, always show red regardless of status
    if (isRecording) {
      return 'text-red-600 bg-red-100'
    }

    switch (status.toLowerCase()) {
      case 'available':
      case 'connected':
      case 'healthy':
      case 'on':
        return 'text-green-600 bg-green-100'
      case 'disconnected':
      case 'off':
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'error':
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getMachineStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'on':
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'off':
      case 'stopped':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vision system data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading vision system</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
                >
                  {refreshing ? 'Retrying...' : 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vision System</h1>
          <p className="mt-2 text-gray-600">Monitor cameras, machines, and recording status</p>
          {lastUpdateTime && (
            <p className="mt-1 text-sm text-gray-500 flex items-center space-x-2">
              <span>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>
              {autoRefreshEnabled && !refreshing && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Auto-refresh: {refreshInterval / 1000}s
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Auto-refresh controls */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-refresh</span>
            </label>
            {autoRefreshEnabled && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
              </select>
            )}
          </div>

          {/* Refresh indicator and button */}
          <div className="flex items-center space-x-2">
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${systemStatus.system_started ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {systemStatus.system_started ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-gray-900">System Status</div>
                <div className="mt-1 text-sm text-gray-500">
                  Uptime: {formatUptime(systemStatus.uptime_seconds)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${systemStatus.mqtt_connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {systemStatus.mqtt_connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                  {systemStatus.mqtt_connected && (
                    <div className="ml-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">Live</span>
                    </div>
                  )}
                </div>
                {mqttStatus && (
                  <div className="text-right text-xs text-gray-500">
                    <div>{mqttStatus.message_count} messages</div>
                    <div>{mqttStatus.error_count} errors</div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-gray-900">MQTT</div>
                <div className="mt-1 text-sm text-gray-500">
                  {mqttStatus ? (
                    <div>
                      <div>Broker: {mqttStatus.broker_host}:{mqttStatus.broker_port}</div>
                      <div>Last message: {new Date(mqttStatus.last_message_time).toLocaleTimeString()}</div>
                    </div>
                  ) : (
                    <div>Last message: {new Date(systemStatus.last_mqtt_message).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>

              {/* MQTT Events History */}
              {mqttEvents.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Recent Events</h4>
                    <span className="text-xs text-gray-500">{mqttEvents.length} events</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {mqttEvents.map((event, index) => (
                      <div key={`${event.timestamp}-${event.message_number}`} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-gray-500 font-mono w-12 flex-shrink-0">
                            {new Date(event.timestamp).toLocaleTimeString().slice(-8, -3)}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                            {event.machine_name.replace('_', ' ')}
                          </span>
                          <span className="text-gray-900 font-medium truncate">
                            {event.payload}
                          </span>
                        </div>
                        <span className="text-gray-400 ml-2 flex-shrink-0">#{event.message_number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl font-bold text-indigo-600">
                    {systemStatus.active_recordings}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-lg font-medium text-gray-900">Active Recordings</div>
                <div className="mt-1 text-sm text-gray-500">
                  Total: {systemStatus.total_recordings}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl font-bold text-purple-600">
                    {Object.keys(systemStatus.cameras).length}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-lg font-medium text-gray-900">Cameras</div>
                <div className="mt-1 text-sm text-gray-500">
                  Machines: {Object.keys(systemStatus.machines).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Cameras Status */}
      {systemStatus && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Cameras</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Current status of all cameras in the system
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {Object.entries(systemStatus.cameras).map(([cameraName, camera]) => {
                // Debug logging to see what data we're getting
                console.log(`Camera ${cameraName} data:`, JSON.stringify(camera, null, 2))

                const friendlyName = camera.device_info?.friendly_name
                const hasDeviceInfo = !!camera.device_info
                const hasSerial = !!camera.device_info?.serial_number

                return (
                  <div key={cameraName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {friendlyName ? (
                            <div>
                              <div className="text-lg">{friendlyName}</div>
                              <div className="text-sm text-gray-600 font-normal">({cameraName})</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-lg">{cameraName}</div>
                              <div className="text-xs text-gray-500">
                                {hasDeviceInfo ? 'Device info available but no friendly name' : 'No device info available'}
                              </div>
                            </div>
                          )}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(camera.status, camera.is_recording)}`}>
                        {camera.is_recording ? 'Recording' : camera.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recording:</span>
                        <span className={`font-medium ${camera.is_recording ? 'text-red-600' : 'text-gray-900'}`}>
                          {camera.is_recording ? 'Yes' : 'No'}
                        </span>
                      </div>

                      {camera.device_info?.serial_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Serial:</span>
                          <span className="text-gray-900">{camera.device_info.serial_number}</span>
                        </div>
                      )}

                      {/* Debug info - remove this after fixing */}
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <div className="font-medium text-gray-700 mb-1">Debug Info:</div>
                        <div className="text-gray-600">
                          <div>Has device_info: {hasDeviceInfo ? 'Yes' : 'No'}</div>
                          <div>Has friendly_name: {friendlyName ? 'Yes' : 'No'}</div>
                          <div>Has serial: {hasSerial ? 'Yes' : 'No'}</div>
                          <div>Last error: {camera.last_error || 'None'}</div>
                          {camera.device_info && (
                            <div className="mt-1">
                              <div>Raw device_info: {JSON.stringify(camera.device_info)}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Last checked:</span>
                        <span className="text-gray-900">{new Date(camera.last_checked).toLocaleTimeString()}</span>
                      </div>

                      {camera.current_recording_file && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Recording file:</span>
                          <span className="text-gray-900 truncate ml-2">{camera.current_recording_file}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Machines Status */}
      {systemStatus && Object.keys(systemStatus.machines).length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Machines</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Current status of all machines in the system
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {Object.entries(systemStatus.machines).map(([machineName, machine]) => (
                <div key={machineName} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900 capitalize">
                      {machineName.replace(/_/g, ' ')}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMachineStateColor(machine.state)}`}>
                      {machine.state}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last updated:</span>
                      <span className="text-gray-900">{new Date(machine.last_updated).toLocaleTimeString()}</span>
                    </div>

                    {machine.last_message && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last message:</span>
                        <span className="text-gray-900">{machine.last_message}</span>
                      </div>
                    )}

                    {machine.mqtt_topic && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">MQTT topic:</span>
                        <span className="text-gray-900 text-xs font-mono">{machine.mqtt_topic}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Storage Statistics */}
      {storageStats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Storage</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Storage usage and file statistics
            </p>
          </div>
          <div className="border-t border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{storageStats.total_files}</div>
                <div className="text-sm text-gray-500">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{formatBytes(storageStats.total_size_bytes)}</div>
                <div className="text-sm text-gray-500">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{formatBytes(storageStats.disk_usage.free)}</div>
                <div className="text-sm text-gray-500">Free Space</div>
              </div>
            </div>

            {/* Disk Usage Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Disk Usage</span>
                <span>{Math.round((storageStats.disk_usage.used / storageStats.disk_usage.total) * 100)}% used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(storageStats.disk_usage.used / storageStats.disk_usage.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatBytes(storageStats.disk_usage.used)} used</span>
                <span>{formatBytes(storageStats.disk_usage.total)} total</span>
              </div>
            </div>

            {/* Per-Camera Statistics */}
            {Object.keys(storageStats.cameras).length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Files by Camera</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(storageStats.cameras).map(([cameraName, stats]) => {
                    // Find the corresponding camera to get friendly name
                    const camera = systemStatus?.cameras[cameraName]
                    const displayName = camera?.device_info?.friendly_name || cameraName

                    return (
                      <div key={cameraName} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">
                          {camera?.device_info?.friendly_name ? (
                            <>
                              {displayName}
                              <span className="text-gray-500 text-sm font-normal ml-2">({cameraName})</span>
                            </>
                          ) : (
                            cameraName
                          )}
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Files:</span>
                            <span className="text-gray-900">{stats.file_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Size:</span>
                            <span className="text-gray-900">{formatBytes(stats.total_size_bytes)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Recordings */}
      {Object.keys(recordings).length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Recordings</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest recording sessions
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Camera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(recordings).slice(0, 10).map(([recordingId, recording]) => {
                    // Find the corresponding camera to get friendly name
                    const camera = systemStatus?.cameras[recording.camera_name]
                    const displayName = camera?.device_info?.friendly_name || recording.camera_name

                    return (
                      <tr key={recordingId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {camera?.device_info?.friendly_name ? (
                            <div>
                              <div>{displayName}</div>
                              <div className="text-xs text-gray-500">({recording.camera_name})</div>
                            </div>
                          ) : (
                            recording.camera_name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {recording.filename}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recording.state)}`}>
                            {recording.state}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recording.duration_seconds ? formatDuration(recording.duration_seconds) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recording.file_size_bytes ? formatBytes(recording.file_size_bytes) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(recording.start_time).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
