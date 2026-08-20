<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DatabaseSeeder — creates all test users and sample tasks.
 *
 * Run with: php artisan db:seed
 * Or fresh migration + seed: php artisan migrate:fresh --seed
 *
 * Test accounts (all passwords: "password"):
 * ┌─────────────┬──────────────────────┬──────────┐
 * │ Role        │ Email                │ Password │
 * ├─────────────┼──────────────────────┼──────────┤
 * │ Admin       │ admin@app.com        │ password │
 * │ Client      │ client@app.com       │ password │
 * │ Client 2    │ client2@app.com      │ password │
 * │ Worker      │ worker@app.com       │ password │
 * │ Worker 2    │ worker2@app.com      │ password │
 * └─────────────┴──────────────────────┴──────────┘
 *
 * Client 2 and Worker 2 exist to test data isolation:
 * - client2 should NOT be able to see client's tasks
 * - worker2 should NOT be able to see worker's tasks
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ────────────────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@app.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);

        $client = User::create([
            'name'     => 'Alice Client',
            'email'    => 'client@app.com',
            'password' => Hash::make('password'),
            'role'     => 'client',
        ]);

        $client2 = User::create([
            'name'     => 'Bob Client',
            'email'    => 'client2@app.com',
            'password' => Hash::make('password'),
            'role'     => 'client',
        ]);

        $worker = User::create([
            'name'     => 'Charlie Worker',
            'email'    => 'worker@app.com',
            'password' => Hash::make('password'),
            'role'     => 'worker',
        ]);

        $worker2 = User::create([
            'name'     => 'Diana Worker',
            'email'    => 'worker2@app.com',
            'password' => Hash::make('password'),
            'role'     => 'worker',
        ]);

        // ── Tasks ────────────────────────────────────────────────────────
        // Task 1: Client's task assigned to Worker (primary isolation test)
        $task1 = Task::create([
            'title'       => 'Build landing page',
            'description' => 'Create a responsive landing page for the product.',
            'status'      => 'in_progress',
            'client_id'   => $client->id,
            'worker_id'   => $worker->id,
        ]);

        // Task 2: Client's unassigned task
        Task::create([
            'title'       => 'Write API documentation',
            'description' => 'Document all REST endpoints with examples.',
            'status'      => 'pending',
            'client_id'   => $client->id,
            'worker_id'   => null,
        ]);

        // Task 3: Client2's task assigned to Worker2 (isolation: worker cannot see this)
        Task::create([
            'title'       => 'Set up CI/CD pipeline',
            'description' => 'Automate deployments with GitHub Actions.',
            'status'      => 'pending',
            'client_id'   => $client2->id,
            'worker_id'   => $worker2->id,
        ]);

        // Task 4: Client2's task assigned to Worker
        Task::create([
            'title'       => 'Database optimization',
            'description' => 'Add indexes and optimize slow queries.',
            'status'      => 'completed',
            'client_id'   => $client2->id,
            'worker_id'   => $worker->id,
        ]);

        $this->command->info('✅ Seeded 5 users and 4 tasks successfully.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',    'admin@app.com',   'password'],
                ['Client',   'client@app.com',  'password'],
                ['Client 2', 'client2@app.com', 'password'],
                ['Worker',   'worker@app.com',  'password'],
                ['Worker 2', 'worker2@app.com', 'password'],
            ]
        );
    }
}
