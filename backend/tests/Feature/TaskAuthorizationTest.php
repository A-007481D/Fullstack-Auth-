<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Tests\TestCase;

/**
 * TaskAuthorizationTest — the most critical tests from the quiz brief.
 *
 * Tests the exact scenarios described in section 7 of the brief:
 * "Worker B manually sends GET /api/tasks/15 — backend must prevent this."
 */
class TaskAuthorizationTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────
    // Worker authorization
    // ────────────────────────────────────────────────────────────────

    /** @test */
    public function test_worker_can_view_their_assigned_task(): void
    {
        $client = $this->createUser('client');
        $worker = $this->createUser('worker');
        [$_headers] = [null, $this->authHeaders($worker)];

        $task = Task::create([
            'title'     => 'Test task',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $worker->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($worker))
                         ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(200)
                 ->assertJson(['task' => ['id' => $task->id]]);
    }

    /** @test */
    public function test_worker_cannot_view_task_assigned_to_another_worker(): void
    {
        // This is the exact "Worker B → Task A" scenario from the brief
        $client  = $this->createUser('client');
        $workerA = $this->createUser('worker'); // id e.g. 10 — owns task
        $workerB = $this->createUser('worker'); // id e.g. 20 — attacker

        $task = Task::create([
            'title'     => 'Worker A\'s task',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $workerA->id,
        ]);

        // Worker B tries to access Worker A's task — MUST be 403
        $response = $this->withHeaders($this->authHeaders($workerB))
                         ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_worker_cannot_update_task_assigned_to_another_worker(): void
    {
        $client  = $this->createUser('client');
        $workerA = $this->createUser('worker');
        $workerB = $this->createUser('worker');

        $task = Task::create([
            'title'     => 'Worker A\'s task',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $workerA->id,
        ]);

        // Worker B tries to PATCH Worker A's task — MUST be 403
        $response = $this->withHeaders($this->authHeaders($workerB))
                         ->patchJson("/api/tasks/{$task->id}", ['status' => 'completed']);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_worker_can_only_update_status_not_other_fields(): void
    {
        $client = $this->createUser('client');
        $worker = $this->createUser('worker');

        $task = Task::create([
            'title'     => 'Original title',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $worker->id,
        ]);

        // Worker tries to update title AND status
        $response = $this->withHeaders($this->authHeaders($worker))
                         ->patchJson("/api/tasks/{$task->id}", [
                             'status' => 'in_progress',
                             'title'  => 'Hacked title', // should be silently ignored
                         ]);

        $response->assertStatus(200);

        // Status was updated
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'status' => 'in_progress']);

        // But title was NOT changed — field-level restriction working
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'Original title']);
    }

    /** @test */
    public function test_worker_cannot_create_tasks(): void
    {
        $client = $this->createUser('client');
        [$worker, $headers] = $this->actingAsUser('worker');

        $response = $this->withHeaders($headers)->postJson('/api/tasks', [
            'title'     => 'Unauthorized task',
            'client_id' => $client->id,
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_worker_cannot_delete_tasks(): void
    {
        $client = $this->createUser('client');
        $worker = $this->createUser('worker');

        $task = Task::create([
            'title'     => 'Task to delete',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $worker->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($worker))
                         ->deleteJson("/api/tasks/{$task->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_worker_task_list_only_shows_their_assigned_tasks(): void
    {
        $client  = $this->createUser('client');
        $workerA = $this->createUser('worker');
        $workerB = $this->createUser('worker');

        $myTask = Task::create([
            'title'     => 'My task',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $workerA->id,
        ]);

        $otherTask = Task::create([
            'title'     => 'Other worker task',
            'status'    => 'pending',
            'client_id' => $client->id,
            'worker_id' => $workerB->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($workerA))->getJson('/api/tasks');

        $response->assertStatus(200);

        $taskIds = collect($response->json('tasks'))->pluck('id');

        $this->assertTrue($taskIds->contains($myTask->id));
        $this->assertFalse($taskIds->contains($otherTask->id));
    }

    // ────────────────────────────────────────────────────────────────
    // Client authorization
    // ────────────────────────────────────────────────────────────────

    /** @test */
    public function test_client_cannot_access_another_clients_task(): void
    {
        $clientA = $this->createUser('client');
        $clientB = $this->createUser('client');

        $task = Task::create([
            'title'     => 'Client A\'s task',
            'status'    => 'pending',
            'client_id' => $clientA->id,
        ]);

        // Client B tries to view Client A's task — MUST be 403
        $response = $this->withHeaders($this->authHeaders($clientB))
                         ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_client_task_list_only_shows_their_own_tasks(): void
    {
        $clientA = $this->createUser('client');
        $clientB = $this->createUser('client');

        $myTask = Task::create([
            'title'     => 'My task',
            'status'    => 'pending',
            'client_id' => $clientA->id,
        ]);

        $otherTask = Task::create([
            'title'     => 'Other client task',
            'status'    => 'pending',
            'client_id' => $clientB->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($clientA))->getJson('/api/tasks');

        $response->assertStatus(200);

        $taskIds = collect($response->json('tasks'))->pluck('id');

        $this->assertTrue($taskIds->contains($myTask->id));
        $this->assertFalse($taskIds->contains($otherTask->id));
    }

    /** @test */
    public function test_client_cannot_change_task_status(): void
    {
        $client = $this->createUser('client');

        $task = Task::create([
            'title'     => 'My task',
            'status'    => 'pending',
            'client_id' => $client->id,
        ]);

        $this->withHeaders($this->authHeaders($client))
             ->patchJson("/api/tasks/{$task->id}", ['status' => 'completed']);

        // Status must not have changed — clients cannot update status
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'status' => 'pending']);
    }

    /** @test */
    public function test_client_cannot_view_all_users(): void
    {
        [$client, $headers] = $this->actingAsUser('client');

        $response = $this->withHeaders($headers)->getJson('/api/users');

        $response->assertStatus(403);
    }

    // ────────────────────────────────────────────────────────────────
    // Admin authorization
    // ────────────────────────────────────────────────────────────────

    /** @test */
    public function test_admin_can_view_all_tasks(): void
    {
        $client  = $this->createUser('client');
        $clientB = $this->createUser('client');

        Task::create(['title' => 'Task 1', 'status' => 'pending', 'client_id' => $client->id]);
        Task::create(['title' => 'Task 2', 'status' => 'pending', 'client_id' => $clientB->id]);

        [$admin, $headers] = $this->actingAsUser('admin');

        $response = $this->withHeaders($headers)->getJson('/api/tasks');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('tasks'));
    }

    /** @test */
    public function test_admin_can_manage_users(): void
    {
        [$admin, $headers] = $this->actingAsUser('admin');

        // Create user
        $response = $this->withHeaders($headers)->postJson('/api/users', [
            'name'     => 'New Worker',
            'email'    => 'newworker@app.com',
            'password' => 'password123',
            'role'     => 'worker',
        ]);

        $response->assertStatus(201)
                 ->assertJson(['user' => ['role' => 'worker']]);

        $userId = $response->json('user.id');

        // Update user
        $this->withHeaders($headers)
             ->putJson("/api/users/{$userId}", ['name' => 'Updated Name'])
             ->assertStatus(200);

        // Delete user
        $this->withHeaders($headers)
             ->deleteJson("/api/users/{$userId}")
             ->assertStatus(204);
    }

    /** @test */
    public function test_worker_cannot_access_admin_endpoints(): void
    {
        [$worker, $headers] = $this->actingAsUser('worker');

        $this->withHeaders($headers)->getJson('/api/users')->assertStatus(403);
        $this->withHeaders($headers)->postJson('/api/users', [])->assertStatus(403);
    }

    /** @test */
    public function test_client_cannot_change_their_own_role(): void
    {
        [$client, $headers] = $this->actingAsUser('client');

        // Client tries to elevate their own role — /api/users is admin-only
        $response = $this->withHeaders($headers)
                         ->putJson("/api/users/{$client->id}", ['role' => 'admin']);

        $response->assertStatus(403);

        // Verify role hasn't changed in DB
        $this->assertDatabaseHas('users', ['id' => $client->id, 'role' => 'client']);
    }

    /** @test */
    public function test_unauthenticated_request_to_protected_endpoint_returns_401(): void
    {
        $this->getJson('/api/tasks')->assertStatus(401);
        $this->getJson('/api/users')->assertStatus(401);
        $this->getJson('/api/auth/me')->assertStatus(401);
    }
}
