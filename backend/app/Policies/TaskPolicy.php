<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * TaskPolicy — defines who can do what with tasks.
 *
 * Authorization design:
 * - Policies are model-bound classes registered in AuthServiceProvider.
 * - When a controller calls $this->authorize('view', $task), Laravel finds this policy
 *   and calls the matching method with the authenticated user and the task instance.
 * - If the method returns false, Laravel throws AuthorizationException → HTTP 403.
 *
 * This is backend-enforced authorization — the frontend hiding a button is just UX,
 * this is the real security boundary.
 *
 * Key scenario from the brief (Worker B trying to access Worker A's task):
 * - Worker B sends GET /api/tasks/15 with their valid token.
 * - Sanctum middleware authenticates Worker B.
 * - Controller calls $this->authorize('view', $task) where $task->worker_id === Worker A's id.
 * - TaskPolicy::view() is called with Worker B as $user and Task 15 as $task.
 * - $task->worker_id (10) !== $user->id (20) → returns false → HTTP 403.
 */
class TaskPolicy
{
    use HandlesAuthorization;

    /**
     * viewAny: Can this user see a list of tasks?
     * Admins see all. Clients and Workers can list — but the query in the controller
     * further filters to only their own tasks.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'client', 'worker']);
    }

    /**
     * view: Can this user view a specific task?
     *
     * Admin → always yes.
     * Client → only if they own the task (client_id matches).
     * Worker → only if the task is assigned to them (worker_id matches).
     */
    public function view(User $user, Task $task): bool
    {
        return match ($user->role) {
            'admin'  => true,
            'client' => $task->client_id === $user->id,
            'worker' => $task->worker_id === $user->id,
            default  => false,
        };
    }

    /**
     * create: Can this user create a task?
     * Admin and Client can create tasks. Workers cannot.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'client']);
    }

    /**
     * update: Can this user update a task?
     *
     * Admin → full update (all fields).
     * Client → only their own task, and only non-admin fields (no worker assignment).
     * Worker → only their assigned task, and only the status field.
     *
     * Note: Field-level restrictions are enforced in the controller, not here.
     * This method only answers "can they update this task at all?"
     */
    public function update(User $user, Task $task): bool
    {
        return match ($user->role) {
            'admin'  => true,
            'client' => $task->client_id === $user->id,
            'worker' => $task->worker_id === $user->id,
            default  => false,
        };
    }

    /**
     * delete: Can this user delete a task?
     * Only Admins can delete tasks.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->role === 'admin';
    }
}
