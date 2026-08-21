<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sanctum personal_access_tokens table.
 *
 * Sanctum generates opaque tokens and stores a SHA-256 hash of the token here.
 * The full token is only shown once (on creation) — even we can't reverse it from the DB.
 * This is why Bearer tokens are secure even if the DB is compromised.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');          // polymorphic: tokenable_type + tokenable_id
            $table->string('name');               // token name (e.g. "auth_token")
            $table->string('token', 64)->unique();// SHA-256 hash of the actual token
            $table->text('abilities')->nullable();// JSON array of scopes
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
