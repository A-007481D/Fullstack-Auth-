<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UserController — Admin-only user management (CRUD).
 *
 * Every method calls $this->authorize() which triggers the UserPolicy.
 * UserPolicy::before() grants admins full access.
 * Non-admins get HTTP 403 before any business logic runs.
 */
class UserController extends Controller
{
    /**
     * GET /api/users
     * List all users. Admin only.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        // Optional role filter: GET /api/users?role=worker
        $users = User::when(
            $request->query('role'),
            fn ($q, $role) => $q->where('role', $role)
        )->latest()->get();

        return response()->json([
            'users' => UserResource::collection($users),
        ], 200);
    }

    /**
     * POST /api/users
     * Create a new user. Admin only.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        // The 'password' => 'hashed' cast in User model auto-bcrypts this
        $user = User::create($request->validated());

        return response()->json([
            'message' => 'User created successfully.',
            'user'    => new UserResource($user),
        ], 201);
    }

    /**
     * GET /api/users/{user}
     * Show a single user. Admin only.
     *
     * Route model binding: Laravel automatically finds User by ID from the URL
     * and injects it. Returns 404 if not found — no manual query needed.
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'user' => new UserResource($user),
        ], 200);
    }

    /**
     * PUT /api/users/{user}
     * Update a user. Admin only.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $user->update($request->validated());

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => new UserResource($user->fresh()),
        ], 200);
    }

    /**
     * DELETE /api/users/{user}
     * Delete a user. Admin only.
     * Returns 204 No Content — the resource no longer exists.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(null, 204);
    }
}
