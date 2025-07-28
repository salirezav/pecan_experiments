import { useState } from 'react'
import { repetitionManagement, type ExperimentRepetition, type User } from '../lib/supabase'

interface RepetitionLockManagerProps {
  repetition: ExperimentRepetition
  currentUser: User
  onRepetitionUpdated: (updatedRepetition: ExperimentRepetition) => void
}

export function RepetitionLockManager({ repetition, currentUser, onRepetitionUpdated }: RepetitionLockManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = currentUser.roles.includes('admin')

  const handleLockRepetition = async () => {
    if (!confirm('Are you sure you want to lock this repetition? This will prevent users from modifying or withdrawing any submitted drafts.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const updatedRepetition = await repetitionManagement.lockRepetition(repetition.id)
      onRepetitionUpdated(updatedRepetition)
    } catch (err: any) {
      setError(err.message || 'Failed to lock repetition')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockRepetition = async () => {
    if (!confirm('Are you sure you want to unlock this repetition? This will allow users to modify and withdraw submitted drafts again.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const updatedRepetition = await repetitionManagement.unlockRepetition(repetition.id)
      onRepetitionUpdated(updatedRepetition)
    } catch (err: any) {
      setError(err.message || 'Failed to unlock repetition')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Admin Controls</h3>
      
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Repetition Status:</span>
            {repetition.is_locked ? (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                🔒 Locked
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                🔓 Unlocked
              </span>
            )}
          </div>
          
          {repetition.is_locked && repetition.locked_at && (
            <div className="mt-1 text-xs text-gray-500">
              Locked: {new Date(repetition.locked_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {repetition.is_locked ? (
            <button
              onClick={handleUnlockRepetition}
              disabled={loading}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          ) : (
            <button
              onClick={handleLockRepetition}
              disabled={loading}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Locking...' : 'Lock'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        {repetition.is_locked ? (
          <p>
            When locked, users cannot create new drafts, delete existing drafts, or withdraw submitted drafts.
            Only admins can modify the lock status.
          </p>
        ) : (
          <p>
            When unlocked, users can freely create, edit, delete, submit, and withdraw drafts.
            Lock this repetition to prevent further changes to submitted data.
          </p>
        )}
      </div>
    </div>
  )
}
