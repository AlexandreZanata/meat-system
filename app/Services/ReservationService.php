<?php

namespace App\Services;

use App\Models\MeatItem;
use App\Models\PickupSlot;
use App\Models\Reservation;
use App\Models\AvailableDate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReservationService
{
    /**
     * Create a reservation with transaction and locks
     *
     * @throws \Exception
     */
    public function create(array $data, User $user): Reservation
    {
        return DB::transaction(function () use ($data, $user) {
            // Lock the meat item for update
            $meatItem = MeatItem::lockForUpdate()
                ->findOrFail($data['meat_item_id']);

            // Check if meat item is available
            if (!$meatItem->isAvailable()) {
                throw new \Exception('Esta peça não está disponível para reserva.', 409);
            }

            // Check if there's already an active reservation for this item
            $existingReservation = Reservation::where('meat_item_id', $meatItem->id)
                ->whereIn('status', ['reserved', 'fulfilled'])
                ->first();

            if ($existingReservation) {
                throw new \Exception('Esta peça já possui uma reserva ativa.', 409);
            }

            // Validate available date
            $availableDate = AvailableDate::findOrFail($data['available_date_id']);
            if (!$availableDate->is_open) {
                throw new \Exception('Esta data não está aberta para agendamentos.', 400);
            }

            // Usar a data diretamente (sem horário específico)
            $pickupAt = Carbon::parse($availableDate->date)->startOfDay();

            // Criar um slot temporário ou usar o primeiro disponível
            $pickupSlot = $availableDate->pickupSlots()->first();
            if (!$pickupSlot) {
                // Criar slot padrão para a data (dia inteiro)
                $pickupSlot = \App\Models\PickupSlot::create([
                    'available_date_id' => $availableDate->id,
                    'start_at' => '00:00:00',
                    'end_at' => '23:59:59',
                    'capacity' => 999, // Capacidade ilimitada
                ]);
            }

            // Create reservation
            $reservation = Reservation::create([
                'user_id' => $user->id,
                'meat_item_id' => $meatItem->id,
                'available_date_id' => $availableDate->id,
                'pickup_slot_id' => $pickupSlot->id,
                'pickup_at' => $pickupAt,
                'status' => 'reserved',
                'notes' => $data['notes'] ?? null,
            ]);

            // Update meat item status
            $meatItem->update(['status' => 'reserved']);

            // Load relationships
            $reservation->load(['meatItem.meat', 'availableDate', 'pickupSlot', 'user']);

            return $reservation;
        });
    }

    /**
     * Cancel a reservation
     */
    public function cancel(Reservation $reservation): Reservation
    {
        return DB::transaction(function () use ($reservation) {
            if (!$reservation->canBeCanceled()) {
                throw new \Exception('Esta reserva não pode ser cancelada.', 400);
            }

            $reservation->update([
                'status' => 'canceled',
                'canceled_at' => now(),
            ]);

            // Release meat item
            $reservation->meatItem->update(['status' => 'available']);

            $reservation->load(['meatItem.meat', 'availableDate', 'pickupSlot', 'user']);

            return $reservation;
        });
    }

    /**
     * Fulfill a reservation (admin only)
     */
    public function fulfill(Reservation $reservation): Reservation
    {
        return DB::transaction(function () use ($reservation) {
            if ($reservation->status !== 'reserved') {
                throw new \Exception('Apenas reservas com status "reserved" podem ser concluídas.', 400);
            }

            $reservation->update([
                'status' => 'fulfilled',
                'fulfilled_at' => now(),
            ]);

            // Update meat item status
            $reservation->meatItem->update(['status' => 'picked_up']);

            $reservation->load(['meatItem.meat', 'availableDate', 'pickupSlot', 'user']);

            return $reservation;
        });
    }
}

