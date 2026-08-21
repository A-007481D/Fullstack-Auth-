'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import { KanbanBoard } from '@/components/ui/kanban-board'
import { SlideOver } from '@/components/ui/slide-over'
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
    setShowForm(false)
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
        <div className="animate-slide-in h-[calc(100vh-8rem)]">
          
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin mr-3" />
              Loading tasks...
            </div>
          ) : (
            <KanbanBoard 
              tasks={tasks} 
              onTaskClick={openEdit} 
              onNewTaskClick={openCreate} 
            />
          )}

        </div>
        <SlideOver 
          isOpen={showForm} 
          onClose={() => setShowForm(false)} 
          title={editTask ? 'Edit Task' : 'New Task'}
        >
          {formError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Title</label>
              <input className="input" value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[120px] resize-none" value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            </div>
            
            <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={formData.status}
                  onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s} className="bg-gray-900">{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Assign Worker</label>
                <select className="input" value={formData.worker_id}
                  onChange={e => setFormData(p => ({ ...p, worker_id: e.target.value }))}>
                  <option value="" className="bg-gray-900">Unassigned</option>
                  {workers.map(w => <option key={w.id} value={w.id} className="bg-gray-900">{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Client</label>
                <select className="input" value={formData.client_id}
                  onChange={e => setFormData(p => ({ ...p, client_id: e.target.value }))} required={!editTask}>
                  <option value="" className="bg-gray-900">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between">
              {editTask && (
                <button 
                  type="button" 
                  onClick={() => handleDelete(editTask.id)} 
                  className="btn-danger"
                >
                  Delete
                </button>
              )}
              
              <div className="flex gap-3 ml-auto">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : (editTask ? 'Save Changes' : 'Create Task')}
                </button>
              </div>
            </div>
          </form>
        </SlideOver>
      </DashboardLayout>
    </AuthGuard>
  )
}
