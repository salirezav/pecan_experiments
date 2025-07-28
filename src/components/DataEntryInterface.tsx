import { useState, useEffect } from 'react'
import { type Experiment, type User, type ExperimentPhase } from '../lib/supabase'
import { DraftManager } from './DraftManager'
import { PhaseSelector } from './PhaseSelector'

// DEPRECATED: This component is deprecated in favor of RepetitionDataEntryInterface
// which uses the new phase-specific draft system

interface DataEntryInterfaceProps {
  experiment: Experiment
  currentUser: User
  onBack: () => void
}

// Temporary type for backward compatibility
interface LegacyDataEntry {
  id: string
  experiment_id: string
  user_id: string
  status: 'draft' | 'submitted'
  entry_name?: string | null
  created_at: string
  updated_at: string
  submitted_at?: string | null
}

export function DataEntryInterface({ experiment, currentUser, onBack }: DataEntryInterfaceProps) {
  const [userDataEntries, setUserDataEntries] = useState<LegacyDataEntry[]>([])
  const [selectedDataEntry, setSelectedDataEntry] = useState<LegacyDataEntry | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<ExperimentPhase | null>(null)
  const [showDraftManager, setShowDraftManager] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserDataEntries()
  }, [experiment.id, currentUser.id])

  const loadUserDataEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      // DEPRECATED: Using empty array since this component is deprecated
      const entries: LegacyDataEntry[] = []
      setUserDataEntries(entries)

      // Auto-select the most recent draft or create a new one
      const drafts = entries.filter(entry => entry.status === 'draft')
      if (drafts.length > 0) {
        setSelectedDataEntry(drafts[0])
      } else {
        // Create a new draft entry
        await handleCreateNewDraft()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data entries')
      console.error('Load data entries error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewDraft = async () => {
    setError('This component is deprecated. Please use the new repetition-based data entry system.')
  }

  const handleSelectDataEntry = (entry: LegacyDataEntry) => {
    setSelectedDataEntry(entry)
    setShowDraftManager(false)
    setSelectedPhase(null)
  }

  const handleDeleteDraft = async (_entryId: string) => {
    setError('This component is deprecated. Please use the new repetition-based data entry system.')
  }

  const handleSubmitEntry = async (_entryId: string) => {
    setError('This component is deprecated. Please use the new repetition-based data entry system.')
  }

  const handlePhaseSelect = (phase: ExperimentPhase) => {
    setSelectedPhase(phase)
  }

  const handleBackToPhases = () => {
    setSelectedPhase(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data entries...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Experiments
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Experiments
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Experiment #{experiment.experiment_number}
            </h1>
          </div>
          <div className="text-right">
            <button
              onClick={() => setShowDraftManager(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
            >
              Manage Drafts
            </button>
            <button
              onClick={handleCreateNewDraft}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              New Draft
            </button>
          </div>
        </div>

        {/* Experiment Details */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Repetitions:</span>
              <span className="ml-1 text-gray-900">{experiment.reps_required}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Soaking Duration:</span>
              <span className="ml-1 text-gray-900">{experiment.soaking_duration_hr}h</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Air Drying:</span>
              <span className="ml-1 text-gray-900">{experiment.air_drying_time_min}min</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`ml-1 ${experiment.completion_status ? 'text-green-600' : 'text-yellow-600'}`}>
                {experiment.completion_status ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
          {/* Scheduled date removed - this is now handled at repetition level */}
        </div>

        {/* Current Draft Info */}
        {selectedDataEntry && (
          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-blue-700">Current Draft:</span>
                <span className="ml-2 text-blue-900">{selectedDataEntry.entry_name}</span>
                <span className="ml-2 text-sm text-blue-600">
                  Created: {new Date(selectedDataEntry.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleSubmitEntry(selectedDataEntry.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Submit Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {showDraftManager ? (
        <DraftManager
          userDataEntries={userDataEntries}
          selectedDataEntry={selectedDataEntry}
          onSelectEntry={handleSelectDataEntry}
          onDeleteDraft={handleDeleteDraft}
          onCreateNew={handleCreateNewDraft}
          onClose={() => setShowDraftManager(false)}
        />
      ) : selectedPhase ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">
            This component is deprecated. Please use the new repetition-based data entry system.
          </div>
        </div>
      ) : selectedDataEntry ? (
        <PhaseSelector
          dataEntry={selectedDataEntry}
          onPhaseSelect={handlePhaseSelect}
        />
      ) : (
        <div className="text-center text-gray-500">
          No data entry selected. Please create a new draft or select an existing one.
        </div>
      )}
    </div>
  )
}
