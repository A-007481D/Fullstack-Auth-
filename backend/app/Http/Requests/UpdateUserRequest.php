<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the payload when an Admin updates a user.
 *
 * Uses 'sometimes' — fields are optional (PATCH semantics).
 * Email uniqueness ignores the current user's own email via Rule::unique->ignore().
 */
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'string', 'min:8'],
            'role'     => ['sometimes', Rule::in(['admin', 'client', 'worker'])],
        ];
    }
}
