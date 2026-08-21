'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { Task, TasksResponse, TaskStatus } from '@/types'

const TasksIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
const navItems = [{ label: 'My Tasks', href: '/dashboard/worker', icon: <TasksIcon /> }]

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
]

export default function WorkerDashboardPage() {
  const { user } = useAuthStore()
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [updatingId,  setUpdatingId]  = useState<number | null>(null)

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

  /**
   * Workers can ONLY update the status field.
   * The backend enforces this — even if we sent other fields, they'd be stripped.
   * But we only send 'status' here to be correct at the API call level too.
   */
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    setUpdatingId(taskId)
    try {
      await apiClient.patch(`/tasks/${taskId}`, { status: newStatus })
      // Update local state immediately for snappy UX
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending:     'badge-pending',
    in_progress: 'badge-in_progress',
    completed:   'badge-completed',
  }

  return (
    <AuthGuard allowedRoles={['worker']}>
      <DashboardLayout navItems={navItems} title="Worker Portal">
        <div className="animate-slide-in">
          <div className="mb-6">
            <h1 className="page-title">Assigned Tasks</h1>
            <p className="page-subtitle">
              Hello, {user?.name}. You have {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned.
            </p>
          </div>

          {/* Progress overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(['pending', 'in_progress', 'completed'] as const).map(status => (
              <div key={status} className="card">
                <p className="page-title">{tasks.filter(t => t.status === status).length}</p>
                <p className="text-sm text-gray-400 mt-1 capitalize">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading your tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400">No tasks assigned to you yet.</p>
              <p className="text-gray-600 text-sm mt-1">Check back later or contact your admin.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="card hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        Client: {task.client?.name ?? `#${task.client_id}`}
                      </p>
                    </div>

                    {/* Status update dropdown — workers' primary action */}
                    <div className="shrink-0">
                      <label className="label text-xs mb-1">Update Status</label>
                      <select
                        value={task.status}
                        disabled={updatingId === task.id}
                        onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="input text-xs py-1.5 w-36"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {updatingId === task.id && (
                        <p className="text-xs text-brand-400 mt-1">Saving...</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task detail modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedTask(null)}>
              <div className="card w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white pr-4">{selectedTask.title}</h2>
                  <span className={`badge ${statusColors[selectedTask.status]} shrink-0`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
                {selectedTask.description && (
                  <p className="text-gray-300 text-sm mb-4">{selectedTask.description}</p>
                )}
                <div className="border-t border-gray-800 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="text-white">{selectedTask.client?.name ?? `#${selectedTask.client_id}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-white">{new Date(selectedTask.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Status update inside modal too */}
                <div className="mt-5 pt-4 border-t border-gray-800">
                  <label className="label mb-2">Update Status</label>
                  <select
                    value={selectedTask.status}
                    disabled={updatingId === selectedTask.id}
                    onChange={e => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                    className="input py-2 w-full"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {updatingId === selectedTask.id && (
                    <p className="text-xs text-brand-400 mt-2">Saving...</p>
                  )}
                </div>

                <button onClick={() => setSelectedTask(null)} className="btn-secondary w-full mt-4">Close</button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
