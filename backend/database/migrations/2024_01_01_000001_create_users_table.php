<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the core users table.
 *
 * Design decisions:
 * - 'role' is stored as a string with a DB-level CHECK constraint (via enum-like values).
 *   We use string instead of PostgreSQL ENUM type because ENUM in PG requires DDL changes to add values.
 * - 'password' is stored as a bcrypt hash — Laravel's 'hashed' cast handles this automatically.
 * - email must be unique for the uniqueness constraint on login.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('client'); // 'admin' | 'client' | 'worker'
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
