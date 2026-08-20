'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import type { Task, User, TasksResponse, UsersResponse } from '@/types'

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
  { label: 'Users', href: '/dashboard/admin',       icon: <UsersIcon /> },
  { label: 'Tasks', href: '/dashboard/admin/tasks', icon: <TasksIcon /> },
]

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'] as const

export default function AdminTasksPage() {
  const [tasks,     setTasks]     = useState<Task[]>([])
  const [workers,   setWorkers]   = useState<User[]>([])
  const [clients,   setClients]   = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editTask,  setEditTask]  = useState<Task | null>(null)
  const [formData,  setFormData]  = useState({
    title: '', description: '', status: 'pending', client_id: '', worker_id: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, usersRes] = await Promise.all([
        apiClient.get<TasksResponse>('/tasks'),
        apiClient.get<UsersResponse>('/users'),
      ])
      setTasks(tasksRes.data.tasks)
      const allUsers = usersRes.data.users
      setWorkers(allUsers.filter(u => u.role === 'worker'))
      setClients(allUsers.filter(u => u.role === 'client'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => {
    setEditTask(null)
    setFormData({ title: '', description: '', status: 'pending', client_id: '', worker_id: '' })
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    setFormData({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      client_id: String(task.client_id),
      worker_id: task.worker_id ? String(task.worker_id) : '',
    })
    setFormError(null)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return
    await apiClient.delete(`/tasks/${id}`)
    fetchAll()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        title:       formData.title,
        description: formData.description || null,
        status:      formData.status,
        client_id:   formData.client_id ? Number(formData.client_id) : undefined,
        worker_id:   formData.worker_id  ? Number(formData.worker_id)  : null,
      }
      if (editTask) {
        await apiClient.patch(`/tasks/${editTask.id}`, payload)
      } else {
        await apiClient.post('/tasks', payload)
      }
      setShowForm(false)
      fetchAll()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to save task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout navItems={navItems} title="Admin Panel">
        <div className="animate-slide-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Task Management</h1>
              <p className="text-gray-400 text-sm mt-1">View, create, and assign all tasks</p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Title</th><th>Status</th><th>Client</th><th>Worker</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading tasks...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No tasks yet.</td></tr>
                ) : tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="font-medium text-white max-w-xs">
                      <p className="truncate">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-500 truncate">{task.description}</p>}
                    </td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                    <td className="text-sm">{task.client?.name ?? `Client #${task.client_id}`}</td>
                    <td className="text-sm">{task.worker?.name ?? <span className="text-gray-600">Unassigned</span>}</td>
                    <td className="text-sm text-gray-500">{new Date(task.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(task)} className="btn-secondary text-xs px-2 py-1">Edit</button>
                        <button onClick={() => handleDelete(task.id)} className="btn-danger text-xs px-2 py-1">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Task modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="card w-full max-w-lg animate-slide-in">
                <h2 className="text-lg font-semibold text-white mb-5">
                  {editTask ? 'Edit Task' : 'Create Task'}
                </h2>
                {formError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">{formError}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input className="input" value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input min-h-20 resize-none" value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Status</label>
                      <select className="input" value={formData.status}
                        onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Assign Worker</label>
                      <select className="input" value={formData.worker_id}
                        onChange={e => setFormData(p => ({ ...p, worker_id: e.target.value }))}>
                        <option value="">Unassigned</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Client</label>
                    <select className="input" value={formData.client_id}
                      onChange={e => setFormData(p => ({ ...p, client_id: e.target.value }))} required={!editTask}>
                      <option value="">Select client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving} className="btn-primary flex-1">
                      {saving ? 'Saving...' : (editTask ? 'Update Task' : 'Create Task')}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
