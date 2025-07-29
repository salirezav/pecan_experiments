/**
 * Auto-Recording Test Component
 * 
 * This component provides a testing interface for the auto-recording functionality.
 * It allows admins to simulate MQTT events and verify auto-recording behavior.
 */

import { useState } from 'react'
import { visionApi } from '../lib/visionApi'
import { useAuth } from '../hooks/useAuth'

interface TestEvent {
  machine: string
  state: 'on' | 'off'
  timestamp: Date
  result?: string
}

export function AutoRecordingTest() {
  const { isAdmin } = useAuth()
  const [testEvents, setTestEvents] = useState<TestEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)

  if (!isAdmin()) {
    return null
  }

  const simulateEvent = async (machine: string, state: 'on' | 'off') => {
    setIsLoading(true)

    const event: TestEvent = {
      machine,
      state,
      timestamp: new Date()
    }

    try {
      // Map machines to their corresponding cameras
      const machineToCamera: Record<string, string> = {
        'blower_separator': 'camera1',    // camera1 is for blower separator
        'vibratory_conveyor': 'camera2'   // camera2 is for conveyor
      }

      const cameraName = machineToCamera[machine]
      if (!cameraName) {
        event.result = `❌ Error: No camera mapped for machine ${machine}`
        setTestEvents(prev => [event, ...prev.slice(0, 9)])
        setIsLoading(false)
        return
      }

      if (state === 'on') {
        // Simulate starting recording on the correct camera
        const result = await visionApi.startRecording(cameraName, {
          filename: `test_auto_${machine}_${Date.now()}.avi`
        })
        event.result = result.success ? `✅ Recording started on ${cameraName}: ${result.filename}` : `❌ Failed: ${result.message}`
      } else {
        // Simulate stopping recording on the correct camera
        const result = await visionApi.stopRecording(cameraName)
        event.result = result.success ? `⏹️ Recording stopped on ${cameraName} (${result.duration_seconds}s)` : `❌ Failed: ${result.message}`
      }
    } catch (error) {
      event.result = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    setTestEvents(prev => [event, ...prev.slice(0, 9)]) // Keep last 10 events
    setIsLoading(false)
  }

  const clearEvents = () => {
    setTestEvents([])
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Auto-Recording Test</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Simulate machine state changes to test auto-recording functionality
        </p>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="space-y-4">
          {/* Test Controls */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Simulate Machine Events</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => simulateEvent('vibratory_conveyor', 'on')}
                disabled={isLoading}
                className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Conveyor ON
              </button>
              <button
                onClick={() => simulateEvent('vibratory_conveyor', 'off')}
                disabled={isLoading}
                className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Conveyor OFF
              </button>
              <button
                onClick={() => simulateEvent('blower_separator', 'on')}
                disabled={isLoading}
                className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Blower ON
              </button>
              <button
                onClick={() => simulateEvent('blower_separator', 'off')}
                disabled={isLoading}
                className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Blower OFF
              </button>
            </div>
          </div>

          {/* Clear Button */}
          {testEvents.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearEvents}
                className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700"
              >
                Clear Events
              </button>
            </div>
          )}

          {/* Test Results */}
          {testEvents.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Test Results</h4>
              <div className="space-y-2">
                {testEvents.map((event, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {event.machine.replace(/_/g, ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${event.state === 'on'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {event.state.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {event.result && (
                      <div className="mt-2 text-sm text-gray-700">
                        {event.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Testing Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Ensure auto-recording is enabled for cameras in their configuration</li>
              <li>2. Start the auto-recording manager in the Vision System page</li>
              <li>3. Click the buttons above to simulate machine state changes</li>
              <li>4. Verify that recordings start/stop automatically</li>
              <li>5. Check the storage section for auto-generated recording files</li>
            </ul>
          </div>

          {/* Expected Behavior */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Expected Behavior</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>Conveyor ON:</strong> Camera2 should start recording automatically</div>
              <div><strong>Conveyor OFF:</strong> Camera2 should stop recording automatically</div>
              <div><strong>Blower ON:</strong> Camera1 should start recording automatically</div>
              <div><strong>Blower OFF:</strong> Camera1 should stop recording automatically</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
