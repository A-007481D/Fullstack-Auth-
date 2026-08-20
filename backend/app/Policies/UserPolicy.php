<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * UserPolicy — Admin-only user management.
 *
 * All user CRUD operations are restricted to Admins.
 * A Client or Worker hitting any user management endpoint gets HTTP 403.
 */
class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Before hook — if user is admin, they bypass all other checks.
     * This is a Laravel Policy "before" method — runs before any other method.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true; // Admin passes everything — no need to check individual methods
        }

        return null; // null means "continue to the individual method check"
    }

    public function viewAny(User $user): bool
    {
        return false; // Non-admins never reach here due to before() returning null → false
    }

    public function view(User $user, User $model): bool
    {
        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, User $model): bool
    {
        return false;
    }

    public function delete(User $user, User $model): bool
    {
        return false;
    }
}
