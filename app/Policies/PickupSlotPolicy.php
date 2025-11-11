<?php

namespace App\Policies;

use App\Models\PickupSlot;
use App\Models\User;

class PickupSlotPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Public endpoint - anyone can view slots
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PickupSlot $pickupSlot): bool
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
    public function update(User $user, PickupSlot $pickupSlot): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PickupSlot $pickupSlot): bool
    {
        return $user->isAdmin();
    }
}
