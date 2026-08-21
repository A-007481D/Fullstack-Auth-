'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import type { User, UsersResponse } from '@/types'

// ── SVG Icon helpers ──────────────────────────────────────────────
const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const TasksIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const navItems = [
  { label: 'Users',  href: '/dashboard/admin',       icon: <UsersIcon /> },
  { label: 'Tasks',  href: '/dashboard/admin/tasks',  icon: <TasksIcon /> },
]

// ─────────────────────────────────────────────────────────────────
// User Management Section
// ─────────────────────────────────────────────────────────────────
function UsersSection() {
  const [users,      setUsers]      = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editUser,   setEditUser]   = useState<User | null>(null)
  const [formData,   setFormData]   = useState({ name: '', email: '', password: '', role: 'client' })
  const [formError,  setFormError]  = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)
  // Role filter: drives "View all users / clients / workers" requirement from brief
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'client' | 'worker'>('all')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<UsersResponse>('/users')
      setUsers(res.data.users)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreate = () => {
    setEditUser(null)
    setFormData({ name: '', email: '', password: '', role: 'client' })
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setFormData({ name: user.name, email: user.email, password: '', role: user.role })
    setFormError(null)
    setShowForm(true)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    await apiClient.delete(`/users/${userId}`)
    fetchUsers()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload: Record<string, string> = {
        name:  formData.name,
        email: formData.email,
        role:  formData.role,
      }
      if (formData.password) payload.password = formData.password

      if (editUser) {
        await apiClient.put(`/users/${editUser.id}`, payload)
      } else {
        payload.password = formData.password
        await apiClient.post('/users', payload)
      }
      setShowForm(false)
      fetchUsers()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  // Derive filtered list from the active tab — pure frontend filter, data already fetched
  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter(u => u.role === roleFilter)

  const filterTabs: { key: typeof roleFilter; label: string }[] = [
    { key: 'all',    label: 'All Users' },
    { key: 'admin',  label: 'Admins' },
    { key: 'client', label: 'Clients' },
    { key: 'worker', label: 'Workers' },
  ]

  const tableHeading =
    roleFilter === 'all'
      ? `All Users (${users.length})`
      : `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s (${filteredUsers.length})`

  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create, update and manage all system users</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New User
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {filterTabs.map(({ key, label }) => {
          const count = key === 'all' ? users.length : users.filter(u => u.role === key).length
          const isActive = roleFilter === key
          return (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`stat-card text-left transition-all duration-150 border-2 ${
                isActive
                  ? 'border-indigo-500/40 bg-indigo-600/5'
                  : 'border-transparent hover:border-white/[0.1] cursor-pointer'
              }`}
            >
              <p className={`text-2xl font-bold ${isActive ? 'text-indigo-300' : 'text-white'}`}>{count}</p>
              <p className={`text-xs mt-1 font-medium ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>{label}</p>
            </button>
          )
        })}
      </div>

      {/* Users table — filtered by the active role tab */}
      <div className="table-container">
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-medium text-gray-300">{tableHeading}</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No {roleFilter === 'all' ? '' : roleFilter + ' '}users found.
                </td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="font-medium text-white">{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(user)} className="btn-secondary text-xs px-2 py-1">Edit</button>
                    <button onClick={() => handleDelete(user.id)} className="btn-danger text-xs px-2 py-1">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-slide-in">
            <h2 className="text-lg font-semibold text-white mb-5">
              {editUser ? `Edit: ${editUser.name}` : 'Create New User'}
            </h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input className="input" type="password" value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  required={!editUser} minLength={8} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                  <option value="client">Client</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : (editUser ? 'Update User' : 'Create User')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Admin Dashboard Page
// ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout navItems={navItems} title="Admin Panel">
        <UsersSection />
      </DashboardLayout>
    </AuthGuard>
  )
}
