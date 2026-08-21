import React from 'react'
import type { Task } from '@/types'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onNewTaskClick?: () => void
}

const COLUMNS = [
  { id: 'pending',     label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed',   label: 'Completed' },
] as const

export function KanbanBoard({ tasks, onTaskClick, onNewTaskClick }: KanbanBoardProps) {
  
  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Task Board</h1>
          <p className="page-subtitle">Track and manage project tasks</p>
        </div>
        {onNewTaskClick && (
          <button onClick={onNewTaskClick} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          
          return (
            <div key={col.id} className="w-80 shrink-0 flex flex-col bg-white/[0.02] rounded-2xl border border-white/[0.04] max-h-full">
              
              {/* Column Header */}
              <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-md rounded-t-2xl z-10">
                <h3 className="font-semibold text-white tracking-tight">{col.label}</h3>
                <span className="text-xs font-medium text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Body / Cards */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-medium text-gray-600 border border-dashed border-white/[0.06] rounded-xl py-8">No tasks here</p>
                  </div>
                ) : (
                  colTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="w-full text-left bg-[#0d1117] border border-white/[0.07] p-4 rounded-xl shadow-lg shadow-black/20 hover:border-white/[0.15] hover:shadow-xl transition-all group"
                    >
                      <h4 className="font-semibold text-gray-100 mb-1.5 leading-tight group-hover:text-indigo-300 transition-colors">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Card Footer (Avatars / Badges) */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          <span className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-emerald-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          {task.status.replace('_', ' ')}
                        </div>

                        {/* Worker Avatar */}
                        {task.worker ? (
                          <div 
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-[#0d1117]" 
                            title={`Worker: ${task.worker.name}`}
                          >
                            {task.worker.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600" title="Unassigned">
                            ?
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
