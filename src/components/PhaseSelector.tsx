import { useState, useEffect } from 'react'
import { dataEntryManagement, type ExperimentDataEntry, type ExperimentPhase, type ExperimentPhaseData } from '../lib/supabase'

interface PhaseSelectorProps {
  dataEntry: ExperimentDataEntry
  onPhaseSelect: (phase: ExperimentPhase) => void
}

interface PhaseInfo {
  name: ExperimentPhase
  title: string
  description: string
  icon: string
  color: string
}

const phases: PhaseInfo[] = [
  {
    name: 'pre-soaking',
    title: 'Pre-Soaking',
    description: 'Initial measurements before soaking process',
    icon: '🌰',
    color: 'bg-blue-500'
  },
  {
    name: 'air-drying',
    title: 'Air-Drying',
    description: 'Post-soak measurements and air-drying data',
    icon: '💨',
    color: 'bg-green-500'
  },
  {
    name: 'cracking',
    title: 'Cracking',
    description: 'Cracking process timing and parameters',
    icon: '🔨',
    color: 'bg-yellow-500'
  },
  {
    name: 'shelling',
    title: 'Shelling',
    description: 'Final measurements and yield data',
    icon: '📊',
    color: 'bg-purple-500'
  }
]

export function PhaseSelector({ dataEntry, onPhaseSelect }: PhaseSelectorProps) {
  const [phaseData, setPhaseData] = useState<Record<ExperimentPhase, ExperimentPhaseData | null>>({
    'pre-soaking': null,
    'air-drying': null,
    'cracking': null,
    'shelling': null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPhaseData()
  }, [dataEntry.id])

  const loadPhaseData = async () => {
    try {
      setLoading(true)
      const allPhaseData = await dataEntryManagement.getPhaseDataForEntry(dataEntry.id)

      const phaseDataMap: Record<ExperimentPhase, ExperimentPhaseData | null> = {
        'pre-soaking': null,
        'air-drying': null,
        'cracking': null,
        'shelling': null
      }

      allPhaseData.forEach(data => {
        phaseDataMap[data.phase_name] = data
      })

      setPhaseData(phaseDataMap)
    } catch (error) {
      console.error('Failed to load phase data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPhaseCompletionStatus = (phaseName: ExperimentPhase): 'empty' | 'partial' | 'complete' => {
    const data = phaseData[phaseName]
    if (!data) return 'empty'

    // Check if phase has any data
    const hasAnyData = Object.entries(data).some(([key, value]) => {
      if (['id', 'data_entry_id', 'phase_name', 'created_at', 'updated_at', 'diameter_measurements'].includes(key)) {
        return false
      }
      return value !== null && value !== undefined && value !== ''
    })

    if (!hasAnyData) return 'empty'

    // For now, consider any data as partial completion
    // You could implement more sophisticated completion logic here
    return 'partial'
  }

  const getStatusIcon = (status: 'empty' | 'partial' | 'complete') => {
    switch (status) {
      case 'empty':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white"></div>
        )
      case 'partial':
        return (
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'complete':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
    }
  }

  const getLastUpdated = (phaseName: ExperimentPhase): string | null => {
    const data = phaseData[phaseName]
    if (!data) return null
    return new Date(data.updated_at).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading phase data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Experiment Phase</h2>
        <p className="text-gray-600">
          Click on any phase card to enter or edit data for that phase
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map((phase) => {
          const status = getPhaseCompletionStatus(phase.name)
          const lastUpdated = getLastUpdated(phase.name)

          return (
            <button
              key={phase.name}
              onClick={() => onPhaseSelect(phase.name)}
              className="text-left p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg ${phase.color} flex items-center justify-center text-white text-xl mr-4`}>
                    {phase.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{phase.title}</h3>
                    <p className="text-sm text-gray-500">{phase.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {getStatusIcon(status)}
                  <span className="text-xs text-gray-400 mt-1">
                    {status === 'empty' ? 'No data' : status === 'partial' ? 'In progress' : 'Complete'}
                  </span>
                </div>
              </div>

              {lastUpdated && (
                <div className="text-xs text-gray-400">
                  Last updated: {lastUpdated}
                </div>
              )}

              <div className="mt-4 flex items-center text-blue-600">
                <span className="text-sm font-medium">
                  {status === 'empty' ? 'Start entering data' : 'Continue editing'}
                </span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>

      {/* Phase Navigation */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Phase Progress</h3>
        <div className="flex items-center space-x-4">
          {phases.map((phase, index) => {
            const status = getPhaseCompletionStatus(phase.name)
            return (
              <div key={phase.name} className="flex items-center">
                <button
                  onClick={() => onPhaseSelect(phase.name)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {getStatusIcon(status)}
                  <span className="text-sm text-gray-700">{phase.title}</span>
                </button>
                {index < phases.length - 1 && (
                  <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
