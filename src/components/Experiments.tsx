import { useState, useEffect } from 'react'
import { ExperimentModal } from './ExperimentModal'
import { RepetitionScheduleModal } from './RepetitionScheduleModal'
import { experimentManagement, repetitionManagement, userManagement } from '../lib/supabase'
import type { Experiment, ExperimentRepetition, User, ScheduleStatus, ResultsStatus } from '../lib/supabase'

export function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [experimentRepetitions, setExperimentRepetitions] = useState<Record<string, ExperimentRepetition[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<Experiment | undefined>(undefined)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [showRepetitionScheduleModal, setShowRepetitionScheduleModal] = useState(false)
  const [schedulingRepetition, setSchedulingRepetition] = useState<{ experiment: Experiment; repetition: ExperimentRepetition } | undefined>(undefined)

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

      // Load repetitions for each experiment
      const repetitionsMap: Record<string, ExperimentRepetition[]> = {}
      for (const experiment of experimentsData) {
        try {
          const repetitions = await repetitionManagement.getExperimentRepetitions(experiment.id)
          repetitionsMap[experiment.id] = repetitions
        } catch (err) {
          console.error(`Failed to load repetitions for experiment ${experiment.id}:`, err)
          repetitionsMap[experiment.id] = []
        }
      }
      setExperimentRepetitions(repetitionsMap)
    } catch (err: any) {
      setError(err.message || 'Failed to load experiments')
      console.error('Load experiments error:', err)
    } finally {
      setLoading(false)
    }
  }

  const canManageExperiments = currentUser?.roles.includes('admin') || currentUser?.roles.includes('conductor')

  const handleCreateExperiment = () => {
    setEditingExperiment(undefined)
    setShowModal(true)
  }

  const handleEditExperiment = (experiment: Experiment) => {
    setEditingExperiment(experiment)
    setShowModal(true)
  }

  const handleExperimentSaved = async (experiment: Experiment) => {
    if (editingExperiment) {
      // Update existing experiment
      setExperiments(prev => prev.map(exp => exp.id === experiment.id ? experiment : exp))
    } else {
      // Add new experiment and create all its repetitions
      setExperiments(prev => [experiment, ...prev])

      try {
        // Create all repetitions for the new experiment
        const repetitions = await repetitionManagement.createAllRepetitions(experiment.id)
        setExperimentRepetitions(prev => ({
          ...prev,
          [experiment.id]: repetitions
        }))
      } catch (err) {
        console.error('Failed to create repetitions:', err)
      }
    }
    setShowModal(false)
    setEditingExperiment(undefined)
  }

  const handleScheduleRepetition = (experiment: Experiment, repetition: ExperimentRepetition) => {
    setSchedulingRepetition({ experiment, repetition })
    setShowRepetitionScheduleModal(true)
  }

  const handleRepetitionScheduleUpdated = (updatedRepetition: ExperimentRepetition) => {
    setExperimentRepetitions(prev => ({
      ...prev,
      [updatedRepetition.experiment_id]: prev[updatedRepetition.experiment_id]?.map(rep =>
        rep.id === updatedRepetition.id ? updatedRepetition : rep
      ) || []
    }))
    setShowRepetitionScheduleModal(false)
    setSchedulingRepetition(undefined)
  }

  const handleCreateRepetition = async (experiment: Experiment, repetitionNumber: number) => {
    try {
      const newRepetition = await repetitionManagement.createRepetition({
        experiment_id: experiment.id,
        repetition_number: repetitionNumber,
        schedule_status: 'pending schedule'
      })

      setExperimentRepetitions(prev => ({
        ...prev,
        [experiment.id]: [...(prev[experiment.id] || []), newRepetition].sort((a, b) => a.repetition_number - b.repetition_number)
      }))
    } catch (err: any) {
      setError(err.message || 'Failed to create repetition')
    }
  }

  const handleDeleteExperiment = async (experiment: Experiment) => {
    if (!currentUser?.roles.includes('admin')) {
      alert('Only administrators can delete experiments.')
      return
    }

    if (!confirm(`Are you sure you want to delete Experiment #${experiment.experiment_number}? This action cannot be undone.`)) {
      return
    }

    try {
      await experimentManagement.deleteExperiment(experiment.id)
      setExperiments(prev => prev.filter(exp => exp.id !== experiment.id))
    } catch (err: any) {
      alert(`Failed to delete experiment: ${err.message}`)
      console.error('Delete experiment error:', err)
    }
  }

  const getRepetitionStatusSummary = (repetitions: ExperimentRepetition[]) => {
    const scheduled = repetitions.filter(r => r.schedule_status === 'scheduled').length
    const pending = repetitions.filter(r => r.schedule_status === 'pending schedule').length
    const completed = repetitions.filter(r => r.completion_status).length

    return { scheduled, pending, completed, total: repetitions.length }
  }

  const getStatusBadgeColor = (status: ScheduleStatus | ResultsStatus) => {
    switch (status) {
      case 'pending schedule':
        return 'bg-yellow-100 text-yellow-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'aborted':
        return 'bg-red-100 text-red-800'
      case 'valid':
        return 'bg-green-100 text-green-800'
      case 'invalid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Remove filtering for now since experiments don't have schedule_status anymore
  const filteredExperiments = experiments

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Experiments</h1>
            <p className="mt-2 text-gray-600">Manage pecan processing experiment definitions</p>
            <p className="mt-2 text-gray-600">This is where you define the blueprint of an experiment with the required configurations and parameters, as well as the number of repetitions needed for that experiment.</p>
          </div>
          {canManageExperiments && (
            <button
              onClick={handleCreateExperiment}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ➕ New Experiment
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}



      {/* Experiments Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Experiments ({filteredExperiments.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {canManageExperiments ? 'Click on any experiment to edit details' : 'View experiment definitions and status'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experiment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reps Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experiment Parameters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repetitions Status
                </th>
                {canManageExperiments && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manage Repetitions
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                {canManageExperiments && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExperiments.map((experiment) => (
                <tr
                  key={experiment.id}
                  className={canManageExperiments ? "hover:bg-gray-50 cursor-pointer" : ""}
                  onClick={canManageExperiments ? () => handleEditExperiment(experiment) : undefined}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{experiment.experiment_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {experiment.reps_required}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Soaking: {experiment.soaking_duration_hr}h</div>
                      <div>Drying: {experiment.air_drying_time_min}min</div>
                      <div>Frequency: {experiment.plate_contact_frequency_hz}Hz</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const repetitions = experimentRepetitions[experiment.id] || []
                      const summary = getRepetitionStatusSummary(repetitions)
                      return (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600">
                            {summary.total} total • {summary.scheduled} scheduled • {summary.pending} pending
                          </div>
                          <div className="flex space-x-1">
                            {summary.scheduled > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {summary.scheduled} scheduled
                              </span>
                            )}
                            {summary.pending > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {summary.pending} pending
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  {canManageExperiments && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-2">
                        {(() => {
                          const repetitions = experimentRepetitions[experiment.id] || []
                          return repetitions.map((repetition) => (
                            <div key={repetition.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">Rep #{repetition.repetition_number}</span>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(repetition.schedule_status)}`}>
                                  {repetition.schedule_status === 'pending schedule' ? 'Pending' : repetition.schedule_status}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleScheduleRepetition(experiment, repetition)
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title={repetition.schedule_status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        })()}
                        {(() => {
                          const repetitions = experimentRepetitions[experiment.id] || []
                          const missingReps = experiment.reps_required - repetitions.length
                          if (missingReps > 0) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCreateRepetition(experiment, repetitions.length + 1)
                                }}
                                className="w-full text-sm text-blue-600 hover:text-blue-900 py-1 px-2 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                              >
                                + Add Rep #{repetitions.length + 1}
                              </button>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(experiment.results_status)}`}>
                      {experiment.results_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${experiment.completion_status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {experiment.completion_status ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(experiment.created_at).toLocaleDateString()}
                  </td>
                  {canManageExperiments && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditExperiment(experiment)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {currentUser?.roles.includes('admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteExperiment(experiment)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExperiments.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No experiments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first experiment.
            </p>
            {canManageExperiments && (
              <div className="mt-6">
                <button
                  onClick={handleCreateExperiment}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ➕ Create First Experiment
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experiment Modal */}
      {showModal && (
        <ExperimentModal
          experiment={editingExperiment}
          onClose={() => setShowModal(false)}
          onExperimentSaved={handleExperimentSaved}
        />
      )}

      {/* Repetition Schedule Modal */}
      {showRepetitionScheduleModal && schedulingRepetition && (
        <RepetitionScheduleModal
          experiment={schedulingRepetition.experiment}
          repetition={schedulingRepetition.repetition}
          onClose={() => setShowRepetitionScheduleModal(false)}
          onScheduleUpdated={handleRepetitionScheduleUpdated}
        />
      )}
    </div>
  )
}
