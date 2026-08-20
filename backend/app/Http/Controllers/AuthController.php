<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Handles authentication: login, logout, and profile retrieval.
 *
 * Authentication approach: Laravel Sanctum with opaque Bearer tokens.
 * - On login, we create a personal access token and return it to the client.
 * - The client stores this in localStorage and sends it as "Authorization: Bearer <token>" on every request.
 * - On logout, we delete the token from the DB — making it immediately invalid server-side.
 *
 * Why Sanctum over JWT?
 * - Tokens are revokable (JWT tokens can't be invalidated before expiry without a blocklist).
 * - Simpler setup — no key pairs, no expiry juggling.
 * - Ideal for SPA + REST API architecture.
 */
class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     *
     * Validates credentials, issues a Sanctum token, returns user + token.
     * HTTP 200 on success, HTTP 401 on bad credentials.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Auth::attempt() checks email + password against the DB (bcrypt comparison)
        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Delete any existing tokens to ensure single-session per user (optional but clean)
        $user->tokens()->delete();

        // Create a new Sanctum token — 'auth_token' is just a label for identification
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ], 200);
    }

    /**
     * POST /api/auth/logout
     *
     * Revokes the current token. Protected by auth:sanctum middleware.
     * HTTP 200 on success.
     */
    public function logout(Request $request): JsonResponse
    {
        // currentAccessToken() returns the token used in this request
        // We delete just this token — not all tokens (a user could have multiple devices)
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ], 200);
    }

    /**
     * GET /api/auth/me
     *
     * Returns the authenticated user's profile.
     * Protected by auth:sanctum middleware — 401 if no valid token.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ], 200);
    }
}
