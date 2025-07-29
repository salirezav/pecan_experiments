/**
 * React hook for managing auto-recording functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { autoRecordingManager, type AutoRecordingState } from '../lib/autoRecordingManager'

export interface UseAutoRecordingResult {
  isRunning: boolean
  states: AutoRecordingState[]
  error: string | null
  start: () => Promise<void>
  stop: () => void
  refresh: () => Promise<void>
}

export function useAutoRecording(): UseAutoRecordingResult {
  const [isRunning, setIsRunning] = useState(false)
  const [states, setStates] = useState<AutoRecordingState[]>([])
  const [error, setError] = useState<string | null>(null)

  // Update states periodically
  useEffect(() => {
    if (!isRunning) {
      return
    }

    const interval = setInterval(() => {
      setStates(autoRecordingManager.getStates())
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const start = useCallback(async () => {
    try {
      setError(null)
      await autoRecordingManager.start()
      setIsRunning(true)
      setStates(autoRecordingManager.getStates())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start auto-recording'
      setError(errorMessage)
      console.error('Failed to start auto-recording:', err)
    }
  }, [])

  const stop = useCallback(() => {
    try {
      autoRecordingManager.stop()
      setIsRunning(false)
      setStates([])
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop auto-recording'
      setError(errorMessage)
      console.error('Failed to stop auto-recording:', err)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      await autoRecordingManager.refreshConfigurations()
      setStates(autoRecordingManager.getStates())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh configurations'
      setError(errorMessage)
      console.error('Failed to refresh auto-recording configurations:', err)
    }
  }, [])

  return {
    isRunning,
    states,
    error,
    start,
    stop,
    refresh
  }
}
