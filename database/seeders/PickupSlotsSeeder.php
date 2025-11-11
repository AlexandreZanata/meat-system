<?php

namespace Database\Seeders;

use App\Models\AvailableDate;
use App\Models\PickupSlot;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PickupSlotsSeeder extends Seeder
{
    public function run(): void
    {
        $availableDates = AvailableDate::all();

        if ($availableDates->isEmpty()) {
            $this->command->warn('Nenhuma data disponível encontrada. Execute AvailableDatesSeeder primeiro.');
            return;
        }

        $totalSlots = 0;

        foreach ($availableDates as $date) {
            // Create slots from 09:00 to 18:00 with 30-minute intervals
            $startTime = Carbon::parse('09:00');
            $endTime = Carbon::parse('18:00');

            while ($startTime < $endTime) {
                $slotEnd = $startTime->copy()->addMinutes(30);

                PickupSlot::firstOrCreate(
                    [
                        'available_date_id' => $date->id,
                        'start_at' => $startTime->toTimeString(),
                        'end_at' => $slotEnd->toTimeString(),
                    ],
                    [
                        'capacity' => 3,
                    ]
                );

                $startTime->addMinutes(30);
                $totalSlots++;
            }
        }

        $this->command->info("Criados {$totalSlots} horários de retirada.");
    }
}
