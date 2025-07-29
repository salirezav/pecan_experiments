// Test script to verify the camera configuration API fix
// This simulates the VisionApiClient.getCameraConfig method

class TestVisionApiClient {
  constructor() {
    this.baseUrl = 'http://vision:8000'
  }

  async request(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`)
    }

    return response.json()
  }

  // This is our fixed getCameraConfig method
  async getCameraConfig(cameraName) {
    try {
      const config = await this.request(`/cameras/${cameraName}/config`)

      // Ensure auto-recording fields have default values if missing
      return {
        ...config,
        auto_start_recording_enabled: config.auto_start_recording_enabled ?? false,
        auto_recording_max_retries: config.auto_recording_max_retries ?? 3,
        auto_recording_retry_delay_seconds: config.auto_recording_retry_delay_seconds ?? 5
      }
    } catch (error) {
      // If the error is related to missing auto-recording fields, try to handle it gracefully
      if (error.message?.includes('auto_start_recording_enabled') ||
        error.message?.includes('auto_recording_max_retries') ||
        error.message?.includes('auto_recording_retry_delay_seconds')) {

        // Try to get the raw camera data and add default auto-recording fields
        try {
          const response = await fetch(`${this.baseUrl}/cameras/${cameraName}/config`, {
            headers: {
              'Content-Type': 'application/json',
            }
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const rawConfig = await response.json()

          // Add missing auto-recording fields with defaults
          return {
            ...rawConfig,
            auto_start_recording_enabled: false,
            auto_recording_max_retries: 3,
            auto_recording_retry_delay_seconds: 5
          }
        } catch (fallbackError) {
          throw new Error(`Failed to load camera configuration: ${error.message}`)
        }
      }

      throw error
    }
  }

  async getCameras() {
    return this.request('/cameras')
  }
}

// Test function
async function testCameraConfigFix() {
  console.log('🧪 Testing Camera Configuration API Fix')
  console.log('=' * 50)

  const api = new TestVisionApiClient()

  try {
    // First get available cameras
    console.log('📋 Getting camera list...')
    const cameras = await api.getCameras()
    const cameraNames = Object.keys(cameras)

    if (cameraNames.length === 0) {
      console.log('❌ No cameras found')
      return
    }

    console.log(`✅ Found ${cameraNames.length} cameras: ${cameraNames.join(', ')}`)

    // Test configuration for each camera
    for (const cameraName of cameraNames) {
      console.log(`\n🎥 Testing configuration for ${cameraName}...`)

      try {
        const config = await api.getCameraConfig(cameraName)

        console.log(`✅ Configuration loaded successfully for ${cameraName}`)
        console.log(`   - auto_start_recording_enabled: ${config.auto_start_recording_enabled}`)
        console.log(`   - auto_recording_max_retries: ${config.auto_recording_max_retries}`)
        console.log(`   - auto_recording_retry_delay_seconds: ${config.auto_recording_retry_delay_seconds}`)
        console.log(`   - exposure_ms: ${config.exposure_ms}`)
        console.log(`   - gain: ${config.gain}`)

      } catch (error) {
        console.log(`❌ Configuration failed for ${cameraName}: ${error.message}`)
      }
    }

    console.log('\n🎉 Camera configuration API test completed!')

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
  }
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestVisionApiClient, testCameraConfigFix }
} else {
  // Browser environment
  window.TestVisionApiClient = TestVisionApiClient
  window.testCameraConfigFix = testCameraConfigFix
}

console.log('📝 Test script loaded. Run testCameraConfigFix() to test the fix.')
