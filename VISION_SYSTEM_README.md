# Vision System Dashboard

This document describes the Vision System dashboard that has been added to the Pecan Experiments application.

## Overview

The Vision System dashboard provides real-time monitoring and control of the USDA Vision Camera System. It displays information about cameras, machines, storage, and recording sessions.

## Features

### System Overview
- **System Status**: Shows if the vision system is online/offline with uptime information
- **MQTT Connection**: Displays MQTT connectivity status and last message timestamp
- **Active Recordings**: Shows current number of active recordings and total recordings
- **Camera/Machine Count**: Quick overview of connected devices

### Camera Monitoring
- **Real-time Status**: Shows connection status for each camera (camera1, camera2)
- **Recording State**: Indicates if cameras are currently recording
- **Device Information**: Displays friendly names and serial numbers
- **Error Reporting**: Shows any camera errors or issues
- **Current Recording Files**: Shows active recording filenames

### Machine Status
- **Machine States**: Monitors vibratory conveyor, blower separator, and other machines
- **MQTT Topics**: Shows the MQTT topics for each machine
- **Last Updated**: Timestamps for when each machine status was last updated
- **State Colors**: Visual indicators for machine states (on/off/running/stopped)

### Storage Management
- **Disk Usage**: Visual progress bar showing total disk usage
- **File Statistics**: Total files, total size, and free space
- **Per-Camera Breakdown**: Storage usage statistics for each camera
- **Storage Path**: Shows the base storage directory

### Recording Sessions
- **Recent Recordings Table**: Shows the latest recording sessions
- **Recording Details**: Filename, camera, status, duration, file size, start time
- **Status Indicators**: Visual status badges for completed/active/failed recordings

## API Integration

The dashboard connects to the Vision System API running on `http://vision:8000` and provides:

### Endpoints Used
- `GET /system/status` - System overview and status
- `GET /cameras` - Camera status and information
- `GET /machines` - Machine status and MQTT data
- `GET /storage/stats` - Storage usage statistics
- `GET /recordings` - Recording session information

### Auto-Refresh
- The dashboard automatically refreshes data every 5 seconds
- Manual refresh button available for immediate updates
- Loading indicators show when data is being fetched

## Access Control

The Vision System dashboard is accessible to all authenticated users regardless of role:
- **Admin**: Full access to all features
- **Conductor**: Full access to all features
- **Analyst**: Full access to all features
- **Data Recorder**: Full access to all features

## Error Handling

The dashboard includes comprehensive error handling:
- **Connection Errors**: Shows user-friendly messages when the vision system is unavailable
- **API Errors**: Displays specific error messages from the vision system API
- **Retry Functionality**: "Try Again" button to retry failed requests
- **Graceful Degradation**: Shows partial data if some API calls fail

## Technical Implementation

### Files Added/Modified
- `src/lib/visionApi.ts` - API client for vision system integration
- `src/components/VisionSystem.tsx` - Main dashboard component
- `src/components/DashboardLayout.tsx` - Added routing for vision system
- `src/components/Sidebar.tsx` - Added menu item for vision system
- `src/components/TopNavbar.tsx` - Added page title for vision system

### Dependencies
- Uses existing React/TypeScript setup
- Leverages Tailwind CSS for styling
- No additional dependencies required

### API Client Features
- TypeScript interfaces for all API responses
- Comprehensive error handling
- Utility functions for formatting (bytes, duration, uptime)
- Singleton pattern for API client instance

## Usage

1. **Navigate to Vision System**: Click "Vision System" in the sidebar menu
2. **Monitor Status**: View real-time system, camera, and machine status
3. **Check Storage**: Monitor disk usage and file statistics
4. **Review Recordings**: See recent recording sessions and their details
5. **Refresh Data**: Use the refresh button or wait for auto-refresh

## Troubleshooting

### Common Issues

1. **"Failed to fetch vision system data"**
   - Ensure the vision system API is running on vision:8000
   - Check network connectivity
   - Verify the vision system service is started

2. **Empty Dashboard**
   - Vision system may not have any cameras or machines configured
   - Check vision system configuration
   - Verify MQTT connectivity

3. **Outdated Information**
   - Data refreshes every 5 seconds automatically
   - Use the manual refresh button for immediate updates
   - Check if vision system is responding to API calls

### API Base URL Configuration

The API base URL is configured in `src/lib/visionApi.ts`:
```typescript
const VISION_API_BASE_URL = 'http://vision:8000'
```

To change the API endpoint, modify this constant and rebuild the application.

## Future Enhancements

Potential improvements for the vision system dashboard:
- **Camera Controls**: Add start/stop recording buttons
- **Camera Recovery**: Add diagnostic and recovery action buttons
- **File Management**: Add file browsing and cleanup functionality
- **Real-time Streaming**: Add live camera feed display
- **Alerts**: Add notifications for system issues
- **Historical Data**: Add charts and trends for system metrics
