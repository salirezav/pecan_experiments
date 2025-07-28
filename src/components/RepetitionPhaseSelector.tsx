import { useState, useEffect } from 'react'
import { phaseDraftManagement, type ExperimentRepetition, type ExperimentPhase, type ExperimentPhaseDraft, type User } from '../lib/supabase'

interface RepetitionPhaseSelectorProps {
  repetition: ExperimentRepetition
  currentUser: User
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

export function RepetitionPhaseSelector({ repetition, currentUser: _currentUser, onPhaseSelect }: RepetitionPhaseSelectorProps) {
  const [phaseDrafts, setPhaseDrafts] = useState<Record<ExperimentPhase, ExperimentPhaseDraft[]>>({
    'pre-soaking': [],
    'air-drying': [],
    'cracking': [],
    'shelling': []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPhaseDrafts()
  }, [repetition.id])

  const loadPhaseDrafts = async () => {
    try {
      setLoading(true)
      setError(null)

      const allDrafts = await phaseDraftManagement.getUserPhaseDraftsForRepetition(repetition.id)

      // Group drafts by phase
      const groupedDrafts: Record<ExperimentPhase, ExperimentPhaseDraft[]> = {
        'pre-soaking': [],
        'air-drying': [],
        'cracking': [],
        'shelling': []
      }

      allDrafts.forEach(draft => {
        groupedDrafts[draft.phase_name].push(draft)
      })

      setPhaseDrafts(groupedDrafts)
    } catch (err: any) {
      setError(err.message || 'Failed to load phase drafts')
      console.error('Load phase drafts error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPhaseStatus = (phase: ExperimentPhase) => {
    const drafts = phaseDrafts[phase]
    if (drafts.length === 0) return 'empty'

    const hasSubmitted = drafts.some(d => d.status === 'submitted')
    const hasDraft = drafts.some(d => d.status === 'draft')
    const hasWithdrawn = drafts.some(d => d.status === 'withdrawn')

    if (hasSubmitted) return 'submitted'
    if (hasDraft) return 'draft'
    if (hasWithdrawn) return 'withdrawn'
    return 'empty'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Submitted</span>
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
      case 'withdrawn':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Withdrawn</span>
      case 'empty':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">No Data</span>
      default:
        return null
    }
  }

  const getDraftCount = (phase: ExperimentPhase) => {
    return phaseDrafts[phase].length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading phases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Phase</h2>
        <p className="text-gray-600">
          Choose a phase to enter or view data. Each phase can have multiple drafts.
        </p>
        {repetition.is_locked && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <span className="text-red-800 text-sm font-medium">🔒 This repetition is locked by an admin</span>
            </div>
            <p className="text-red-700 text-xs mt-1">
              You can view existing data but cannot create new drafts or modify existing ones.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map((phase) => {
          const status = getPhaseStatus(phase.name)
          const draftCount = getDraftCount(phase.name)

          return (
            <div
              key={phase.name}
              onClick={() => onPhaseSelect(phase.name)}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${phase.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                    {phase.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{phase.title}</h3>
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  </div>
                </div>
                {getStatusBadge(status)}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {draftCount === 0 ? 'No drafts' : `${draftCount} draft${draftCount === 1 ? '' : 's'}`}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {draftCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {phaseDrafts[phase.name].slice(0, 3).map((draft, index) => (
                      <span
                        key={draft.id}
                        className={`px-2 py-1 text-xs rounded ${draft.status === 'submitted' ? 'bg-green-100 text-green-700' :
                            draft.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                          }`}
                      >
                        {draft.draft_name || `Draft ${index + 1}`}
                      </span>
                    ))}
                    {draftCount > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{draftCount - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
