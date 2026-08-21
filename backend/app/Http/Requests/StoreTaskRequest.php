<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates task creation.
 * Both Admin and Client can create tasks, but:
 * - A Client's client_id is always set from the authenticated user (not from request body).
 * - An Admin can explicitly set client_id.
 * - worker_id is always Admin-only and optional.
 */
class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'worker_id'   => ['nullable', 'integer', 'exists:users,id'],
            'client_id'   => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
