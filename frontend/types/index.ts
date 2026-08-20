// ─────────────────────────────────────────────────────────────────
// Shared TypeScript types — mirrors the Laravel API response shapes
// ─────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'client' | 'worker'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface User {
  id:         number
  name:       string
  email:      string
  role:       Role
  created_at: string
  updated_at: string
}

export interface Task {
  id:          number
  title:       string
  description: string | null
  status:      TaskStatus
  client_id:   number
  worker_id:   number | null
  client?:     User
  worker?:     User
  created_at:  string
  updated_at:  string
}

// ─── API Response shapes ─────────────────────────────────────────

export interface LoginResponse {
  user:  User
  token: string
}

export interface UsersResponse {
  users: User[]
}

export interface TasksResponse {
  tasks: Task[]
}

export interface TaskResponse {
  task:    Task
  message?: string
}

export interface UserResponse {
  user:    User
  message?: string
}

export interface MessageResponse {
  message: string
}

// ─── API Error shape ─────────────────────────────────────────────

export interface ValidationError {
  message: string
  errors:  Record<string, string[]>
}
