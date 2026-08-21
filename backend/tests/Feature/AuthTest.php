<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * AuthTest — covers all authentication scenarios from the quiz brief.
 *
 * Test naming convention: test_[scenario_description]
 * PHPUnit reads method names — descriptive names make the test report self-documenting.
 */
class AuthTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────
    // Login
    // ────────────────────────────────────────────────────────────────

    /** @test */
    public function test_valid_user_can_login(): void
    {
        $user = $this->createUser('client', ['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'user'  => ['id', 'name', 'email', 'role'],
                     'token',
                 ]);
    }

    /** @test */
    public function test_invalid_credentials_are_rejected(): void
    {
        $user = $this->createUser('client');

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
                 ->assertJson(['message' => 'Invalid credentials.']);
    }

    /** @test */
    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        // 422 Unprocessable Entity — validation failed
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email', 'password']);
    }

    /** @test */
    public function test_login_rejects_invalid_email_format(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'not-an-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function test_password_is_not_returned_in_login_response(): void
    {
        $user = $this->createUser('admin', ['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200);

        // Ensure the password hash is never in the response
        $this->assertArrayNotHasKey('password', $response->json('user'));
    }

    // ────────────────────────────────────────────────────────────────
    // Profile (GET /api/auth/me)
    // ────────────────────────────────────────────────────────────────

    /** @test */
    public function test_authenticated_user_can_get_their_profile(): void
    {
        [$user, $headers] = $this->actingAsUser('client');

        $response = $this->withHeaders($headers)->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJson([
                     'user' => [
                         'id'   => $user->id,
                         'email' => $user->email,
                         'role' => 'client',
                     ],
                 ]);
    }

    /** @test */
    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        // 401 — no token provided
        $response->assertStatus(401);
    }

    /** @test */
    public function test_expired_or_invalid_token_is_rejected(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer invalid-token-string',
            'Accept'        => 'application/json',
        ])->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    // ────────────────────────────────────────────────────────────────
    // Logout
    // ────────────────────────────────────────────────────────────────

    /** @test */
    public function test_authenticated_user_can_logout(): void
    {
        [$user, $headers] = $this->actingAsUser('worker');

        $response = $this->withHeaders($headers)->postJson('/api/auth/logout');

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Logged out successfully.']);
    }

    /** @test */
    public function test_token_is_invalidated_after_logout(): void
    {
        [$user, $headers] = $this->actingAsUser('client');

        // Logout
        $this->withHeaders($headers)->postJson('/api/auth/logout');

        // Clear the cached user from the Auth guard so the next request actually checks the token
        auth()->forgetGuards();

        // Try to use the same token — should now be invalid
        $response = $this->withHeaders($headers)->getJson('/api/auth/me');
        $response->assertStatus(401);
    }

    /** @test */
    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');
        $response->assertStatus(401);
    }
}
