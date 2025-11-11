<?php

namespace App\Policies;

use App\Models\Meat;
use App\Models\User;

class MeatPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Public endpoint - anyone can view meats
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Meat $meat): bool
    {
        // Public endpoint
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Meat $meat): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Meat $meat): bool
    {
        return $user->isAdmin();
    }
}
