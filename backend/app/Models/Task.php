<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int         $id
 * @property string      $title
 * @property string|null $description
 * @property string      $status   — 'pending' | 'in_progress' | 'completed'
 * @property int         $client_id
 * @property int|null    $worker_id
 */
class Task extends Model
{
    use HasFactory;

    /**
     * Only these fields can be mass-assigned.
     * 'client_id' is writable here but controllers enforce ownership.
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'client_id',
        'worker_id',
    ];

    protected function casts(): array
    {
        return [
            'worker_id' => 'integer',
            'client_id' => 'integer',
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────────────────────

    /**
     * The client who created/owns this task.
     */
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * The worker assigned to this task.
     */
    public function worker()
    {
        return $this->belongsTo(User::class, 'worker_id');
    }
}
