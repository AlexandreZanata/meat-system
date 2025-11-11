<?php

namespace Database\Factories;

use App\Models\AvailableDate;
use App\Models\PickupSlot;
use Illuminate\Database\Eloquent\Factories\Factory;

class PickupSlotFactory extends Factory
{
    protected $model = PickupSlot::class;

    public function definition(): array
    {
        $startHour = $this->faker->numberBetween(9, 17);
        $startMinute = $this->faker->randomElement([0, 30]);
        $endHour = $startHour;
        $endMinute = $startMinute + 30;

        if ($endMinute >= 60) {
            $endHour++;
            $endMinute = 0;
        }

        return [
            'available_date_id' => AvailableDate::factory(),
            'start_at' => sprintf('%02d:%02d:00', $startHour, $startMinute),
            'end_at' => sprintf('%02d:%02d:00', $endHour, $endMinute),
            'capacity' => 3,
        ];
    }
}
