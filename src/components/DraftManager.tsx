import { type ExperimentDataEntry } from '../lib/supabase'

interface DraftManagerProps {
  userDataEntries: ExperimentDataEntry[]
  selectedDataEntry: ExperimentDataEntry | null
  onSelectEntry: (entry: ExperimentDataEntry) => void
  onDeleteDraft: (entryId: string) => void
  onCreateNew: () => void
  onClose: () => void
}

export function DraftManager({
  userDataEntries,
  selectedDataEntry,
  onSelectEntry,
  onDeleteDraft,
  onCreateNew,
  onClose
}: DraftManagerProps) {
  const drafts = userDataEntries.filter(entry => entry.status === 'draft')
  const submitted = userDataEntries.filter(entry => entry.status === 'submitted')

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Draft Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Draft Entries */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900">
              Draft Entries ({drafts.length})
            </h3>
            <button
              onClick={onCreateNew}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Create New Draft
            </button>
          </div>

          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No draft entries found</p>
              <p className="text-sm mt-1">Create a new draft to start entering data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((entry) => (
                <div
                  key={entry.id}
                  className={`border rounded-lg p-4 ${
                    selectedDataEntry?.id === entry.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {entry.entry_name || 'Untitled Draft'}
                        </h4>
                        {selectedDataEntry?.id === entry.id && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        <div>Created: {new Date(entry.created_at).toLocaleString()}</div>
                        <div>Last updated: {new Date(entry.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectEntry(entry)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        {selectedDataEntry?.id === entry.id ? 'Continue' : 'Select'}
                      </button>
                      <button
                        onClick={() => onDeleteDraft(entry.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submitted Entries */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Submitted Entries ({submitted.length})
          </h3>

          {submitted.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No submitted entries found</p>
              <p className="text-sm mt-1">Submit a draft to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submitted.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {entry.entry_name || 'Untitled Entry'}
                        </h4>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Submitted
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        <div>Created: {new Date(entry.created_at).toLocaleString()}</div>
                        {entry.submitted_at && (
                          <div>Submitted: {new Date(entry.submitted_at).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectEntry(entry)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
