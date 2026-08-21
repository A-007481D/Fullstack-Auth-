'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { KanbanBoard } from '@/components/ui/kanban-board'
import { SlideOver } from '@/components/ui/slide-over'
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

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    setUpdatingId(taskId)
    try {
      await apiClient.patch(`/tasks/${taskId}`, { status: newStatus })
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
        <div className="animate-slide-in h-[calc(100vh-8rem)]">
          
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin mr-3" />
              Loading your tasks...
            </div>
          ) : (
            <KanbanBoard 
              tasks={tasks} 
              onTaskClick={setSelectedTask} 
              // No onNewTaskClick for workers
            />
          )}

          <SlideOver 
            isOpen={!!selectedTask} 
            onClose={() => setSelectedTask(null)} 
            title="Task Details"
          >
            {selectedTask && (
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
                    <span className="text-gray-500">Client</span>
                    <span className="text-white font-medium">{selectedTask.client?.name ?? `#${selectedTask.client_id}`}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Created</span>
                    <span className="text-white">{new Date(selectedTask.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.06]">
                  <label className="label mb-3">Update Status</label>
                  <div className="grid grid-cols-1 gap-2">
                    {STATUS_OPTIONS.map(opt => {
                      const isActive = selectedTask.status === opt.value
                      return (
                        <button
                          key={opt.value}
                          disabled={updatingId === selectedTask.id || isActive}
                          onClick={() => handleStatusChange(selectedTask.id, opt.value)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                            isActive 
                              ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300 cursor-default' 
                              : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          {opt.label}
                          {updatingId === selectedTask.id && selectedTask.status !== opt.value && (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          )}
                          {isActive && (
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.06]">
                  <button onClick={() => setSelectedTask(null)} className="btn-secondary w-full">Close Panel</button>
                </div>
              </div>
            )}
          </SlideOver>

        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
