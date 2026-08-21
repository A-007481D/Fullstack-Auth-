# Task Management System

> A full-stack User & Task Management application with role-based access control.
> Built as a technical assessment demonstrating secure authentication, backend-enforced authorization, REST API design, testing, and Docker.

---

## Table of Contents

- [Overview](#overview)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Quick Start (Docker)](#quick-start-docker)
- [Environment Configuration](#environment-configuration)
- [Database Migrations & Seeders](#database-migrations--seeders)
- [Running Tests](#running-tests)
- [Test User Accounts](#test-user-accounts)
- [Authentication Approach](#authentication-approach)
- [Authorization Design](#authorization-design)
- [API Reference](#api-reference)

---

## Overview

Three user roles with distinct permissions:

| Role   | Capabilities |
|--------|-------------|
| **Admin**  | Full system access — manage all users, create/assign/delete any task |
| **Client** | Create task requests, view own tasks and assigned worker |
| **Worker** | View and update status of assigned tasks only |

---

## Technologies

| Layer          | Technology               | Why                                                     |
|----------------|-------------------------|---------------------------------------------------------|
| Backend        | Laravel 11              | Mature PHP framework, excellent auth/policy ecosystem   |
| Authentication | Laravel Sanctum          | Opaque tokens, instantly revokable, ideal for SPA APIs  |
| Authorization  | Laravel Policies         | Model-bound, testable, separation from controllers      |
| Database       | PostgreSQL 16            | Production-grade, strong consistency, rich types        |
| Frontend       | Next.js 14 (App Router)  | SSR support, TypeScript, industry standard for React    |
| State          | Zustand                  | Lightweight, no-boilerplate global state                |
| HTTP Client    | Axios                    | Interceptors for auth headers and global 401 handling   |
| Styling        | Tailwind CSS             | Utility-first, fast to write consistent dark UI         |
| Testing        | PHPUnit (Laravel)        | Native, no additional tooling required                  |
| Container      | Docker + Docker Compose  | Single-command reproducible environment                 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
│                                                                 │
│  ┌──────────────────┐   HTTP   ┌──────────────────┐            │
│  │   Next.js 14     │ ───────► │   Laravel 11     │            │
│  │   :3000          │          │   :8000          │            │
│  │  (App Router)    │          │  (PHP-FPM+Nginx) │            │
│  └──────────────────┘          └────────┬─────────┘            │
│                                         │ SQL                   │
│                                ┌────────▼─────────┐            │
│                                │   PostgreSQL 16   │            │
│                                │      :5432        │            │
│                                └───────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**Request flow:**
1. Next.js sends `Authorization: Bearer <token>` on every API request
2. Laravel Sanctum middleware validates the token against `personal_access_tokens` table
3. Controller calls `$this->authorize()` which invokes the relevant Policy
4. Policy checks the user's role and resource ownership
5. Response returned with correct HTTP status (200/201/204/401/403/422)

**Key security boundary — IDOR Prevention:**
- Worker B (`id=20`) requests `GET /api/tasks/15` (owned by Worker A, `id=10`)
- `TaskPolicy::view()` checks `$task->worker_id === $user->id` → `10 !== 20` → **HTTP 403**
- Backend enforcement is independent of frontend UI — hiding buttons is UX only

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-folder>

# 2. Copy the root env file
cp .env.example .env

# 3. Build and start all services
docker compose up --build

# 4. Seed the database (first time only)
docker compose exec backend php artisan migrate:fresh --seed

# Application is ready at:
#   Frontend  → http://localhost:3000
#   API       → http://localhost:3000/api  (proxied via Next.js rewrite → backend)
```

> The backend container automatically runs migrations and seeds on first start.

---

## Environment Configuration

### Root `.env` (Docker Compose variable substitution)
```env
DB_DATABASE=taskmanagement
DB_USERNAME=postgres
DB_PASSWORD=secret
```

### Backend `backend/.env` (Laravel — auto-created from `.env.example` in Docker)
```env
APP_NAME="Task Management"
APP_ENV=local
APP_KEY=           # Generated automatically on first start
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=postgres   # Docker service name — internal hostname
DB_PORT=5432
DB_DATABASE=taskmanagement
DB_USERNAME=postgres
DB_PASSWORD=secret

FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### Frontend `frontend/.env.local`
```env
# Only needed for local (non-Docker) development.
# In Docker, this is set at build time via docker-compose.yml build args.
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

> **Note:** In Docker, the Next.js app proxies all `/api/*` requests internally
> to the backend container (`http://backend:8000/api/*`) via `next.config.mjs` rewrites.
> The backend port (8000) is **not** exposed on the host — all traffic goes through port 3000.

---

## Database Migrations & Seeders

**Inside Docker (recommended):**
```bash
# Run migrations
docker compose exec backend php artisan migrate

# Run migrations fresh + seed (resets all data)
docker compose exec backend php artisan migrate:fresh --seed

# Seed only (without dropping tables)
docker compose exec backend php artisan db:seed
```

**Migration order:**
1. `create_users_table` — users with role column
2. `create_personal_access_tokens_table` — Sanctum tokens
3. `create_tasks_table` — tasks with client_id and worker_id foreign keys

---

## Running Tests

Tests use an **in-memory SQLite database** — no PostgreSQL required.

```bash
# Run all tests inside Docker
docker compose exec backend php artisan test

# Run a specific test class
docker compose exec backend php artisan test --filter AuthTest
docker compose exec backend php artisan test --filter TaskAuthorizationTest
```

**Test coverage:**
- ✅ Valid user can login
- ✅ Invalid credentials rejected (HTTP 401)
- ✅ Unauthenticated access to protected endpoints (HTTP 401)
- ✅ Password never returned in API responses
- ✅ Token invalidated after logout
- ✅ Admin can manage all users
- ✅ **Worker B cannot view Worker A's task (HTTP 403)**
- ✅ **Worker B cannot update Worker A's task (HTTP 403)**
- ✅ Worker can only update `status` field — not title or other fields
- ✅ Worker cannot create tasks (HTTP 403)
- ✅ Worker cannot delete tasks (HTTP 403)
- ✅ Worker task list only shows assigned tasks
- ✅ Client cannot access another client's task (HTTP 403)
- ✅ Client task list only shows own tasks
- ✅ Client cannot change task status
- ✅ Client cannot view user list (HTTP 403)
- ✅ Client cannot elevate their own role (HTTP 403)
- ✅ Worker cannot access admin endpoints (HTTP 403)
- ✅ Admin can view all tasks
- ✅ Admin can create/update/delete users

---

## Test User Accounts

All accounts use password: **`password`**

| Role     | Email              | Notes                                          |
|----------|--------------------|------------------------------------------------|
| Admin    | admin@app.com      | Full system access                             |
| Client   | client@app.com     | Has 2 tasks (1 assigned to worker@app.com)     |
| Client 2 | client2@app.com    | For isolation testing — cannot see client's data |
| Worker   | worker@app.com     | Assigned tasks from both clients               |
| Worker 2 | worker2@app.com    | For isolation testing — cannot see worker's tasks |

---

## Authentication Approach

**Technology: Laravel Sanctum (opaque Bearer tokens)**

### How it works:
1. User POSTs credentials to `POST /api/auth/login`
2. Laravel validates email/password via `Auth::attempt()` (bcrypt comparison)
3. On success, a random token is generated. Its **SHA-256 hash** is stored in `personal_access_tokens`
4. The **plaintext token** is returned to the client once only — we cannot reverse it from the DB
5. Client stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request
6. Sanctum middleware hashes the incoming token and looks it up in the DB — if found, request is authenticated
7. On logout, the token row is deleted — immediately and permanently invalidated

### Why Sanctum over JWT?
| Aspect | Sanctum (chosen) | JWT |
|--------|-----------------|-----|
| Revocation | Instant — delete the DB row | Requires blocklist until expiry |
| Setup | Built into Laravel | Requires extra package + key management |
| Statefulness | Minimal DB lookup per request | Truly stateless (but can't revoke) |
| Suitable for | SPA + mobile APIs | Distributed microservices |

For a monolithic SPA application, Sanctum's instant revokability is a clear security advantage.

---

## Authorization Design

**Technology: Laravel Policies**

### Design principles:
1. **Backend enforcement is the real boundary** — frontend hides UI elements, backend enforces rules
2. **Model-bound policies** — `TaskPolicy` is tied to the `Task` model; authorization logic lives with the model
3. **Two-layer protection** for tasks:
   - **List scoping**: `GET /api/tasks` returns different sets per role (admin=all, client=own, worker=assigned)
   - **Per-resource enforcement**: `GET /api/tasks/{id}` runs through `TaskPolicy::view()` regardless

### Policy decision table:

| Action | Admin | Client | Worker |
|--------|-------|--------|--------|
| View any user | ✅ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ |
| Update user | ✅ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ |
| View all tasks | ✅ | ❌ (own only) | ❌ (assigned only) |
| Create task | ✅ | ✅ | ❌ |
| View task | ✅ | ✅ (own) | ✅ (assigned) |
| Update task (all fields) | ✅ | ❌ | ❌ |
| Update task (title/desc) | ✅ | ✅ (own) | ❌ |
| Update task (status only) | ✅ | ❌ | ✅ (assigned) |
| Assign worker | ✅ | ❌ | ❌ |
| Delete task | ✅ | ❌ | ❌ |

### IDOR Protection Example:
```
Worker B (id=20) → GET /api/tasks/15
                       ↓
Sanctum authenticates Worker B → user.id = 20
                       ↓
TaskController::show() → $this->authorize('view', $task)
                       ↓
TaskPolicy::view(Worker B, Task#15)
  → task.worker_id = 10 ≠ user.id = 20
  → returns false
                       ↓
HTTP 403 Forbidden
```

---

## API Reference

```
POST   /api/auth/login              Public
POST   /api/auth/logout             [auth] Revokes current token
GET    /api/auth/me                 [auth] Returns authenticated user

GET    /api/users                   [admin] List all users (?role=worker filter)
POST   /api/users                   [admin] Create user
GET    /api/users/{id}              [admin] Show user
PUT    /api/users/{id}              [admin] Update user
DELETE /api/users/{id}              [admin] Delete user → HTTP 204

GET    /api/tasks                   [auth]  List tasks (scoped by role)
POST   /api/tasks                   [admin|client] Create task
GET    /api/tasks/{id}              [auth]  Show task (ownership enforced)
PATCH  /api/tasks/{id}              [auth]  Update task (fields restricted by role)
DELETE /api/tasks/{id}              [admin] Delete task → HTTP 204
```

---

## Git Workflow

This project follows **GitHub Flow**:
- Feature branches (`feature/*`) branched from `main`
- Each branch represents one logical feature
- PRs merge into `main` after review
- Meaningful, atomic commits with conventional commit messages

---

## How to Run the Frontend

### Via Docker (recommended)
```bash
# The frontend starts automatically with docker compose up --build
# Visit → http://localhost:3000
docker compose up frontend
```

### Local development (without Docker)
```bash
cd frontend
cp .env.example .env.local   # Edit NEXT_PUBLIC_API_URL if needed
npm install
npm run dev
# Starts at → http://localhost:3000
```

---

## How to Run the Backend

### Via Docker (recommended)
```bash
# The backend starts automatically with docker compose up --build
# API is accessible at → http://localhost:3000/api (proxied through Next.js)
docker compose up backend
```

### Local development (without Docker)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure your local DB in .env, then:
php artisan migrate --seed
php artisan serve
# API at → http://localhost:8000/api
```

---

## What I Would Improve With More Time

- **Email verification** on user creation
- **Pagination** on task and user list endpoints for scalability
- **Rate limiting** on the login endpoint to prevent brute-force attacks
- **Refresh token** mechanism — currently tokens don't expire; adding expiry + refresh would improve security
- **Audit log** — track who changed what and when on tasks and users
- **Worker self-registration flow** — currently seeder-only, could add invite-by-email
- **E2E tests** with Playwright/Cypress for the frontend flows
- **CI/CD pipeline** — GitHub Actions already added for test runs; extend to build and push Docker images on release
- **Production hardening** — `APP_DEBUG=false`, proper secrets management (e.g. Docker secrets or Vault), HTTPS enforcement