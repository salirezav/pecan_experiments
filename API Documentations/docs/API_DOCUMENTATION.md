# 🚀 USDA Vision Camera System - Complete API Documentation

This document provides comprehensive documentation for all API endpoints in the USDA Vision Camera System, including recent enhancements and new features.

## 📋 Table of Contents

- [🔧 System Status & Health](#-system-status--health)
- [📷 Camera Management](#-camera-management)
- [🎥 Recording Control](#-recording-control)
- [🤖 Auto-Recording Management](#-auto-recording-management)
- [🎛️ Camera Configuration](#️-camera-configuration)
- [📡 MQTT & Machine Status](#-mqtt--machine-status)
- [💾 Storage & File Management](#-storage--file-management)
- [🔄 Camera Recovery & Diagnostics](#-camera-recovery--diagnostics)
- [📺 Live Streaming](#-live-streaming)
- [🎬 Video Streaming & Playback](#-video-streaming--playback)
- [🌐 WebSocket Real-time Updates](#-websocket-real-time-updates)

## 🔧 System Status & Health

### Get System Status
```http
GET /system/status
```
**Response**: `SystemStatusResponse`
```json
{
  "system_started": true,
  "mqtt_connected": true,
  "last_mqtt_message": "2024-01-15T10:30:00Z",
  "machines": {
    "vibratory_conveyor": {
      "name": "vibratory_conveyor",
      "state": "ON",
      "last_updated": "2024-01-15T10:30:00Z"
    }
  },
  "cameras": {
    "camera1": {
      "name": "camera1",
      "status": "ACTIVE",
      "is_recording": false,
      "auto_recording_enabled": true
    }
  },
  "active_recordings": 0,
  "total_recordings": 15,
  "uptime_seconds": 3600.5
}
```

### Health Check
```http
GET /health
```
**Response**: Simple health status
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📷 Camera Management

### Get All Cameras
```http
GET /cameras
```
**Response**: `Dict[str, CameraStatusResponse]`

### Get Specific Camera Status
```http
GET /cameras/{camera_name}/status
```
**Response**: `CameraStatusResponse`
```json
{
  "name": "camera1",
  "status": "ACTIVE",
  "is_recording": false,
  "last_checked": "2024-01-15T10:30:00Z",
  "last_error": null,
  "device_info": {
    "model": "GigE Camera",
    "serial": "12345"
  },
  "current_recording_file": null,
  "recording_start_time": null,
  "auto_recording_enabled": true,
  "auto_recording_active": false,
  "auto_recording_failure_count": 0,
  "auto_recording_last_attempt": null,
  "auto_recording_last_error": null
}
```

## 🎥 Recording Control

### Start Recording
```http
POST /cameras/{camera_name}/start-recording
Content-Type: application/json

{
  "filename": "test_recording.avi",
  "exposure_ms": 2.0,
  "gain": 4.0,
  "fps": 5.0
}
```

**Request Model**: `StartRecordingRequest`
- `filename` (optional): Custom filename (datetime prefix will be added automatically)
- `exposure_ms` (optional): Exposure time in milliseconds
- `gain` (optional): Camera gain value
- `fps` (optional): Target frames per second

**Response**: `StartRecordingResponse`
```json
{
  "success": true,
  "message": "Recording started for camera1",
  "filename": "20240115_103000_test_recording.avi"
}
```

**Key Features**:
- ✅ **Automatic datetime prefix**: All filenames get `YYYYMMDD_HHMMSS_` prefix
- ✅ **Dynamic camera settings**: Adjust exposure, gain, and FPS per recording
- ✅ **Backward compatibility**: All existing API calls work unchanged

### Stop Recording
```http
POST /cameras/{camera_name}/stop-recording
```
**Response**: `StopRecordingResponse`
```json
{
  "success": true,
  "message": "Recording stopped for camera1",
  "duration_seconds": 45.2
}
```

## 🤖 Auto-Recording Management

### Enable Auto-Recording for Camera
```http
POST /cameras/{camera_name}/auto-recording/enable
```
**Response**: `AutoRecordingConfigResponse`
```json
{
  "success": true,
  "message": "Auto-recording enabled for camera1",
  "camera_name": "camera1",
  "enabled": true
}
```

### Disable Auto-Recording for Camera
```http
POST /cameras/{camera_name}/auto-recording/disable
```
**Response**: `AutoRecordingConfigResponse`

### Get Auto-Recording Status
```http
GET /auto-recording/status
```
**Response**: `AutoRecordingStatusResponse`
```json
{
  "running": true,
  "auto_recording_enabled": true,
  "retry_queue": {},
  "enabled_cameras": ["camera1", "camera2"]
}
```

**Auto-Recording Features**:
- 🤖 **MQTT-triggered recording**: Automatically starts/stops based on machine state
- 🔄 **Retry logic**: Failed recordings are retried with configurable delays
- 📊 **Per-camera control**: Enable/disable auto-recording individually
- 📈 **Status tracking**: Monitor failure counts and last attempts

## 🎛️ Camera Configuration

### Get Camera Configuration
```http
GET /cameras/{camera_name}/config
```
**Response**: `CameraConfigResponse`
```json
{
  "name": "camera1",
  "machine_topic": "blower_separator",
  "storage_path": "/storage/camera1",
  "exposure_ms": 0.3,
  "gain": 4.0,
  "target_fps": 0,
  "enabled": true,
  "video_format": "mp4",
  "video_codec": "mp4v",
  "video_quality": 95,
  "auto_start_recording_enabled": true,
  "auto_recording_max_retries": 3,
  "auto_recording_retry_delay_seconds": 2,
  "contrast": 100,
  "saturation": 100,
  "gamma": 100,
  "noise_filter_enabled": false,
  "denoise_3d_enabled": false,
  "auto_white_balance": false,
  "color_temperature_preset": 0,
  "wb_red_gain": 0.94,
  "wb_green_gain": 1.0,
  "wb_blue_gain": 0.87,
  "anti_flicker_enabled": false,
  "light_frequency": 0,
  "bit_depth": 8,
  "hdr_enabled": false,
  "hdr_gain_mode": 2
}
```

### Update Camera Configuration
```http
PUT /cameras/{camera_name}/config
Content-Type: application/json

{
  "exposure_ms": 2.0,
  "gain": 4.0,
  "target_fps": 5.0,
  "sharpness": 130
}
```

### Apply Configuration (Restart Required)
```http
POST /cameras/{camera_name}/apply-config
```

**Configuration Categories**:
- ✅ **Real-time**: `exposure_ms`, `gain`, `target_fps`, `sharpness`, `contrast`, etc.
- ⚠️ **Restart required**: `noise_filter_enabled`, `denoise_3d_enabled`, `bit_depth`, `video_format`, `video_codec`, `video_quality`

For detailed configuration options, see [Camera Configuration API Guide](api/CAMERA_CONFIG_API.md).

## 📡 MQTT & Machine Status

### Get All Machines
```http
GET /machines
```
**Response**: `Dict[str, MachineStatusResponse]`

### Get MQTT Status
```http
GET /mqtt/status
```
**Response**: `MQTTStatusResponse`
```json
{
  "connected": true,
  "broker_host": "192.168.1.110",
  "broker_port": 1883,
  "subscribed_topics": ["vibratory_conveyor", "blower_separator"],
  "last_message_time": "2024-01-15T10:30:00Z",
  "message_count": 1250,
  "error_count": 2,
  "uptime_seconds": 3600.5
}
```

### Get MQTT Events History
```http
GET /mqtt/events?limit=10
```
**Response**: `MQTTEventsHistoryResponse`
```json
{
  "events": [
    {
      "machine_name": "vibratory_conveyor",
      "topic": "vibratory_conveyor",
      "payload": "ON",
      "normalized_state": "ON",
      "timestamp": "2024-01-15T10:30:00Z",
      "message_number": 1250
    }
  ],
  "total_events": 1250,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

## 💾 Storage & File Management

### Get Storage Statistics
```http
GET /storage/stats
```
**Response**: `StorageStatsResponse`
```json
{
  "base_path": "/storage",
  "total_files": 150,
  "total_size_bytes": 5368709120,
  "cameras": {
    "camera1": {
      "file_count": 75,
      "total_size_bytes": 2684354560
    },
    "camera2": {
      "file_count": 75,
      "total_size_bytes": 2684354560
    }
  },
  "disk_usage": {
    "total_bytes": 107374182400,
    "used_bytes": 53687091200,
    "free_bytes": 53687091200,
    "usage_percent": 50.0
  }
}
```

### Get File List
```http
POST /storage/files
Content-Type: application/json

{
  "camera_name": "camera1",
  "start_date": "2024-01-15",
  "end_date": "2024-01-16",
  "limit": 50
}
```
**Response**: `FileListResponse`
```json
{
  "files": [
    {
      "filename": "20240115_103000_test_recording.avi",
      "camera_name": "camera1",
      "size_bytes": 52428800,
      "created_time": "2024-01-15T10:30:00Z",
      "duration_seconds": 30.5
    }
  ],
  "total_count": 1
}
```

### Cleanup Old Files
```http
POST /storage/cleanup
Content-Type: application/json

{
  "max_age_days": 30
}
```
**Response**: `CleanupResponse`
```json
{
  "files_removed": 25,
  "bytes_freed": 1073741824,
  "errors": []
}
```

## 🔄 Camera Recovery & Diagnostics

### Test Camera Connection
```http
POST /cameras/{camera_name}/test-connection
```
**Response**: `CameraTestResponse`

### Reconnect Camera
```http
POST /cameras/{camera_name}/reconnect
```
**Response**: `CameraRecoveryResponse`

### Restart Camera Grab Process
```http
POST /cameras/{camera_name}/restart-grab
```
**Response**: `CameraRecoveryResponse`

### Reset Camera Timestamp
```http
POST /cameras/{camera_name}/reset-timestamp
```
**Response**: `CameraRecoveryResponse`

### Full Camera Reset
```http
POST /cameras/{camera_name}/full-reset
```
**Response**: `CameraRecoveryResponse`

### Reinitialize Camera
```http
POST /cameras/{camera_name}/reinitialize
```
**Response**: `CameraRecoveryResponse`

**Recovery Response Example**:
```json
{
  "success": true,
  "message": "Camera camera1 reconnected successfully",
  "camera_name": "camera1",
  "operation": "reconnect",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📺 Live Streaming

### Get Live MJPEG Stream
```http
GET /cameras/{camera_name}/stream
```
**Response**: MJPEG video stream (multipart/x-mixed-replace)

### Start Camera Stream
```http
POST /cameras/{camera_name}/start-stream
```

### Stop Camera Stream
```http
POST /cameras/{camera_name}/stop-stream
```

**Streaming Features**:
- 📺 **MJPEG format**: Compatible with web browsers and React apps
- 🔄 **Concurrent operation**: Stream while recording simultaneously
- ⚡ **Low latency**: Real-time preview for monitoring

For detailed streaming integration, see [Streaming Guide](guides/STREAMING_GUIDE.md).

## 🎬 Video Streaming & Playback

The system includes a comprehensive video streaming module that provides YouTube-like video playback capabilities with HTTP range request support, thumbnail generation, and intelligent caching.

### List Videos
```http
GET /videos/
```
**Query Parameters:**
- `camera_name` (optional): Filter by camera name
- `start_date` (optional): Filter videos created after this date (ISO format)
- `end_date` (optional): Filter videos created before this date (ISO format)
- `limit` (optional): Maximum number of results (default: 50, max: 1000)
- `include_metadata` (optional): Include video metadata (default: false)

**Response**: `VideoListResponse`
```json
{
  "videos": [
    {
      "file_id": "camera1_auto_blower_separator_20250804_143022.mp4",
      "camera_name": "camera1",
      "filename": "camera1_auto_blower_separator_20250804_143022.mp4",
      "file_size_bytes": 31457280,
      "format": "mp4",
      "status": "completed",
      "created_at": "2025-08-04T14:30:22",
      "start_time": "2025-08-04T14:30:22",
      "end_time": "2025-08-04T14:32:22",
      "machine_trigger": "blower_separator",
      "is_streamable": true,
      "needs_conversion": false,
      "metadata": {
        "duration_seconds": 120.5,
        "width": 1920,
        "height": 1080,
        "fps": 30.0,
        "codec": "mp4v",
        "bitrate": 5000000,
        "aspect_ratio": 1.777
      }
    }
  ],
  "total_count": 1
}
```

### Get Video Information
```http
GET /videos/{file_id}
```
**Response**: `VideoInfoResponse` with detailed video information including metadata.

### Stream Video
```http
GET /videos/{file_id}/stream
```
**Headers:**
- `Range: bytes=0-1023` (optional): Request specific byte range for seeking

**Features:**
- ✅ **HTTP Range Requests**: Enables video seeking and progressive download
- ✅ **Partial Content**: Returns 206 status for range requests
- ✅ **Format Conversion**: Automatic AVI to MP4 conversion for web compatibility
- ✅ **Intelligent Caching**: Optimized performance with byte-range caching
- ✅ **CORS Enabled**: Ready for web browser integration

**Response Headers:**
- `Accept-Ranges: bytes`
- `Content-Length: {size}`
- `Content-Range: bytes {start}-{end}/{total}` (for range requests)
- `Cache-Control: public, max-age=3600`

### Get Video Thumbnail
```http
GET /videos/{file_id}/thumbnail?timestamp=5.0&width=320&height=240
```
**Query Parameters:**
- `timestamp` (optional): Time position in seconds (default: 1.0)
- `width` (optional): Thumbnail width in pixels (default: 320)
- `height` (optional): Thumbnail height in pixels (default: 240)

**Response**: JPEG image data with caching headers

### Get Streaming Information
```http
GET /videos/{file_id}/info
```
**Response**: `StreamingInfoResponse`
```json
{
  "file_id": "camera1_recording_20250804_143022.avi",
  "file_size_bytes": 52428800,
  "content_type": "video/mp4",
  "supports_range_requests": true,
  "chunk_size_bytes": 262144
}
```

### Video Validation
```http
POST /videos/{file_id}/validate
```
**Response**: Validation status and accessibility check
```json
{
  "file_id": "camera1_recording_20250804_143022.avi",
  "is_valid": true
}
```

### Cache Management
```http
POST /videos/{file_id}/cache/invalidate
```
**Response**: Cache invalidation status
```json
{
  "file_id": "camera1_recording_20250804_143022.avi",
  "cache_invalidated": true
}
```

### Admin: Cache Cleanup
```http
POST /admin/videos/cache/cleanup?max_size_mb=100
```
**Response**: Cache cleanup results
```json
{
  "cache_cleaned": true,
  "entries_removed": 15,
  "max_size_mb": 100
}
```

**Video Streaming Features**:
- 🎥 **Multiple Formats**: Native MP4 support with AVI conversion
- 📱 **Web Compatible**: Direct integration with HTML5 video elements
- ⚡ **High Performance**: Intelligent caching and adaptive chunking
- 🖼️ **Thumbnail Generation**: Extract preview images at any timestamp
- 🔄 **Range Requests**: Efficient seeking and progressive download

## 🌐 WebSocket Real-time Updates

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Real-time update:', update);
};
```

**WebSocket Message Types**:
- `system_status`: System status changes
- `camera_status`: Camera status updates
- `recording_started`: Recording start events
- `recording_stopped`: Recording stop events
- `mqtt_message`: MQTT message received
- `auto_recording_event`: Auto-recording status changes

**Example WebSocket Message**:
```json
{
  "type": "recording_started",
  "data": {
    "camera_name": "camera1",
    "filename": "20240115_103000_auto_recording.avi",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🚀 Quick Start Examples

### Basic System Monitoring
```bash
# Check system health
curl http://localhost:8000/health

# Get overall system status
curl http://localhost:8000/system/status

# Get all camera statuses
curl http://localhost:8000/cameras
```

### Manual Recording Control
```bash
# Start recording with default settings
curl -X POST http://localhost:8000/cameras/camera1/start-recording \
  -H "Content-Type: application/json" \
  -d '{"filename": "manual_test.avi"}'

# Start recording with custom camera settings
curl -X POST http://localhost:8000/cameras/camera1/start-recording \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "high_quality.avi",
    "exposure_ms": 2.0,
    "gain": 4.0,
    "fps": 5.0
  }'

# Stop recording
curl -X POST http://localhost:8000/cameras/camera1/stop-recording
```

### Auto-Recording Management
```bash
# Enable auto-recording for camera1
curl -X POST http://localhost:8000/cameras/camera1/auto-recording/enable

# Check auto-recording status
curl http://localhost:8000/auto-recording/status

# Disable auto-recording for camera1
curl -X POST http://localhost:8000/cameras/camera1/auto-recording/disable
```

### Video Streaming Operations
```bash
# List all videos
curl http://localhost:8000/videos/

# List videos from specific camera with metadata
curl "http://localhost:8000/videos/?camera_name=camera1&include_metadata=true"

# Get video information
curl http://localhost:8000/videos/camera1_recording_20250804_143022.avi

# Get video thumbnail
curl "http://localhost:8000/videos/camera1_recording_20250804_143022.avi/thumbnail?timestamp=5.0&width=320&height=240" \
  --output thumbnail.jpg

# Get streaming info
curl http://localhost:8000/videos/camera1_recording_20250804_143022.avi/info

# Stream video with range request
curl -H "Range: bytes=0-1023" \
  http://localhost:8000/videos/camera1_recording_20250804_143022.avi/stream

# Validate video file
curl -X POST http://localhost:8000/videos/camera1_recording_20250804_143022.avi/validate

# Clean up video cache (admin)
curl -X POST "http://localhost:8000/admin/videos/cache/cleanup?max_size_mb=100"
```

### Camera Configuration
```bash
# Get current camera configuration
curl http://localhost:8000/cameras/camera1/config

# Update camera settings (real-time)
curl -X PUT http://localhost:8000/cameras/camera1/config \
  -H "Content-Type: application/json" \
  -d '{
    "exposure_ms": 1.5,
    "gain": 3.0,
    "sharpness": 130,
    "contrast": 120
  }'
```

## 📈 Recent API Changes & Enhancements

### ✨ New in Latest Version

#### 1. Enhanced Recording API
- **Dynamic camera settings**: Set exposure, gain, and FPS per recording
- **Automatic datetime prefixes**: All filenames get timestamp prefixes
- **Backward compatibility**: Existing API calls work unchanged

#### 2. Auto-Recording Feature
- **Per-camera control**: Enable/disable auto-recording individually
- **MQTT integration**: Automatic recording based on machine states
- **Retry logic**: Failed recordings are automatically retried
- **Status tracking**: Monitor auto-recording attempts and failures

#### 3. Advanced Camera Configuration
- **Real-time settings**: Update exposure, gain, image quality without restart
- **Image enhancement**: Sharpness, contrast, saturation, gamma controls
- **Noise reduction**: Configurable noise filtering and 3D denoising
- **HDR support**: High Dynamic Range imaging capabilities

#### 4. Live Streaming
- **MJPEG streaming**: Real-time camera preview
- **Concurrent operation**: Stream while recording simultaneously
- **Web-compatible**: Direct integration with React/HTML video elements

#### 5. Enhanced Monitoring
- **MQTT event history**: Track machine state changes over time
- **Storage statistics**: Monitor disk usage and file counts
- **WebSocket updates**: Real-time system status notifications

#### 6. Video Streaming Module
- **HTTP Range Requests**: Efficient video seeking and progressive download
- **Thumbnail Generation**: Extract preview images from videos at any timestamp
- **Format Conversion**: Automatic AVI to MP4 conversion for web compatibility
- **Intelligent Caching**: Byte-range caching for optimal streaming performance
- **Admin Tools**: Cache management and video validation endpoints

### 🔄 Migration Notes

#### From Previous Versions
1. **Recording API**: All existing calls work, but now return filenames with datetime prefixes
2. **Configuration**: New camera settings are optional and backward compatible
3. **Auto-recording**: New feature, requires enabling in `config.json` and per camera

#### Configuration Updates
```json
{
  "cameras": [
    {
      "name": "camera1",
      "auto_start_recording_enabled": true,  // NEW: Enable auto-recording
      "sharpness": 120,                      // NEW: Image quality settings
      "contrast": 110,
      "saturation": 100,
      "gamma": 100,
      "noise_filter_enabled": true,
      "hdr_enabled": false
    }
  ],
  "system": {
    "auto_recording_enabled": true           // NEW: Global auto-recording toggle
  }
}
```

## 🔗 Related Documentation

- [📷 Camera Configuration API Guide](api/CAMERA_CONFIG_API.md) - Detailed camera settings
- [🤖 Auto-Recording Feature Guide](features/AUTO_RECORDING_FEATURE_GUIDE.md) - React integration
- [📺 Streaming Guide](guides/STREAMING_GUIDE.md) - Live video streaming
- [🎬 Video Streaming Guide](VIDEO_STREAMING.md) - Video playback and streaming
- [🤖 AI Agent Video Integration Guide](AI_AGENT_VIDEO_INTEGRATION_GUIDE.md) - Complete integration guide for AI agents
- [🔧 Camera Recovery Guide](guides/CAMERA_RECOVERY_GUIDE.md) - Troubleshooting
- [📡 MQTT Logging Guide](guides/MQTT_LOGGING_GUIDE.md) - MQTT configuration

## 📞 Support & Integration

### API Base URL
- **Development**: `http://localhost:8000`
- **Production**: Configure in `config.json` under `system.api_host` and `system.api_port`

### Error Handling
All endpoints return standard HTTP status codes:
- `200`: Success
- `206`: Partial Content (for video range requests)
- `400`: Bad Request (invalid parameters)
- `404`: Resource not found (camera, file, video, etc.)
- `416`: Range Not Satisfiable (invalid video range request)
- `500`: Internal server error
- `503`: Service unavailable (camera manager, MQTT, etc.)

**Video Streaming Specific Errors:**
- `404`: Video file not found or not streamable
- `416`: Invalid range request (malformed Range header)
- `500`: Failed to read video data or generate thumbnail

### Rate Limiting
- No rate limiting currently implemented
- WebSocket connections are limited to reasonable concurrent connections

### CORS Support
- CORS is enabled for web dashboard integration
- Configure allowed origins in the API server settings
```
```
