'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { KanbanBoard } from '@/components/ui/kanban-board'
import { SlideOver } from '@/components/ui/slide-over'
import type { Task, TasksResponse } from '@/types'

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
  
  const [showForm,    setShowForm]    = useState(false) // For creating a new task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null) // For viewing/editing
  const [editMode,    setEditMode]    = useState(false)
  
  const [formData,    setFormData]    = useState({ title: '', description: '' })
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

  const openCreate = () => {
    setSelectedTask(null)
    setEditMode(false)
    setFormData({ title: '', description: '' })
    setFormError(null)
    setShowForm(true)
  }

  const openTask = (task: Task) => {
    setShowForm(false)
    setEditMode(false)
    setSelectedTask(task)
    setFormData({ title: task.title, description: task.description || '' })
    setFormError(null)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await apiClient.post('/tasks', {
        title:       formData.title,
        description: formData.description || null,
      })
      setShowForm(false)
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
    setFormError(null)
    try {
      await apiClient.patch(`/tasks/${selectedTask.id}`, {
        title:       formData.title,
        description: formData.description || null,
      })
      
      // Update local state to reflect changes immediately in the detail view
      setSelectedTask(prev => prev ? { ...prev, title: formData.title, description: formData.description || null } : null)
      setEditMode(false)
      fetchTasks()
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to update task.')
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
        <div className="animate-slide-in h-[calc(100vh-8rem)]">
          
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin mr-3" />
              Loading your tasks...
            </div>
          ) : (
            <KanbanBoard 
              tasks={tasks} 
              onTaskClick={openTask} 
              onNewTaskClick={openCreate} 
            />
          )}

        </div>

        {/* New Task SlideOver */}
        <SlideOver 
          isOpen={showForm} 
          onClose={() => setShowForm(false)} 
          title="New Task Request"
        >
          {formError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formError}</div>
          )}
          <form onSubmit={handleCreateTask} className="space-y-5">
            <div>
              <label className="label">Task Title</label>
              <input className="input" value={formData.title} required
                placeholder="Describe what you need done..."
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Details (optional)</label>
              <textarea className="input min-h-[160px] resize-none" value={formData.description}
                placeholder="Add any additional context..."
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </SlideOver>

        {/* View/Edit Task SlideOver */}
        <SlideOver 
          isOpen={!!selectedTask} 
          onClose={() => setSelectedTask(null)} 
          title={editMode ? "Edit Task" : "Task Details"}
        >
          {selectedTask && !editMode && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold text-white leading-tight">{selectedTask.title}</h3>
                <span className={`badge ${statusColors[selectedTask.status]} shrink-0`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>
              
              {selectedTask.description && (
                <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description}
                </div>
              )}
              
              <div className="space-y-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Assigned worker</span>
                  <span className="text-white font-medium">
                    {selectedTask.worker ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                          {selectedTask.worker.name.charAt(0).toUpperCase()}
                        </div>
                        {selectedTask.worker.name}
                      </div>
                    ) : 'Not yet assigned'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Created</span>
                  <span className="text-white">{new Date(selectedTask.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.06] flex gap-3">
                <button onClick={() => setEditMode(true)} className="btn-primary flex-1">Edit Details</button>
                <button onClick={() => setSelectedTask(null)} className="btn-secondary flex-1">Close</button>
              </div>
            </div>
          )}

          {selectedTask && editMode && (
            <form onSubmit={handleUpdateTask} className="space-y-5">
              {formError && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formError}</div>
              )}
              <div>
                <label className="label">Task Title</label>
                <input className="input" value={formData.title} required
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Details (optional)</label>
                <textarea className="input min-h-[160px] resize-none" value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.06] flex gap-3">
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </SlideOver>
      </DashboardLayout>
    </AuthGuard>
  )
}
