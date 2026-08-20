<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the tasks table.
 *
 * Design decisions:
 * - 'status' defaults to 'pending' — the natural initial state of any request.
 * - 'worker_id' is nullable — tasks can exist without being assigned yet.
 * - Both FKs use onDelete('set null') / onDelete('cascade') depending on business logic:
 *   If a client is deleted, their tasks cascade-delete (orphaned tasks have no owner).
 *   If a worker is deleted, the task stays but worker_id becomes null (task unassigned).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending | in_progress | completed

            // Foreign keys — constrained() links to the 'users' table 'id' column
            $table->foreignId('client_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('worker_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
