import { useState } from 'react'
import { ExperimentForm } from './ExperimentForm'
import { experimentManagement } from '../lib/supabase'
import type { Experiment, CreateExperimentRequest, UpdateExperimentRequest } from '../lib/supabase'

interface ExperimentModalProps {
  experiment?: Experiment
  onClose: () => void
  onExperimentSaved: (experiment: Experiment) => void
}

export function ExperimentModal({ experiment, onClose, onExperimentSaved }: ExperimentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!experiment

  const handleSubmit = async (data: CreateExperimentRequest | UpdateExperimentRequest) => {
    setError(null)
    setLoading(true)

    try {
      let savedExperiment: Experiment

      if (isEditing && experiment) {
        // Check if experiment number is unique (excluding current experiment)
        if ('experiment_number' in data && data.experiment_number !== undefined && data.experiment_number !== experiment.experiment_number) {
          const isUnique = await experimentManagement.isExperimentNumberUnique(data.experiment_number, experiment.id)
          if (!isUnique) {
            setError('Experiment number already exists. Please choose a different number.')
            return
          }
        }

        savedExperiment = await experimentManagement.updateExperiment(experiment.id, data)
      } else {
        // Check if experiment number is unique for new experiments
        const createData = data as CreateExperimentRequest
        const isUnique = await experimentManagement.isExperimentNumberUnique(createData.experiment_number)
        if (!isUnique) {
          setError('Experiment number already exists. Please choose a different number.')
          return
        }

        savedExperiment = await experimentManagement.createExperiment(createData)
      }

      onExperimentSaved(savedExperiment)
      onClose()
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} experiment`)
      console.error('Experiment save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 rounded-t-xl">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? `Edit Experiment #${experiment.experiment_number}` : 'Create New Experiment'}
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
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <ExperimentForm
            initialData={experiment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={isEditing}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
