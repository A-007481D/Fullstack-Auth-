'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { Task, TasksResponse, TaskResponse } from '@/types'

const TasksIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
const navItems = [{ label: 'My Tasks', href: '/dashboard/client', icon: <TasksIcon /> }]

export default function ClientDashboardPage() {
  const { user } = useAuthStore()
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [formData,    setFormData]    = useState({ title: '', description: '' })
  const [editMode,    setEditMode]    = useState(false)
  const [editFormData, setEditFormData] = useState({ title: '', description: '' })
  const [formError,   setFormError]   = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<TasksResponse>('/tasks')
      setTasks(res.data.tasks)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await apiClient.post('/tasks', {
        title:       formData.title,
        description: formData.description || null,
        // client_id is set server-side from the authenticated user — clients can't change this
      })
      setShowForm(false)
      setFormData({ title: '', description: '' })
      fetchTasks()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to create task.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return
    setSaving(true)
    try {
      await apiClient.patch(`/tasks/${selectedTask.id}`, {
        title:       editFormData.title,
        description: editFormData.description || null,
      })
      setEditMode(false)
      setSelectedTask(null)
      fetchTasks()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to update task.')
    } finally {
      setSaving(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending:     'badge-pending',
    in_progress: 'badge-in_progress',
    completed:   'badge-completed',
  }

  return (
    <AuthGuard allowedRoles={['client']}>
      <DashboardLayout navItems={navItems} title="Client Portal">
        <div className="animate-slide-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title">My Tasks</h1>
              <p className="page-subtitle">Welcome back, {user?.name}. Track your task requests here.</p>
            </div>
            <button onClick={() => { setShowForm(true); setFormError(null) }} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(['pending', 'in_progress', 'completed'] as const).map(status => (
              <div key={status} className="card">
                <p className="page-title">{tasks.filter(t => t.status === status).length}</p>
                <p className="text-sm text-gray-400 mt-1 capitalize">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>

          {/* Tasks grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading your tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">No tasks yet.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">Create your first task</button>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task.id}
                  className="card cursor-pointer hover:border-gray-700 transition-colors"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.worker && (
                        <p className="text-xs text-brand-400 mt-2">
                          👷 Assigned to: {task.worker.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`badge ${statusColors[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-gray-600 mt-2">{new Date(task.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task detail modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => { setSelectedTask(null); setEditMode(false); }}>
              <div className="card w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
                {!editMode ? (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">{selectedTask.title}</h2>
                      <span className={`badge ${statusColors[selectedTask.status]}`}>
                        {selectedTask.status.replace('_', ' ')}
                      </span>
                    </div>
                    {selectedTask.description && (
                      <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">{selectedTask.description}</p>
                    )}
                    <div className="border-t border-gray-800 pt-4 space-y-2 text-sm mb-5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assigned worker</span>
                        <span className="text-white">{selectedTask.worker?.name ?? 'Not yet assigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="text-white">{new Date(selectedTask.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setEditFormData({ title: selectedTask.title, description: selectedTask.description || '' }); setEditMode(true); }} className="btn-primary flex-1">Edit Request</button>
                      <button onClick={() => setSelectedTask(null)} className="btn-secondary flex-1">Close</button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleUpdateTask} className="space-y-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Edit Task Request</h2>
                    <div>
                      <label className="label">Task Title</label>
                      <input className="input" value={editFormData.title} required
                        onChange={e => setEditFormData(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Details (optional)</label>
                      <textarea className="input min-h-24 resize-none" value={editFormData.description}
                        onChange={e => setEditFormData(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={saving} className="btn-primary flex-1">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Create task modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="card w-full max-w-md animate-slide-in">
                <h2 className="text-lg font-semibold text-white mb-5">New Task Request</h2>
                {formError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">{formError}</div>
                )}
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="label">Task Title</label>
                    <input className="input" value={formData.title} required
                      placeholder="Describe what you need done..."
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Details (optional)</label>
                    <textarea className="input min-h-24 resize-none" value={formData.description}
                      placeholder="Add any additional context..."
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={saving} className="btn-primary flex-1">
                      {saving ? 'Submitting...' : 'Submit Request'}
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
