import { useState, useEffect } from 'react'
import { phaseDraftManagement, type ExperimentPhaseDraft, type ExperimentPhase, type User, type ExperimentRepetition } from '../lib/supabase'

interface PhaseDraftManagerProps {
  repetition: ExperimentRepetition
  phase: ExperimentPhase
  currentUser: User
  onSelectDraft: (draft: ExperimentPhaseDraft) => void
  onClose: () => void
}

export function PhaseDraftManager({ repetition, phase, currentUser, onSelectDraft, onClose }: PhaseDraftManagerProps) {
  const [drafts, setDrafts] = useState<ExperimentPhaseDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newDraftName, setNewDraftName] = useState('')

  useEffect(() => {
    loadDrafts()
  }, [repetition.id, phase])

  const loadDrafts = async () => {
    try {
      setLoading(true)
      setError(null)
      const userDrafts = await phaseDraftManagement.getUserPhaseDraftsForPhase(repetition.id, phase)
      setDrafts(userDrafts)
    } catch (err: any) {
      setError(err.message || 'Failed to load drafts')
      console.error('Load drafts error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDraft = async () => {
    try {
      setCreating(true)
      setError(null)

      const newDraft = await phaseDraftManagement.createPhaseDraft({
        experiment_id: repetition.experiment_id,
        repetition_id: repetition.id,
        phase_name: phase,
        draft_name: newDraftName || undefined,
        status: 'draft'
      })

      setDrafts(prev => [newDraft, ...prev])
      setNewDraftName('')
      onSelectDraft(newDraft)
    } catch (err: any) {
      setError(err.message || 'Failed to create draft')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return
    }

    try {
      await phaseDraftManagement.deletePhaseDraft(draftId)
      setDrafts(prev => prev.filter(draft => draft.id !== draftId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete draft')
    }
  }

  const handleSubmitDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to submit this draft? Once submitted, it can only be withdrawn by you or locked by an admin.')) {
      return
    }

    try {
      const submittedDraft = await phaseDraftManagement.submitPhaseDraft(draftId)
      setDrafts(prev => prev.map(draft =>
        draft.id === draftId ? submittedDraft : draft
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to submit draft')
    }
  }

  const handleWithdrawDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to withdraw this submitted draft? It will be marked as withdrawn.')) {
      return
    }

    try {
      const withdrawnDraft = await phaseDraftManagement.withdrawPhaseDraft(draftId)
      setDrafts(prev => prev.map(draft =>
        draft.id === draftId ? withdrawnDraft : draft
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw draft')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Submitted</span>
      case 'withdrawn':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Withdrawn</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
    }
  }

  const canDeleteDraft = (draft: ExperimentPhaseDraft) => {
    return draft.status === 'draft' && (!repetition.is_locked || currentUser.roles.includes('admin'))
  }

  const canSubmitDraft = (draft: ExperimentPhaseDraft) => {
    return draft.status === 'draft' && (!repetition.is_locked || currentUser.roles.includes('admin'))
  }

  const canWithdrawDraft = (draft: ExperimentPhaseDraft) => {
    return draft.status === 'submitted' && (!repetition.is_locked || currentUser.roles.includes('admin'))
  }

  const canCreateDraft = () => {
    return !repetition.is_locked || currentUser.roles.includes('admin')
  }

  const formatPhaseTitle = (phase: string) => {
    return phase.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {formatPhaseTitle(phase)} Phase Drafts
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Repetition {repetition.repetition_number}
              {repetition.is_locked && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  🔒 Locked
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Create New Draft */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Create New Draft</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Draft name (optional)"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={creating || repetition.is_locked}
              />
              <button
                onClick={handleCreateDraft}
                disabled={creating || !canCreateDraft()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create Draft'}
              </button>
            </div>
            {repetition.is_locked && !currentUser.roles.includes('admin') && (
              <p className="text-xs text-red-600 mt-2">
                Cannot create new drafts: repetition is locked by admin
              </p>
            )}
          </div>

          {/* Drafts List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading drafts...</div>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No drafts found for this phase</div>
                <p className="text-sm text-gray-400 mt-1">Create a new draft to get started</p>
              </div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {draft.draft_name || `Draft ${draft.id.slice(-8)}`}
                        </h4>
                        {getStatusBadge(draft.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Created: {new Date(draft.created_at).toLocaleString()}</p>
                        <p>Updated: {new Date(draft.updated_at).toLocaleString()}</p>
                        {draft.submitted_at && (
                          <p>Submitted: {new Date(draft.submitted_at).toLocaleString()}</p>
                        )}
                        {draft.withdrawn_at && (
                          <p>Withdrawn: {new Date(draft.withdrawn_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectDraft(draft)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {draft.status === 'draft' ? 'Edit' : 'View'}
                      </button>

                      {canSubmitDraft(draft) && (
                        <button
                          onClick={() => handleSubmitDraft(draft.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Submit
                        </button>
                      )}

                      {canWithdrawDraft(draft) && (
                        <button
                          onClick={() => handleWithdrawDraft(draft.id)}
                          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          Withdraw
                        </button>
                      )}

                      {canDeleteDraft(draft) && (
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
