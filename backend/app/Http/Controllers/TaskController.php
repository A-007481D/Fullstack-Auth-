<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * TaskController — role-aware task management.
 *
 * Authorization is enforced at two levels:
 * 1. Policy check (can this user perform this action on this task?)
 * 2. Data scope (what tasks can this user even see in a list?)
 *
 * This separation is intentional:
 * - Policy handles the "can I?" question.
 * - Query scoping handles the "what do I see?" question.
 * Both are needed — you can't just hide data, you must also enforce per-resource access.
 */
class TaskController
{
    /**
     * GET /api/tasks
     *
     * Returns different task sets depending on role:
     * - Admin   → all tasks
     * - Client  → only their own tasks (where client_id = auth user's id)
     * - Worker  → only tasks assigned to them (where worker_id = auth user's id)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Task::class);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Task::with(['client', 'worker']); // eager-load to avoid N+1

        $tasks = match ($user->role) {
            'admin'  => $query->latest()->get(),
            'client' => $query->where('client_id', $user->id)->latest()->get(),
            'worker' => $query->where('worker_id', $user->id)->latest()->get(),
            default  => collect(), // empty if unknown role
        };

        return response()->json([
            'tasks' => TaskResource::collection($tasks),
        ], 200);
    }

    /**
     * POST /api/tasks
     *
     * Admin can set any client_id and worker_id.
     * Client can only create tasks for themselves — client_id is forced from auth.
     * Worker cannot create tasks (Policy::create returns false).
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $data = $request->validated();

        // Enforce client_id based on role
        if ($user->isClient()) {
            // A client can only create tasks on their own behalf
            // We override any client_id they might have passed in the body
            $data['client_id'] = $user->id;
            unset($data['worker_id']); // clients cannot assign workers
        }

        // Admins can freely set client_id and worker_id from the request body
        $task = Task::create($data);
        $task->load(['client', 'worker']);

        return response()->json([
            'message' => 'Task created successfully.',
            'task'    => new TaskResource($task),
        ], 201);
    }

    /**
     * GET /api/tasks/{task}
     *
     * Route model binding auto-fetches the task.
     * Policy::view() enforces ownership — Worker B gets 403 on Worker A's task.
     */
    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $task->load(['client', 'worker']);

        return response()->json([
            'task' => new TaskResource($task),
        ], 200);
    }

    /**
     * PATCH /api/tasks/{task}
     *
     * Field-level enforcement by role:
     * - Admin    → can update anything
     * - Client   → can update title, description (not status, not worker assignment)
     * - Worker   → can update ONLY the status field
     *
     * This is a critical security boundary: the Policy says "yes you can update",
     * but we still need to restrict WHAT they can update.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $data = $request->validated();

        // Field-level restrictions per role
        $allowedFields = match ($user->role) {
            'admin'  => ['title', 'description', 'status', 'worker_id', 'client_id'],
            'client' => ['title', 'description'],         // clients cannot change status or assignment
            'worker' => ['status'],                       // workers can ONLY update status
            default  => [],
        };

        // Only keep fields this role is allowed to change
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $task->update($filteredData);
        $task->load(['client', 'worker']);

        return response()->json([
            'message' => 'Task updated successfully.',
            'task'    => new TaskResource($task),
        ], 200);
    }

    /**
     * DELETE /api/tasks/{task}
     * Only Admins can delete tasks (enforced by Policy::delete).
     */
    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json(null, 204);
    }
}
