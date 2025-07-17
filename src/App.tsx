import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { UserProfile } from './components/auth/UserProfile'
import { ProtectedRoute, AdminOnly, ModeratorOrAdmin, AuthenticatedOnly } from './components/auth/ProtectedRoute'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">RBAC Demo Application</h1>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">RBAC Demo Application</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Profile Section */}
          <div>
            <UserProfile />
          </div>

          {/* Role-Based Content Section */}
          <div className="space-y-6">
            {/* Content for all authenticated users */}
            <AuthenticatedOnly>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ Authenticated User Content
                </h3>
                <p className="text-green-700">
                  This content is visible to all authenticated users.
                </p>
              </div>
            </AuthenticatedOnly>

            {/* Content for moderators and admins */}
            <ModeratorOrAdmin>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  🛡️ Moderator/Admin Content
                </h3>
                <p className="text-yellow-700">
                  This content is visible to moderators and administrators only.
                </p>
              </div>
            </ModeratorOrAdmin>

            {/* Content for admins only */}
            <AdminOnly>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  🔑 Admin Only Content
                </h3>
                <p className="text-red-700">
                  This content is visible to administrators only. You have full system access.
                </p>
              </div>
            </AdminOnly>

            {/* Custom role check example */}
            <ProtectedRoute
              requiredRole="user"
              fallback={
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600">You need 'user' role to see this content.</p>
                </div>
              }
            >
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  👤 User Role Content
                </h3>
                <p className="text-blue-700">
                  This content is visible to users with the 'user' role.
                </p>
              </div>
            </ProtectedRoute>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">RBAC System Instructions</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Admin User:</strong> s.alireza.v@gmail.com (password: ???????)</p>
            <p><strong>Features:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Role-based content visibility</li>
              <li>Protected routes and components</li>
              <li>User profile with role display</li>
              <li>Secure authentication with Supabase</li>
              <li>Row Level Security (RLS) policies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
