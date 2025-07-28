// Simple test file to verify vision API client functionality
// This is not a formal test suite, just a manual verification script

import { visionApi, formatBytes, formatDuration, formatUptime } from '../lib/visionApi'

// Test utility functions
console.log('Testing utility functions:')
console.log('formatBytes(1024):', formatBytes(1024)) // Should be "1 KB"
console.log('formatBytes(1048576):', formatBytes(1048576)) // Should be "1 MB"
console.log('formatDuration(65):', formatDuration(65)) // Should be "1m 5s"
console.log('formatUptime(3661):', formatUptime(3661)) // Should be "1h 1m"

// Test API endpoints (these will fail if vision system is not running)
export async function testVisionApi() {
  try {
    console.log('Testing vision API endpoints...')
    
    // Test health endpoint
    const health = await visionApi.getHealth()
    console.log('Health check:', health)
    
    // Test system status
    const status = await visionApi.getSystemStatus()
    console.log('System status:', status)
    
    // Test cameras
    const cameras = await visionApi.getCameras()
    console.log('Cameras:', cameras)
    
    // Test machines
    const machines = await visionApi.getMachines()
    console.log('Machines:', machines)
    
    // Test storage stats
    const storage = await visionApi.getStorageStats()
    console.log('Storage stats:', storage)
    
    // Test recordings
    const recordings = await visionApi.getRecordings()
    console.log('Recordings:', recordings)
    
    console.log('All API tests passed!')
    return true
  } catch (error) {
    console.error('API test failed:', error)
    return false
  }
}

// Uncomment the line below to run the test when this file is imported
// testVisionApi()
