<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int    $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property string $role  — 'admin' | 'client' | 'worker'
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mass-assignment whitelist.
     * Only these fields can be set via create() or fill().
     * This prevents the role field from being changed by end users via request body.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * Fields excluded from serialization (API responses, toArray, etc.).
     * Ensures passwords and token fields never leak in JSON output.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting — Laravel automatically converts these on read/write.
     * 'password' => 'hashed' means bcrypt runs automatically on assignment.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────

    /**
     * Tasks created by this user (as a client).
     */
    public function clientTasks()
    {
        return $this->hasMany(Task::class, 'client_id');
    }

    /**
     * Tasks assigned to this user (as a worker).
     */
    public function workerTasks()
    {
        return $this->hasMany(Task::class, 'worker_id');
    }

    // ─────────────────────────────────────────────────────────────
    // Role helpers
    // ─────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    public function isWorker(): bool
    {
        return $this->role === 'worker';
    }
}
