<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes here are prefixed with /api by the bootstrap/app.php config.
|
| Route structure:
|   Public  → /api/auth/login
|   Private → everything else requires auth:sanctum middleware
|
| auth:sanctum middleware:
|   - Reads the "Authorization: Bearer <token>" header
|   - Looks up the token hash in personal_access_tokens table
|   - Injects the authenticated user into the request
|   - Returns HTTP 401 if token is missing or invalid
|
*/

// ─────────────────────────────────────────────────────────────────────────
// Public routes — no authentication required
// ─────────────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// ─────────────────────────────────────────────────────────────────────────
// Protected routes — require valid Sanctum Bearer token
// ─────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Users — admin-only (enforced via UserPolicy inside controller)
    Route::apiResource('users', UserController::class);

    // Tasks — role-aware (enforced via TaskPolicy inside controller)
    Route::apiResource('tasks', TaskController::class);
});
