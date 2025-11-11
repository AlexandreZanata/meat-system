<?php

namespace Database\Factories;

use App\Models\Meat;
use App\Models\MeatItem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MeatItemFactory extends Factory
{
    protected $model = MeatItem::class;

    public function definition(): array
    {
        return [
            'meat_id' => Meat::factory(),
            'code' => 'MEAT-' . strtoupper(Str::random(8)),
            'weight_kg' => $this->faker->randomFloat(3, 1.5, 3.5),
            'fixed_price' => $this->faker->randomFloat(2, 100, 500),
            'status' => 'available',
        ];
    }
}
