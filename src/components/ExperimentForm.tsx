import { useState, useEffect } from 'react'
import type { CreateExperimentRequest, UpdateExperimentRequest, ScheduleStatus, ResultsStatus } from '../lib/supabase'

interface ExperimentFormProps {
  initialData?: Partial<CreateExperimentRequest & { schedule_status: ScheduleStatus; results_status: ResultsStatus }>
  onSubmit: (data: CreateExperimentRequest | UpdateExperimentRequest) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
  loading?: boolean
}

export function ExperimentForm({ initialData, onSubmit, onCancel, isEditing = false, loading = false }: ExperimentFormProps) {
  const [formData, setFormData] = useState<CreateExperimentRequest & { schedule_status: ScheduleStatus; results_status: ResultsStatus }>({
    experiment_number: initialData?.experiment_number || 0,
    reps_required: initialData?.reps_required || 1,
    soaking_duration_hr: initialData?.soaking_duration_hr || 0,
    air_drying_time_min: initialData?.air_drying_time_min || 0,
    plate_contact_frequency_hz: initialData?.plate_contact_frequency_hz || 1,
    throughput_rate_pecans_sec: initialData?.throughput_rate_pecans_sec || 1,
    crush_amount_in: initialData?.crush_amount_in || 0,
    entry_exit_height_diff_in: initialData?.entry_exit_height_diff_in || 0,
    schedule_status: initialData?.schedule_status || 'pending schedule',
    results_status: initialData?.results_status || 'valid'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required field validation
    if (!formData.experiment_number || formData.experiment_number <= 0) {
      newErrors.experiment_number = 'Experiment number must be a positive integer'
    }

    if (!formData.reps_required || formData.reps_required <= 0) {
      newErrors.reps_required = 'Repetitions required must be a positive integer'
    }





    if (formData.soaking_duration_hr < 0) {
      newErrors.soaking_duration_hr = 'Soaking duration cannot be negative'
    }

    if (formData.air_drying_time_min < 0) {
      newErrors.air_drying_time_min = 'Air drying time cannot be negative'
    }

    if (!formData.plate_contact_frequency_hz || formData.plate_contact_frequency_hz <= 0) {
      newErrors.plate_contact_frequency_hz = 'Plate contact frequency must be positive'
    }

    if (!formData.throughput_rate_pecans_sec || formData.throughput_rate_pecans_sec <= 0) {
      newErrors.throughput_rate_pecans_sec = 'Throughput rate must be positive'
    }

    if (formData.crush_amount_in < 0) {
      newErrors.crush_amount_in = 'Crush amount cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Prepare data for submission
      const submitData = isEditing ? formData : {
        experiment_number: formData.experiment_number,
        reps_required: formData.reps_required,
        soaking_duration_hr: formData.soaking_duration_hr,
        air_drying_time_min: formData.air_drying_time_min,
        plate_contact_frequency_hz: formData.plate_contact_frequency_hz,
        throughput_rate_pecans_sec: formData.throughput_rate_pecans_sec,
        crush_amount_in: formData.crush_amount_in,
        entry_exit_height_diff_in: formData.entry_exit_height_diff_in,
        schedule_status: formData.schedule_status,
        results_status: formData.results_status
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="experiment_number" className="block text-sm font-medium text-gray-700 mb-2">
            Experiment Number *
          </label>
          <input
            type="number"
            id="experiment_number"
            value={formData.experiment_number}
            onChange={(e) => handleInputChange('experiment_number', parseInt(e.target.value) || 0)}
            className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.experiment_number ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Enter unique experiment number"
            min="1"
            step="1"
            required
          />
          {errors.experiment_number && (
            <p className="mt-1 text-sm text-red-600">{errors.experiment_number}</p>
          )}
        </div>

        <div>
          <label htmlFor="reps_required" className="block text-sm font-medium text-gray-700 mb-2">
            Repetitions Required *
          </label>
          <input
            type="number"
            id="reps_required"
            value={formData.reps_required}
            onChange={(e) => handleInputChange('reps_required', parseInt(e.target.value) || 1)}
            className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.reps_required ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Total repetitions needed"
            min="1"
            step="1"
            required
          />
          {errors.reps_required && (
            <p className="mt-1 text-sm text-red-600">{errors.reps_required}</p>
          )}
        </div>


      </div>

      {/* Experiment Parameters */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Experiment Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="soaking_duration_hr" className="block text-sm font-medium text-gray-700 mb-2">
              Soaking Duration (hours) *
            </label>
            <input
              type="number"
              id="soaking_duration_hr"
              value={formData.soaking_duration_hr}
              onChange={(e) => handleInputChange('soaking_duration_hr', parseFloat(e.target.value) || 0)}
              className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.soaking_duration_hr ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="0.0"
              min="0"
              step="0.1"
              required
            />
            {errors.soaking_duration_hr && (
              <p className="mt-1 text-sm text-red-600">{errors.soaking_duration_hr}</p>
            )}
          </div>

          <div>
            <label htmlFor="air_drying_time_min" className="block text-sm font-medium text-gray-700 mb-2">
              Air Drying Time (minutes) *
            </label>
            <input
              type="number"
              id="air_drying_time_min"
              value={formData.air_drying_time_min}
              onChange={(e) => handleInputChange('air_drying_time_min', parseInt(e.target.value) || 0)}
              className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.air_drying_time_min ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="0"
              min="0"
              step="1"
              required
            />
            {errors.air_drying_time_min && (
              <p className="mt-1 text-sm text-red-600">{errors.air_drying_time_min}</p>
            )}
          </div>

          <div>
            <label htmlFor="plate_contact_frequency_hz" className="block text-sm font-medium text-gray-700 mb-2">
              Plate Contact Frequency (Hz) *
            </label>
            <input
              type="number"
              id="plate_contact_frequency_hz"
              value={formData.plate_contact_frequency_hz}
              onChange={(e) => handleInputChange('plate_contact_frequency_hz', parseFloat(e.target.value) || 1)}
              className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.plate_contact_frequency_hz ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="1.0"
              min="0.1"
              step="0.1"
              required
            />
            {errors.plate_contact_frequency_hz && (
              <p className="mt-1 text-sm text-red-600">{errors.plate_contact_frequency_hz}</p>
            )}
          </div>

          <div>
            <label htmlFor="throughput_rate_pecans_sec" className="block text-sm font-medium text-gray-700 mb-2">
              Throughput Rate (pecans/sec) *
            </label>
            <input
              type="number"
              id="throughput_rate_pecans_sec"
              value={formData.throughput_rate_pecans_sec}
              onChange={(e) => handleInputChange('throughput_rate_pecans_sec', parseFloat(e.target.value) || 1)}
              className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.throughput_rate_pecans_sec ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="1.0"
              min="0.1"
              step="0.1"
              required
            />
            {errors.throughput_rate_pecans_sec && (
              <p className="mt-1 text-sm text-red-600">{errors.throughput_rate_pecans_sec}</p>
            )}
          </div>

          <div>
            <label htmlFor="crush_amount_in" className="block text-sm font-medium text-gray-700 mb-2">
              Crush Amount (thousandths of inch) *
            </label>
            <input
              type="number"
              id="crush_amount_in"
              value={formData.crush_amount_in}
              onChange={(e) => handleInputChange('crush_amount_in', parseFloat(e.target.value) || 0)}
              className={`max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.crush_amount_in ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="0.0"
              min="0"
              step="0.001"
              required
            />
            {errors.crush_amount_in && (
              <p className="mt-1 text-sm text-red-600">{errors.crush_amount_in}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="entry_exit_height_diff_in" className="block text-sm font-medium text-gray-700 mb-2">
              Entry/Exit Height Difference (inches) *
            </label>
            <input
              type="number"
              id="entry_exit_height_diff_in"
              value={formData.entry_exit_height_diff_in}
              onChange={(e) => handleInputChange('entry_exit_height_diff_in', parseFloat(e.target.value) || 0)}
              className={`max-w-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${errors.entry_exit_height_diff_in ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="0.0 (can be negative)"
              step="0.1"
              required
            />
            {errors.entry_exit_height_diff_in && (
              <p className="mt-1 text-sm text-red-600">{errors.entry_exit_height_diff_in}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">Positive values indicate entry is higher than exit</p>
          </div>
        </div>
      </div>

      {/* Status Fields (only show when editing) */}
      {isEditing && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="schedule_status" className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Status
              </label>
              <select
                id="schedule_status"
                value={formData.schedule_status}
                onChange={(e) => handleInputChange('schedule_status', e.target.value as ScheduleStatus)}
                className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="pending schedule">Pending Schedule</option>
                <option value="scheduled">Scheduled</option>
                <option value="canceled">Canceled</option>
                <option value="aborted">Aborted</option>
              </select>
            </div>

            <div>
              <label htmlFor="results_status" className="block text-sm font-medium text-gray-700 mb-2">
                Results Status
              </label>
              <select
                id="results_status"
                value={formData.results_status}
                onChange={(e) => handleInputChange('results_status', e.target.value as ResultsStatus)}
                className="max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="valid">Valid</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Experiment' : 'Create Experiment')}
        </button>
      </div>
    </form>
  )
}
