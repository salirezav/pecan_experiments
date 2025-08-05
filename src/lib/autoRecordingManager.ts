/**
 * Auto-Recording Manager
 * 
 * This module handles automatic recording start/stop based on MQTT machine state changes.
 * It monitors MQTT events and triggers camera recording when machines turn on/off.
 */

import { visionApi, type MqttEvent, type CameraConfig } from './visionApi'

export interface AutoRecordingState {
  cameraName: string
  machineState: 'on' | 'off'
  isRecording: boolean
  autoRecordEnabled: boolean
  lastStateChange: Date
}

export class AutoRecordingManager {
  private cameras: Map<string, AutoRecordingState> = new Map()
  private mqttPollingInterval: NodeJS.Timeout | null = null
  private lastProcessedEventNumber = 0
  private isRunning = false

  constructor(private pollingIntervalMs: number = 2000) {}

  /**
   * Start the auto-recording manager
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Auto-recording manager is already running')
      return
    }

    console.log('Starting auto-recording manager...')
    this.isRunning = true

    // Initialize camera configurations
    await this.initializeCameras()

    // Start polling for MQTT events
    this.startMqttPolling()
  }

  /**
   * Stop the auto-recording manager
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('Stopping auto-recording manager...')
    this.isRunning = false

    if (this.mqttPollingInterval) {
      clearInterval(this.mqttPollingInterval)
      this.mqttPollingInterval = null
    }

    this.cameras.clear()
  }

  /**
   * Initialize camera configurations and states
   */
  private async initializeCameras(): Promise<void> {
    try {
      const cameras = await visionApi.getCameras()
      
      for (const [cameraName, cameraStatus] of Object.entries(cameras)) {
        try {
          const config = await visionApi.getCameraConfig(cameraName)
          
          this.cameras.set(cameraName, {
            cameraName,
            machineState: 'off', // Default to off
            isRecording: cameraStatus.is_recording,
            autoRecordEnabled: config.auto_record_on_machine_start,
            lastStateChange: new Date()
          })

          console.log(`Initialized camera ${cameraName}: auto-record=${config.auto_record_on_machine_start}, machine=${config.machine_topic}`)
        } catch (error) {
          console.error(`Failed to initialize camera ${cameraName}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to initialize cameras:', error)
    }
  }

  /**
   * Start polling for MQTT events
   */
  private startMqttPolling(): void {
    this.mqttPollingInterval = setInterval(async () => {
      if (!this.isRunning) {
        return
      }

      try {
        await this.processMqttEvents()
      } catch (error) {
        console.error('Error processing MQTT events:', error)
      }
    }, this.pollingIntervalMs)
  }

  /**
   * Process new MQTT events and trigger recording actions
   */
  private async processMqttEvents(): Promise<void> {
    try {
      const mqttResponse = await visionApi.getMqttEvents(50) // Get recent events
      
      // Filter for new events we haven't processed yet
      const newEvents = mqttResponse.events.filter(
        event => event.message_number > this.lastProcessedEventNumber
      )

      if (newEvents.length === 0) {
        return
      }

      // Update last processed event number
      this.lastProcessedEventNumber = Math.max(
        ...newEvents.map(event => event.message_number)
      )

      // Process each new event
      for (const event of newEvents) {
        await this.handleMqttEvent(event)
      }
    } catch (error) {
      console.error('Failed to fetch MQTT events:', error)
    }
  }

  /**
   * Handle a single MQTT event and trigger recording if needed
   */
  private async handleMqttEvent(event: MqttEvent): Promise<void> {
    const { machine_name, normalized_state } = event
    
    // Find cameras that are configured for this machine
    const affectedCameras = await this.getCamerasForMachine(machine_name)
    
    for (const cameraName of affectedCameras) {
      const cameraState = this.cameras.get(cameraName)
      
      if (!cameraState || !cameraState.autoRecordEnabled) {
        continue
      }

      const newMachineState = normalized_state as 'on' | 'off'
      
      // Skip if state hasn't changed
      if (cameraState.machineState === newMachineState) {
        continue
      }

      console.log(`Machine ${machine_name} changed from ${cameraState.machineState} to ${newMachineState} - Camera: ${cameraName}`)

      // Update camera state
      cameraState.machineState = newMachineState
      cameraState.lastStateChange = new Date()

      // Trigger recording action
      if (newMachineState === 'on' && !cameraState.isRecording) {
        await this.startAutoRecording(cameraName, machine_name)
      } else if (newMachineState === 'off' && cameraState.isRecording) {
        await this.stopAutoRecording(cameraName, machine_name)
      }
    }
  }

  /**
   * Get cameras that are configured for a specific machine
   */
  private async getCamerasForMachine(machineName: string): Promise<string[]> {
    const cameras: string[] = []

    // Define the correct machine-to-camera mapping
    const machineToCamera: Record<string, string> = {
      'blower_separator': 'camera1',    // camera1 is for blower separator
      'vibratory_conveyor': 'camera2'   // camera2 is for conveyor
    }

    const expectedCamera = machineToCamera[machineName]
    if (!expectedCamera) {
      console.warn(`No camera mapping found for machine: ${machineName}`)
      return cameras
    }

    try {
      const allCameras = await visionApi.getCameras()

      // Check if the expected camera exists and has auto-recording enabled
      if (allCameras[expectedCamera]) {
        try {
          const config = await visionApi.getCameraConfig(expectedCamera)

          if (config.auto_record_on_machine_start) {
            cameras.push(expectedCamera)
            console.log(`Found camera ${expectedCamera} configured for machine ${machineName}`)
          } else {
            console.log(`Camera ${expectedCamera} exists but auto-recording is disabled`)
          }
        } catch (error) {
          console.error(`Failed to get config for camera ${expectedCamera}:`, error)
        }
      } else {
        console.warn(`Expected camera ${expectedCamera} not found for machine ${machineName}`)
      }
    } catch (error) {
      console.error('Failed to get cameras for machine:', error)
    }

    return cameras
  }

  /**
   * Start auto-recording for a camera
   */
  private async startAutoRecording(cameraName: string, machineName: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `auto_${machineName}_${timestamp}.mp4`

      const result = await visionApi.startRecording(cameraName, { filename })
      
      if (result.success) {
        const cameraState = this.cameras.get(cameraName)
        if (cameraState) {
          cameraState.isRecording = true
        }
        
        console.log(`✅ Auto-recording started for ${cameraName}: ${result.filename}`)
      } else {
        console.error(`❌ Failed to start auto-recording for ${cameraName}:`, result.message)
      }
    } catch (error) {
      console.error(`❌ Error starting auto-recording for ${cameraName}:`, error)
    }
  }

  /**
   * Stop auto-recording for a camera
   */
  private async stopAutoRecording(cameraName: string, machineName: string): Promise<void> {
    try {
      const result = await visionApi.stopRecording(cameraName)
      
      if (result.success) {
        const cameraState = this.cameras.get(cameraName)
        if (cameraState) {
          cameraState.isRecording = false
        }
        
        console.log(`⏹️ Auto-recording stopped for ${cameraName} (${result.duration_seconds}s)`)
      } else {
        console.error(`❌ Failed to stop auto-recording for ${cameraName}:`, result.message)
      }
    } catch (error) {
      console.error(`❌ Error stopping auto-recording for ${cameraName}:`, error)
    }
  }

  /**
   * Get current auto-recording states for all cameras
   */
  getStates(): AutoRecordingState[] {
    return Array.from(this.cameras.values())
  }

  /**
   * Refresh camera configurations (call when configs are updated)
   */
  async refreshConfigurations(): Promise<void> {
    await this.initializeCameras()
  }
}

// Global instance
export const autoRecordingManager = new AutoRecordingManager()
