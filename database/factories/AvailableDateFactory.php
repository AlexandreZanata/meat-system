<?php

namespace Database\Factories;

use App\Models\AvailableDate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AvailableDateFactory extends Factory
{
    protected $model = AvailableDate::class;

    public function definition(): array
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);

        return [
            'date' => $this->faker->dateTimeBetween('+1 day', '+30 days')->format('Y-m-d'),
            'is_open' => true,
            'notes' => null,
            'created_by' => $admin->id,
        ];
    }
}
