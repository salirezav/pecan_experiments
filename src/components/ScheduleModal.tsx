import { useState } from 'react'
import { experimentManagement } from '../lib/supabase'
import type { Experiment } from '../lib/supabase'

interface ScheduleModalProps {
  experiment: Experiment
  onClose: () => void
  onScheduleUpdated: (experiment: Experiment) => void
}

export function ScheduleModal({ experiment, onClose, onScheduleUpdated }: ScheduleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize with existing scheduled date or current date/time
  const getInitialDateTime = () => {
    if (experiment.scheduled_date) {
      const date = new Date(experiment.scheduled_date)
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

  const isScheduled = !!experiment.scheduled_date

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

      // Schedule the experiment
      const updatedExperiment = await experimentManagement.scheduleExperiment(
        experiment.id,
        selectedDateTime.toISOString()
      )

      onScheduleUpdated(updatedExperiment)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to schedule experiment')
      console.error('Schedule experiment error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSchedule = async () => {
    if (!confirm('Are you sure you want to remove the schedule for this experiment?')) {
      return
    }

    setError(null)
    setLoading(true)

    try {
      const updatedExperiment = await experimentManagement.removeExperimentSchedule(experiment.id)
      onScheduleUpdated(updatedExperiment)
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
    <div className="fixed inset-0 bg-black bg-opacity-25 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {isScheduled ? 'Update Schedule' : 'Schedule Experiment'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Experiment Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Experiment #{experiment.experiment_number}</h4>
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
                {new Date(experiment.scheduled_date!).toLocaleString()}
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (isScheduled ? 'Update Schedule' : 'Schedule Experiment')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
