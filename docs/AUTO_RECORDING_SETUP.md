# 🤖 Auto-Recording Setup Guide

This guide explains how to set up and test the automatic recording functionality that triggers camera recording when machines turn on/off via MQTT.

## 📋 Overview

The auto-recording feature allows cameras to automatically start recording when their associated machine turns on and stop recording when the machine turns off. This is based on MQTT messages received from the machines.

## 🔧 Setup Steps

### 1. Configure Camera Auto-Recording

1. **Access Vision System**: Navigate to the Vision System page in the dashboard
2. **Open Camera Configuration**: Click "Configure Camera" on any camera (admin access required)
3. **Enable Auto-Recording**: In the "Auto-Recording" section, check the box "Automatically start recording when machine turns on"
4. **Save Configuration**: Click "Save Changes" to apply the setting

### 2. Machine-Camera Mapping

The system uses the `machine_topic` field in camera configuration to determine which MQTT topic to monitor:

- **Camera 1** (`camera1`) → monitors `blower_separator`
- **Camera 2** (`camera2`) → monitors `vibratory_conveyor`

### 3. Start Auto-Recording Manager

1. **Navigate to Vision System**: Go to the Vision System page
2. **Find Auto-Recording Section**: Look for the "Auto-Recording" panel (admin only)
3. **Start Monitoring**: Click the "Start" button to begin monitoring MQTT events
4. **Monitor Status**: The panel will show the current state of all cameras and their auto-recording status

## 🧪 Testing the Functionality

### Test Scenario 1: Manual MQTT Message Simulation

If you have access to the MQTT broker, you can test by sending messages:

```bash
# Turn on the vibratory conveyor (should start recording on camera2)
mosquitto_pub -h 192.168.1.110 -t "vision/vibratory_conveyor/state" -m "on"

# Turn off the vibratory conveyor (should stop recording on camera2)
mosquitto_pub -h 192.168.1.110 -t "vision/vibratory_conveyor/state" -m "off"

# Turn on the blower separator (should start recording on camera1)
mosquitto_pub -h 192.168.1.110 -t "vision/blower_separator/state" -m "on"

# Turn off the blower separator (should stop recording on camera1)
mosquitto_pub -h 192.168.1.110 -t "vision/blower_separator/state" -m "off"
```

### Test Scenario 2: Physical Machine Operation

1. **Enable Auto-Recording**: Ensure auto-recording is enabled for the desired cameras
2. **Start Auto-Recording Manager**: Make sure the auto-recording manager is running
3. **Operate Machine**: Turn on the physical machine (conveyor or blower)
4. **Verify Recording**: Check that the camera starts recording automatically
5. **Stop Machine**: Turn off the machine
6. **Verify Stop**: Check that recording stops automatically

## 📊 Monitoring and Verification

### Auto-Recording Status Panel

The Vision System page includes an "Auto-Recording" status panel that shows:

- **Manager Status**: Whether the auto-recording manager is active
- **Camera States**: For each camera:
  - Machine state (ON/OFF)
  - Recording status (YES/NO)
  - Auto-record enabled status
  - Last state change timestamp

### MQTT Events Panel

Monitor the MQTT Events section to see:

- Recent machine state changes
- MQTT message timestamps
- Message payloads

### Recording Files

Check the storage section for automatically created recording files:

- Files will be named with pattern: `auto_{machine_name}_{timestamp}.avi`
- Example: `auto_vibratory_conveyor_2025-07-29T10-30-45-123Z.avi`

## 🔍 Troubleshooting

### Auto-Recording Not Starting

1. **Check Configuration**: Verify auto-recording is enabled in camera config
2. **Check Manager Status**: Ensure auto-recording manager is running
3. **Check MQTT Connection**: Verify MQTT client is connected
4. **Check Machine Topic**: Ensure camera's machine_topic matches MQTT topic
5. **Check Permissions**: Ensure you have admin access

### Recording Not Stopping

1. **Check MQTT Messages**: Verify "off" messages are being received
2. **Check Manager Logs**: Look for error messages in browser console
3. **Manual Stop**: Use manual stop recording if needed

### Performance Issues

1. **Polling Interval**: The manager polls MQTT events every 2 seconds by default
2. **Event Processing**: Only new events since last poll are processed
3. **Error Handling**: Failed operations are logged but don't stop the manager

## 🔧 Configuration Options

### Camera Configuration Fields

```json
{
  "auto_record_on_machine_start": true,  // Enable/disable auto-recording
  "machine_topic": "vibratory_conveyor", // MQTT topic to monitor
  // ... other camera settings
}
```

### Auto-Recording Manager Settings

- **Polling Interval**: 2000ms (configurable in code)
- **Event Batch Size**: 50 events per poll
- **Filename Pattern**: `auto_{machine_name}_{timestamp}.avi`

## 📝 API Endpoints

### Camera Configuration

- `GET /cameras/{camera_name}/config` - Get camera configuration
- `PUT /cameras/{camera_name}/config` - Update camera configuration

### Recording Control

- `POST /cameras/{camera_name}/start-recording` - Start recording
- `POST /cameras/{camera_name}/stop-recording` - Stop recording

### MQTT Monitoring

- `GET /mqtt/events?limit=50` - Get recent MQTT events
- `GET /machines` - Get machine states

## 🚨 Important Notes

1. **Admin Access Required**: Auto-recording configuration requires admin privileges
2. **Backend Integration**: This frontend implementation requires corresponding backend support
3. **MQTT Dependency**: Functionality depends on stable MQTT connection
4. **Storage Space**: Monitor storage usage as auto-recording can generate many files
5. **Network Reliability**: Ensure stable network connection for MQTT messages

## 🔄 Future Enhancements

Potential improvements for the auto-recording system:

1. **Recording Schedules**: Time-based recording rules
2. **Storage Management**: Automatic cleanup of old recordings
3. **Alert System**: Notifications for recording failures
4. **Advanced Triggers**: Multiple machine dependencies
5. **Recording Profiles**: Different settings per machine state
