import { useState, useEffect } from 'react'
import { userManagement, type User, type Role, type RoleName, type UserStatus } from '../lib/supabase'
import { CreateUserModal } from './CreateUserModal'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersData, rolesData] = await Promise.all([
        userManagement.getAllUsers(),
        userManagement.getAllRoles()
      ])

      setUsers(usersData)
      setRoles(rolesData)
    } catch (err) {
      setError('Failed to load user data')
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: UserStatus) => {
    try {
      const newStatus: UserStatus = currentStatus === 'active' ? 'disabled' : 'active'
      await userManagement.updateUserStatus(userId, newStatus)

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ))
    } catch (err) {
      console.error('Status update error:', err)
      alert('Failed to update user status')
    }
  }

  const handleRoleUpdate = async (userId: string, newRoles: RoleName[]) => {
    try {
      await userManagement.updateUserRoles(userId, newRoles)

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, roles: newRoles } : user
      ))

      setEditingUser(null)
    } catch (err) {
      console.error('Role update error:', err)
      alert('Failed to update user roles')
    }
  }

  const handleEmailUpdate = async (userId: string, newEmail: string) => {
    try {
      await userManagement.updateUserEmail(userId, newEmail)

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, email: newEmail } : user
      ))

      setEditingUser(null)
    } catch (err) {
      console.error('Email update error:', err)
      alert('Failed to update user email')
    }
  }

  const handleUserCreated = (newUser: User) => {
    setUsers([...users, newUser])
    setShowCreateModal(false)
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">Manage user accounts, roles, and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ➕ Add New User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔴</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Disabled Users</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.status === 'disabled').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👑</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Admins</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.roles.includes('admin')).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Click on any field to edit user details
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  roles={roles}
                  isEditing={editingUser === user.id}
                  onEdit={() => setEditingUser(user.id)}
                  onCancel={() => setEditingUser(null)}
                  onStatusToggle={handleStatusToggle}
                  onRoleUpdate={handleRoleUpdate}
                  onEmailUpdate={handleEmailUpdate}
                  getRoleBadgeColor={getRoleBadgeColor}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  )
}

// UserRow component for inline editing
interface UserRowProps {
  user: User
  roles: Role[]
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onStatusToggle: (userId: string, currentStatus: UserStatus) => void
  onRoleUpdate: (userId: string, newRoles: RoleName[]) => void
  onEmailUpdate: (userId: string, newEmail: string) => void
  getRoleBadgeColor: (role: string) => string
}

function UserRow({
  user,
  roles,
  isEditing,
  onEdit,
  onCancel,
  onStatusToggle,
  onRoleUpdate,
  onEmailUpdate,
  getRoleBadgeColor
}: UserRowProps) {
  const [editEmail, setEditEmail] = useState(user.email)
  const [editRoles, setEditRoles] = useState<RoleName[]>(user.roles)

  const handleSave = () => {
    if (editEmail !== user.email) {
      onEmailUpdate(user.id, editEmail)
    }
    if (JSON.stringify(editRoles.sort()) !== JSON.stringify(user.roles.sort())) {
      onRoleUpdate(user.id, editRoles)
    }
    if (editEmail === user.email && JSON.stringify(editRoles.sort()) === JSON.stringify(user.roles.sort())) {
      onCancel()
    }
  }

  const handleRoleToggle = (roleName: RoleName) => {
    if (editRoles.includes(roleName)) {
      setEditRoles(editRoles.filter(r => r !== roleName))
    } else {
      setEditRoles([...editRoles, roleName])
    }
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        ) : (
          <div
            className="text-sm text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={onEdit}
          >
            {user.email}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        {isEditing ? (
          <div className="space-y-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={editRoles.includes(role.name)}
                  onChange={() => handleRoleToggle(role.name)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{role.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-wrap gap-1 cursor-pointer"
            onClick={onEdit}
          >
            {user.roles.map((role) => (
              <span
                key={role}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onStatusToggle(user.id, user.status)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
        >
          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {isEditing ? (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="text-blue-600 hover:text-blue-900"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  )
}
