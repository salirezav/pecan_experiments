import { useState } from 'react'
import { repetitionManagement } from '../lib/supabase'
import type { Experiment, ExperimentRepetition } from '../lib/supabase'

interface RepetitionScheduleModalProps {
  experiment: Experiment
  repetition: ExperimentRepetition
  onClose: () => void
  onScheduleUpdated: (updatedRepetition: ExperimentRepetition) => void
}

export function RepetitionScheduleModal({ experiment, repetition, onClose, onScheduleUpdated }: RepetitionScheduleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize with existing scheduled date or current date/time
  const getInitialDateTime = () => {
    if (repetition.scheduled_date) {
      const date = new Date(repetition.scheduled_date)
      return {
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5)
      }
    }
    
    const now = new Date()
    // Set to next hour by default
    now.setHours(now.getHours() + 1, 0, 0, 0)
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    }
  }

  const [dateTime, setDateTime] = useState(getInitialDateTime())
  const isScheduled = repetition.scheduled_date && repetition.schedule_status === 'scheduled'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate date/time
      const selectedDateTime = new Date(`${dateTime.date}T${dateTime.time}`)
      const now = new Date()

      if (selectedDateTime <= now) {
        setError('Scheduled date and time must be in the future')
        setLoading(false)
        return
      }

      // Schedule the repetition
      const updatedRepetition = await repetitionManagement.scheduleRepetition(
        repetition.id,
        selectedDateTime.toISOString()
      )

      onScheduleUpdated(updatedRepetition)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to schedule repetition')
      console.error('Schedule repetition error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSchedule = async () => {
    if (!confirm('Are you sure you want to remove the schedule for this repetition?')) {
      return
    }

    setError(null)
    setLoading(true)

    try {
      const updatedRepetition = await repetitionManagement.removeRepetitionSchedule(repetition.id)
      onScheduleUpdated(updatedRepetition)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to remove schedule')
      console.error('Remove schedule error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Repetition
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Experiment and Repetition Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Experiment #{experiment.experiment_number} - Repetition #{repetition.repetition_number}
            </h4>
            <p className="text-sm text-gray-600">
              {experiment.reps_required} reps required • {experiment.soaking_duration_hr}h soaking
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Current Schedule (if exists) */}
          {isScheduled && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-1">Currently Scheduled</h5>
              <p className="text-sm text-blue-700">
                {new Date(repetition.scheduled_date!).toLocaleString()}
              </p>
            </div>
          )}

          {/* Schedule Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={dateTime.date}
                onChange={(e) => setDateTime({ ...dateTime, date: e.target.value })}
                className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                id="time"
                value={dateTime.time}
                onChange={(e) => setDateTime({ ...dateTime, time: e.target.value })}
                className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <div>
                {isScheduled && (
                  <button
                    type="button"
                    onClick={handleRemoveSchedule}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Remove Schedule
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Scheduling...' : (isScheduled ? 'Update Schedule' : 'Schedule Repetition')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
