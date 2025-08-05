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
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-999999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        onClick={onClose}
      />
      <div className="relative w-full rounded-2xl bg-white shadow-theme-xl dark:bg-gray-900 max-w-4xl mx-auto max-h-[90vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
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
        <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 rounded-t-2xl">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white/90">
            {isEditing ? `Edit Experiment #${experiment.experiment_number}` : 'Create New Experiment'}
          </h3>
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
