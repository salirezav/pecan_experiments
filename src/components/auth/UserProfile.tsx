import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

export const UserProfile: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="text-gray-900">{user.email}</p>
        </div>

        {user.profile && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <p className="text-gray-900">{user.profile.first_name || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="text-gray-900">{user.profile.last_name || 'Not set'}</p>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Roles</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((role) => (
                <span
                  key={role}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    role === 'admin'
                      ? 'bg-red-100 text-red-800'
                      : role === 'moderator'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No roles assigned</span>
            )}
          </div>
        </div>

        {isAdmin() && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700 font-medium">
              🔑 You have administrator privileges
            </p>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
