<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * UserFactory — generates fake users for tests.
 *
 * Used in tests via: User::factory()->create(['role' => 'worker'])
 * The factory fills in all other required fields automatically.
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'password'          => bcrypt('password'), // default test password
            'role'              => 'client',           // default role — override per test
            'email_verified_at' => now(),
            'remember_token'    => Str::random(10),
        ];
    }

    /** State: admin role */
    public function admin(): static
    {
        return $this->state(['role' => 'admin']);
    }

    /** State: worker role */
    public function worker(): static
    {
        return $this->state(['role' => 'worker']);
    }

    /** State: unverified email */
    public function unverified(): static
    {
        return $this->state(['email_verified_at' => null]);
    }
}
