<?php

namespace Tests\Feature;

use App\Models\AvailableDate;
use App\Models\MeatItem;
use App\Models\PickupSlot;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private ReservationService $service;
    private User $user1;
    private User $user2;
    private MeatItem $meatItem;
    private AvailableDate $availableDate;
    private PickupSlot $pickupSlot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(ReservationService::class);

        // Create users
        $this->user1 = User::factory()->create(['role' => 'customer']);
        $this->user2 = User::factory()->create(['role' => 'customer']);

        // Create admin for available date
        $admin = User::factory()->create(['role' => 'admin']);

        // Create meat item
        $meat = \App\Models\Meat::factory()->create();
        $this->meatItem = MeatItem::factory()->create([
            'meat_id' => $meat->id,
            'status' => 'available',
        ]);

        // Create available date
        $this->availableDate = AvailableDate::factory()->create([
            'created_by' => $admin->id,
            'is_open' => true,
        ]);

        // Create pickup slot
        $this->pickupSlot = PickupSlot::factory()->create([
            'available_date_id' => $this->availableDate->id,
            'capacity' => 1, // Only 1 capacity to test conflict
        ]);
    }

    public function test_concurrent_reservations_only_one_succeeds(): void
    {
        $data = [
            'meat_item_id' => $this->meatItem->id,
            'available_date_id' => $this->availableDate->id,
            'pickup_slot_id' => $this->pickupSlot->id,
        ];

        // Simulate concurrent requests
        $results = [];
        $exceptions = [];

        // First reservation should succeed
        try {
            $reservation1 = $this->service->create($data, $this->user1);
            $results[] = $reservation1;
        } catch (\Exception $e) {
            $exceptions[] = $e;
        }

        // Second reservation should fail with 409
        try {
            $reservation2 = $this->service->create($data, $this->user2);
            $results[] = $reservation2;
        } catch (\Exception $e) {
            $exceptions[] = $e;
        }

        // Assert only one reservation was created
        $this->assertCount(1, $results);
        $this->assertCount(1, $exceptions);
        $this->assertEquals(409, $exceptions[0]->getCode());
        $this->assertStringContainsString('não está disponível', $exceptions[0]->getMessage());

        // Verify meat item status
        $this->meatItem->refresh();
        $this->assertEquals('reserved', $this->meatItem->status);

        // Verify only one reservation exists
        $this->assertEquals(1, Reservation::where('meat_item_id', $this->meatItem->id)->count());
    }

    public function test_cancel_reservation_releases_meat_item(): void
    {
        // Create reservation
        $reservation = $this->service->create([
            'meat_item_id' => $this->meatItem->id,
            'available_date_id' => $this->availableDate->id,
            'pickup_slot_id' => $this->pickupSlot->id,
        ], $this->user1);

        // Verify meat item is reserved
        $this->meatItem->refresh();
        $this->assertEquals('reserved', $this->meatItem->status);

        // Cancel reservation
        $this->service->cancel($reservation);

        // Verify meat item is available again
        $this->meatItem->refresh();
        $this->assertEquals('available', $this->meatItem->status);

        // Verify reservation status
        $reservation->refresh();
        $this->assertEquals('canceled', $reservation->status);
        $this->assertNotNull($reservation->canceled_at);
    }
}
