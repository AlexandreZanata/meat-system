<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Admin can view all, customers can view their own (handled in controller)
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin() || $reservation->user_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isCustomer();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can cancel the reservation.
     * Verifica apenas se o usuário é o dono da reserva.
     * A validação de negócio (se a reserva pode ser cancelada) é feita no service.
     */
    public function cancel(User $user, Reservation $reservation): bool
    {
        // Apenas o dono da reserva pode cancelar
        return $reservation->user_id === $user->id;
    }

    /**
     * Determine whether the user can fulfill the reservation.
     */
    public function fulfill(User $user, Reservation $reservation): bool
    {
        return $user->isAdmin();
    }
}
