import { useState, useEffect } from 'react'
import { experimentManagement, userManagement, type Experiment, type User } from '../lib/supabase'
import { DataEntryInterface } from './DataEntryInterface'

export function DataEntry() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [experimentsData, userData] = await Promise.all([
        experimentManagement.getAllExperiments(),
        userManagement.getCurrentUser()
      ])

      setExperiments(experimentsData)
      setCurrentUser(userData)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExperimentSelect = (experiment: Experiment) => {
    setSelectedExperiment(experiment)
  }

  const handleBackToList = () => {
    setSelectedExperiment(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading experiments...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    )
  }

  if (selectedExperiment) {
    return (
      <DataEntryInterface
        experiment={selectedExperiment}
        currentUser={currentUser!}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Entry</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select an experiment to enter measurement data
        </p>
      </div>

      {/* Experiments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Available Experiments ({experiments.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Click on any experiment to start entering data
          </p>
        </div>

        {experiments.length === 0 ? (
          <div className="px-4 py-5 sm:px-6">
            <div className="text-center text-gray-500">
              No experiments available for data entry
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {experiments.map((experiment) => (
              <li key={experiment.id}>
                <button
                  onClick={() => handleExperimentSelect(experiment)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          Experiment #{experiment.experiment_number}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${experiment.completion_status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {experiment.completion_status ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>Reps: {experiment.reps_required}</div>
                          <div>Soaking: {experiment.soaking_duration_hr}h</div>
                          <div>Drying: {experiment.air_drying_time_min}min</div>
                          <div>Status: {experiment.schedule_status}</div>
                        </div>
                        {experiment.scheduled_date && (
                          <div className="mt-1 text-xs text-gray-400">
                            Scheduled: {new Date(experiment.scheduled_date).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
