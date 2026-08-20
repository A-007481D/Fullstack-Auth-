<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * TaskResource — shapes the task JSON response.
 *
 * Embeds related user resources (client, worker) when they are loaded.
 * Using whenLoaded() avoids N+1 queries — if the relation wasn't eager-loaded,
 * it simply omits the key rather than triggering an extra DB query.
 */
class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'client_id'   => $this->client_id,
            'worker_id'   => $this->worker_id,
            // whenLoaded: only includes this key if the relation was eager-loaded (with())
            // This prevents N+1 query problems while still embedding related data when available
            'client'      => new UserResource($this->whenLoaded('client')),
            'worker'      => new UserResource($this->whenLoaded('worker')),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}
