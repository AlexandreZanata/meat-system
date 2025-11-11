<?php

namespace App\Policies;

use App\Models\AvailableDate;
use App\Models\User;

class AvailableDatePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Public endpoint - anyone can view available dates
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AvailableDate $availableDate): bool
    {
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
    public function update(User $user, AvailableDate $availableDate): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AvailableDate $availableDate): bool
    {
        return $user->isAdmin();
    }
}
