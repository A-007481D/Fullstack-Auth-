<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase; // Wraps each test in a transaction and rolls back — clean DB per test

    /**
     * Helper: create a user with the given role and return them with a Sanctum token.
     * Used across all feature tests to quickly bootstrap authenticated requests.
     */
    protected function createUser(string $role, array $attributes = []): User
    {
        return User::factory()->create(array_merge(['role' => $role], $attributes));
    }

    /**
     * Helper: return auth headers for a user.
     * Tests use this for requests: $this->withHeaders($this->authHeaders($user))
     */
    protected function authHeaders(User $user): array
    {
        $token = $user->createToken('test_token')->plainTextToken;

        return [
            'Authorization' => "Bearer {$token}",
            'Accept'        => 'application/json',
        ];
    }

    /**
     * Shorthand: get a user + make an authenticated GET request.
     */
    protected function actingAsUser(string $role, array $attributes = []): array
    {
        $user = $this->createUser($role, $attributes);

        return [$user, $this->authHeaders($user)];
    }
}
