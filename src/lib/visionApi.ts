// Vision System API Client
// Base URL for the vision system API
const VISION_API_BASE_URL = 'http://localhost:8000'

// Types based on the API documentation
export interface SystemStatus {
  system_started: boolean
  mqtt_connected: boolean
  last_mqtt_message: string
  machines: Record<string, MachineStatus>
  cameras: Record<string, CameraStatus>
  active_recordings: number
  total_recordings: number
  uptime_seconds: number
}

export interface MachineStatus {
  name: string
  state: string
  last_updated: string
  last_message?: string
  mqtt_topic?: string
}

export interface CameraStatus {
  name: string
  status: string
  is_recording: boolean
  last_checked: string
  last_error: string | null
  device_info?: {
    friendly_name: string
    serial_number: string
  }
  current_recording_file: string | null
  recording_start_time: string | null
}

export interface RecordingInfo {
  camera_name: string
  filename: string
  start_time: string
  state: string
  end_time?: string
  file_size_bytes?: number
  frame_count?: number
  duration_seconds?: number
  error_message?: string | null
}

export interface StorageStats {
  base_path: string
  total_files: number
  total_size_bytes: number
  cameras: Record<string, {
    file_count: number
    total_size_bytes: number
  }>
  disk_usage: {
    total: number
    used: number
    free: number
  }
}

export interface RecordingFile {
  filename: string
  camera_name: string
  file_size_bytes: number
  created_date: string
  duration_seconds?: number
}

export interface StartRecordingRequest {
  filename?: string
  exposure_ms?: number
  gain?: number
  fps?: number
}

export interface StartRecordingResponse {
  success: boolean
  message: string
  filename: string
}

export interface StopRecordingResponse {
  success: boolean
  message: string
  duration_seconds: number
}

export interface CameraTestResponse {
  success: boolean
  message: string
  camera_name: string
  timestamp: string
}

export interface CameraRecoveryResponse {
  success: boolean
  message: string
  camera_name: string
  operation: string
  timestamp: string
}

export interface MqttMessage {
  timestamp: string
  topic: string
  message: string
  source: string
}

export interface MqttStatus {
  connected: boolean
  broker_host: string
  broker_port: number
  subscribed_topics: string[]
  last_message_time: string
  message_count: number
  error_count: number
  uptime_seconds: number
}

export interface MqttEvent {
  machine_name: string
  topic: string
  payload: string
  normalized_state: string
  timestamp: string
  message_number: number
}

export interface MqttEventsResponse {
  events: MqttEvent[]
  total_events: number
  last_updated: string
}

export interface FileListRequest {
  camera_name?: string
  start_date?: string
  end_date?: string
  limit?: number
}

export interface FileListResponse {
  files: RecordingFile[]
  total_count: number
}

export interface CleanupRequest {
  max_age_days?: number
}

export interface CleanupResponse {
  files_removed: number
  bytes_freed: number
  errors: string[]
}

// API Client Class
class VisionApiClient {
  private baseUrl: string

  constructor(baseUrl: string = VISION_API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // System endpoints
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.request('/system/status')
  }

  // Machine endpoints
  async getMachines(): Promise<Record<string, MachineStatus>> {
    return this.request('/machines')
  }

  // MQTT endpoints
  async getMqttStatus(): Promise<MqttStatus> {
    return this.request('/mqtt/status')
  }

  async getMqttEvents(limit: number = 10): Promise<MqttEventsResponse> {
    return this.request(`/mqtt/events?limit=${limit}`)
  }

  // Camera endpoints
  async getCameras(): Promise<Record<string, CameraStatus>> {
    return this.request('/cameras')
  }

  async getCameraStatus(cameraName: string): Promise<CameraStatus> {
    return this.request(`/cameras/${cameraName}/status`)
  }

  // Recording control
  async startRecording(cameraName: string, params: StartRecordingRequest = {}): Promise<StartRecordingResponse> {
    return this.request(`/cameras/${cameraName}/start-recording`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async stopRecording(cameraName: string): Promise<StopRecordingResponse> {
    return this.request(`/cameras/${cameraName}/stop-recording`, {
      method: 'POST',
    })
  }

  // Camera diagnostics
  async testCameraConnection(cameraName: string): Promise<CameraTestResponse> {
    return this.request(`/cameras/${cameraName}/test-connection`, {
      method: 'POST',
    })
  }

  async reconnectCamera(cameraName: string): Promise<CameraRecoveryResponse> {
    return this.request(`/cameras/${cameraName}/reconnect`, {
      method: 'POST',
    })
  }

  async restartCameraGrab(cameraName: string): Promise<CameraRecoveryResponse> {
    return this.request(`/cameras/${cameraName}/restart-grab`, {
      method: 'POST',
    })
  }

  async resetCameraTimestamp(cameraName: string): Promise<CameraRecoveryResponse> {
    return this.request(`/cameras/${cameraName}/reset-timestamp`, {
      method: 'POST',
    })
  }

  async fullCameraReset(cameraName: string): Promise<CameraRecoveryResponse> {
    return this.request(`/cameras/${cameraName}/full-reset`, {
      method: 'POST',
    })
  }

  async reinitializeCamera(cameraName: string): Promise<CameraRecoveryResponse> {
    return this.request(`/cameras/${cameraName}/reinitialize`, {
      method: 'POST',
    })
  }

  // Recording sessions
  async getRecordings(): Promise<Record<string, RecordingInfo>> {
    return this.request('/recordings')
  }

  // Storage endpoints
  async getStorageStats(): Promise<StorageStats> {
    return this.request('/storage/stats')
  }

  async getFiles(params: FileListRequest = {}): Promise<FileListResponse> {
    return this.request('/storage/files', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async cleanupStorage(params: CleanupRequest = {}): Promise<CleanupResponse> {
    return this.request('/storage/cleanup', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }
}

// Export a singleton instance
export const visionApi = new VisionApiClient()

// Utility functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
