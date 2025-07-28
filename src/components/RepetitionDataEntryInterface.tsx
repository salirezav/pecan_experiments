import { useState, useEffect } from 'react'
import { type Experiment, type ExperimentRepetition, type User, type ExperimentPhase } from '../lib/supabase'
import { RepetitionPhaseSelector } from './RepetitionPhaseSelector'
import { PhaseDataEntry } from './PhaseDataEntry'
import { RepetitionLockManager } from './RepetitionLockManager'

interface RepetitionDataEntryInterfaceProps {
  experiment: Experiment
  repetition: ExperimentRepetition
  currentUser: User
  onBack: () => void
}

export function RepetitionDataEntryInterface({ experiment, repetition, currentUser, onBack }: RepetitionDataEntryInterfaceProps) {
  const [selectedPhase, setSelectedPhase] = useState<ExperimentPhase | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentRepetition, setCurrentRepetition] = useState<ExperimentRepetition>(repetition)

  useEffect(() => {
    // Skip loading old data entries - go directly to phase selection
    setLoading(false)
  }, [repetition.id, currentUser.id])



  const handlePhaseSelect = (phase: ExperimentPhase) => {
    setSelectedPhase(phase)
  }

  const handleBackToPhases = () => {
    setSelectedPhase(null)
  }

  const handleRepetitionUpdated = (updatedRepetition: ExperimentRepetition) => {
    setCurrentRepetition(updatedRepetition)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Repetitions</span>
              </button>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Experiment #{experiment.experiment_number} - Repetition #{repetition.repetition_number}
              </h1>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <div>Soaking: {experiment.soaking_duration_hr}h • Air Drying: {experiment.air_drying_time_min}min</div>
                <div>Frequency: {experiment.plate_contact_frequency_hz}Hz • Throughput: {experiment.throughput_rate_pecans_sec}/sec</div>
                {repetition.scheduled_date && (
                  <div>Scheduled: {new Date(repetition.scheduled_date).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>

          {/* No additional controls needed - phase-specific draft management is handled within each phase */}
        </div>
      </div>

      {/* Admin Controls */}
      <RepetitionLockManager
        repetition={currentRepetition}
        currentUser={currentUser}
        onRepetitionUpdated={handleRepetitionUpdated}
      />

      {/* Main Content */}
      {selectedPhase ? (
        <PhaseDataEntry
          experiment={experiment}
          repetition={currentRepetition}
          phase={selectedPhase}
          currentUser={currentUser}
          onBack={handleBackToPhases}
          onDataSaved={() => {
            // Data is automatically saved in the new phase-specific system
          }}
        />
      ) : (
        <RepetitionPhaseSelector
          repetition={currentRepetition}
          currentUser={currentUser}
          onPhaseSelect={handlePhaseSelect}
        />
      )}
    </div>
  )
}
