import { useState } from 'react'
import { userManagement, type User, type Role, type RoleName, type CreateUserRequest } from '../lib/supabase'

interface CreateUserModalProps {
  roles: Role[]
  onClose: () => void
  onUserCreated: (user: User) => void
}

export function CreateUserModal({ roles, onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    roles: [],
    tempPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleRoleToggle = (roleName: RoleName) => {
    if (formData.roles.includes(roleName)) {
      setFormData({
        ...formData,
        roles: formData.roles.filter(r => r !== roleName)
      })
    } else {
      setFormData({
        ...formData,
        roles: [...formData.roles, roleName]
      })
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, tempPassword: result })
    setGeneratedPassword(result)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.email) {
      setError('Email is required')
      return
    }

    if (formData.roles.length === 0) {
      setError('At least one role must be selected')
      return
    }

    if (!formData.tempPassword) {
      setError('Password is required')
      return
    }

    try {
      setLoading(true)

      const response = await userManagement.createUser(formData)

      // Create user object for the parent component
      const newUser: User = {
        id: response.user_id,
        email: response.email,
        roles: response.roles,
        status: response.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      onUserCreated(newUser)

      // Show success message with password
      alert(`User created successfully!\n\nEmail: ${response.email}\nTemporary Password: ${response.temp_password}\n\nPlease save this password as it won't be shown again.`)

    } catch (err: any) {
      setError(err.message || 'Failed to create user')
      console.error('Create user error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'conductor':
        return 'bg-blue-100 text-blue-800'
      case 'analyst':
        return 'bg-green-100 text-green-800'
      case 'data recorder':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Create New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">

          {/* Form */}
          <form id="create-user-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm placeholder-gray-400"
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Roles (select at least one)
              </label>
              <div className="space-y-3">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role.name)}
                      onChange={() => handleRoleToggle(role.name)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <div className="ml-3 flex-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">{role.name}</span>
                      <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Selected roles preview */}
              {formData.roles.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Selected roles:</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.tempPassword}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none text-sm placeholder-gray-400"
                  placeholder="Enter password or generate one"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 border-l border-gray-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-1.414-1.414M14.12 14.12l1.414 1.414M14.12 14.12L15.536 15.536M14.12 14.12l1.414 1.414" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border-l border-gray-300 text-sm font-medium transition-colors"
                >
                  Generate
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                User will need to change this password on first login
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={loading}
            className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </div>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
