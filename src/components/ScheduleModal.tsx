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
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-999999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        onClick={onClose}
      />
      <div className="relative w-full rounded-2xl bg-white shadow-theme-xl dark:bg-gray-900 max-w-md mx-auto p-4" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white/90">
            {isScheduled ? 'Update Schedule' : 'Schedule Experiment'}
          </h3>
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
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <div className="relative max-w-xs">
                <input
                  type="date"
                  id="date"
                  value={dateTime.date}
                  onChange={(e) => setDateTime({ ...dateTime, date: e.target.value })}
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                  required
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time *
              </label>
              <div className="relative max-w-xs">
                <input
                  type="time"
                  id="time"
                  value={dateTime.time}
                  onChange={(e) => setDateTime({ ...dateTime, time: e.target.value })}
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                  required
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <div>
                {isScheduled && (
                  <button
                    type="button"
                    onClick={handleRemoveSchedule}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-500 dark:hover:bg-error-500/15 rounded-lg transition-colors disabled:opacity-50"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-500/10 rounded-lg transition-colors disabled:opacity-50"
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
