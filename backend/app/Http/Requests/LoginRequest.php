<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for login validation.
 *
 * Why use Form Requests instead of validating in the controller?
 * - Separation of concerns: controllers handle logic, requests handle validation.
 * - Reusable: if another controller needs the same validation, import this class.
 * - Auto-returns HTTP 422 with validation errors on failure — no manual try/catch needed.
 */
class LoginRequest extends FormRequest
{
    /**
     * Anyone can attempt to login — no auth check needed here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules applied before the controller runs.
     * If validation fails, Laravel automatically returns HTTP 422.
     */
    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}
