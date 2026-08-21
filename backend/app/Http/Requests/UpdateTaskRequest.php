<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates task updates.
 *
 * This single request class is used by all roles, but the Policy
 * (TaskPolicy::update) controls which fields each role is actually
 * allowed to modify — that enforcement happens in the controller.
 */
class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');
        return $this->user()->can('update', $task);
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status'      => ['sometimes', Rule::in(['pending', 'in_progress', 'completed'])],
            'worker_id'   => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'client_id'   => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ];
    }
}
