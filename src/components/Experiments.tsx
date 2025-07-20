import { useState, useEffect } from 'react'
import { ExperimentModal } from './ExperimentModal'
import { experimentManagement, userManagement } from '../lib/supabase'
import type { Experiment, User, ScheduleStatus, ResultsStatus } from '../lib/supabase'

export function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<Experiment | undefined>(undefined)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'all'>('all')

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

  const handleExperimentSaved = (experiment: Experiment) => {
    if (editingExperiment) {
      // Update existing experiment
      setExperiments(prev => prev.map(exp => exp.id === experiment.id ? experiment : exp))
    } else {
      // Add new experiment
      setExperiments(prev => [experiment, ...prev])
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

  const handleStatusUpdate = async (experiment: Experiment, scheduleStatus?: ScheduleStatus, resultsStatus?: ResultsStatus) => {
    try {
      const updatedExperiment = await experimentManagement.updateExperimentStatus(
        experiment.id,
        scheduleStatus,
        resultsStatus
      )
      setExperiments(prev => prev.map(exp => exp.id === experiment.id ? updatedExperiment : exp))
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
      console.error('Update status error:', err)
    }
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

  const filteredExperiments = filterStatus === 'all'
    ? experiments
    : experiments.filter(exp => exp.schedule_status === filterStatus)

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

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Filter by Schedule Status:
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ScheduleStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending schedule">Pending Schedule</option>
            <option value="scheduled">Scheduled</option>
            <option value="canceled">Canceled</option>
            <option value="aborted">Aborted</option>
          </select>
        </div>
      </div>

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
                  Repetitions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process Parameters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results Status
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
                    {experiment.rep_number} / {experiment.reps_required}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Soaking: {experiment.soaking_duration_hr}h</div>
                      <div>Drying: {experiment.air_drying_time_min}min</div>
                      <div>Frequency: {experiment.plate_contact_frequency_hz}Hz</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(experiment.schedule_status)}`}>
                      {experiment.schedule_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(experiment.results_status)}`}>
                      {experiment.results_status}
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
              {filterStatus === 'all'
                ? 'Get started by creating your first experiment.'
                : `No experiments with status "${filterStatus}".`}
            </p>
            {canManageExperiments && filterStatus === 'all' && (
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

      {/* Modal */}
      {showModal && (
        <ExperimentModal
          experiment={editingExperiment}
          onClose={() => setShowModal(false)}
          onExperimentSaved={handleExperimentSaved}
        />
      )}
    </div>
  )
}
