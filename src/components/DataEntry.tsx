import { useState, useEffect } from 'react'
import { experimentManagement, repetitionManagement, userManagement, type Experiment, type ExperimentRepetition, type User } from '../lib/supabase'
import { RepetitionDataEntryInterface } from './RepetitionDataEntryInterface'

export function DataEntry() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [experimentRepetitions, setExperimentRepetitions] = useState<Record<string, ExperimentRepetition[]>>({})
  const [selectedRepetition, setSelectedRepetition] = useState<{ experiment: Experiment; repetition: ExperimentRepetition } | null>(null)
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
      setError(err.message || 'Failed to load data')
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRepetitionSelect = (experiment: Experiment, repetition: ExperimentRepetition) => {
    setSelectedRepetition({ experiment, repetition })
  }

  const handleBackToList = () => {
    setSelectedRepetition(null)
  }

  const getAllRepetitionsWithExperiments = () => {
    const allRepetitions: Array<{ experiment: Experiment; repetition: ExperimentRepetition }> = []

    experiments.forEach(experiment => {
      const repetitions = experimentRepetitions[experiment.id] || []
      repetitions.forEach(repetition => {
        allRepetitions.push({ experiment, repetition })
      })
    })

    return allRepetitions
  }

  const categorizeRepetitions = () => {
    const allRepetitions = getAllRepetitionsWithExperiments()
    const now = new Date()

    const past = allRepetitions.filter(({ repetition }) =>
      repetition.completion_status || (repetition.scheduled_date && new Date(repetition.scheduled_date) < now)
    )

    const inProgress = allRepetitions.filter(({ repetition }) =>
      !repetition.completion_status &&
      repetition.scheduled_date &&
      new Date(repetition.scheduled_date) <= now &&
      new Date(repetition.scheduled_date) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    )

    const upcoming = allRepetitions.filter(({ repetition }) =>
      !repetition.completion_status &&
      repetition.scheduled_date &&
      new Date(repetition.scheduled_date) > now
    )

    return { past, inProgress, upcoming }
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

  if (selectedRepetition) {
    return (
      <RepetitionDataEntryInterface
        experiment={selectedRepetition.experiment}
        repetition={selectedRepetition.repetition}
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
          Select a repetition to enter measurement data
        </p>
      </div>

      {/* Repetitions organized by status - flat list */}
      {(() => {
        const { past: pastRepetitions, inProgress: inProgressRepetitions, upcoming: upcomingRepetitions } = categorizeRepetitions()

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Past/Completed Repetitions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                  Past/Completed ({pastRepetitions.length})
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Completed or past scheduled repetitions
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pastRepetitions.map(({ experiment, repetition }) => (
                    <RepetitionCard
                      key={repetition.id}
                      experiment={experiment}
                      repetition={repetition}
                      onSelect={handleRepetitionSelect}
                      status="past"
                    />
                  ))}
                  {pastRepetitions.length === 0 && (
                    <p className="text-sm text-gray-500 italic text-center py-8">
                      No completed repetitions
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* In Progress Repetitions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
                  In Progress ({inProgressRepetitions.length})
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Currently scheduled or active repetitions
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {inProgressRepetitions.map(({ experiment, repetition }) => (
                    <RepetitionCard
                      key={repetition.id}
                      experiment={experiment}
                      repetition={repetition}
                      onSelect={handleRepetitionSelect}
                      status="in-progress"
                    />
                  ))}
                  {inProgressRepetitions.length === 0 && (
                    <p className="text-sm text-gray-500 italic text-center py-8">
                      No repetitions in progress
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Repetitions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></span>
                  Upcoming ({upcomingRepetitions.length})
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Future scheduled repetitions
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingRepetitions.map(({ experiment, repetition }) => (
                    <RepetitionCard
                      key={repetition.id}
                      experiment={experiment}
                      repetition={repetition}
                      onSelect={handleRepetitionSelect}
                      status="upcoming"
                    />
                  ))}
                  {upcomingRepetitions.length === 0 && (
                    <p className="text-sm text-gray-500 italic text-center py-8">
                      No upcoming repetitions
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {experiments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            No experiments available for data entry
          </div>
        </div>
      )}
    </div>
  )
}

// RepetitionCard component for displaying individual repetitions
interface RepetitionCardProps {
  experiment: Experiment
  repetition: ExperimentRepetition
  onSelect: (experiment: Experiment, repetition: ExperimentRepetition) => void
  status: 'past' | 'in-progress' | 'upcoming'
}

function RepetitionCard({ experiment, repetition, onSelect, status }: RepetitionCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'past':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      case 'in-progress':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      case 'upcoming':
        return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'past':
        return '✓'
      case 'in-progress':
        return '▶'
      case 'upcoming':
        return '⏰'
      default:
        return '○'
    }
  }

  return (
    <button
      onClick={() => onSelect(experiment, repetition)}
      className={`w-full text-left p-4 border-2 rounded-lg hover:shadow-lg transition-all duration-200 ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Large, bold experiment number */}
          <span className="text-2xl font-bold text-gray-900">
            #{experiment.experiment_number}
          </span>
          {/* Smaller repetition number */}
          <span className="text-lg font-semibold text-gray-700">
            Rep #{repetition.repetition_number}
          </span>
          <span className="text-lg">{getStatusIcon()}</span>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${repetition.schedule_status === 'scheduled'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-yellow-100 text-yellow-800'
          }`}>
          {repetition.schedule_status === 'pending schedule' ? 'Pending' : repetition.schedule_status}
        </span>
      </div>

      {/* Experiment details */}
      <div className="text-sm text-gray-600 mb-2">
        {experiment.soaking_duration_hr}h soaking • {experiment.air_drying_time_min}min drying
      </div>

      {repetition.scheduled_date && (
        <div className="text-sm text-gray-600 mb-2">
          <strong>Scheduled:</strong> {new Date(repetition.scheduled_date).toLocaleString()}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Click to enter data for this repetition
      </div>
    </button>
  )
}
