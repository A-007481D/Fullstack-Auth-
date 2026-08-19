<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource — controls exactly what user data is exposed in API responses.
 *
 * Why use API Resources instead of returning $user directly?
 * - Prevents sensitive field exposure (the $hidden array on the model is a safety net,
 *   but Resources make the contract explicit and documented).
 * - Consistent response shape across all endpoints.
 * - Easy to conditionally include fields (e.g., show email only to admins).
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
