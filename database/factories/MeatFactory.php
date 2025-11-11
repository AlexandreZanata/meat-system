<?php

namespace Database\Factories;

use App\Models\Meat;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MeatFactory extends Factory
{
    protected $model = Meat::class;

    public function definition(): array
    {
        $name = $this->faker->words(2, true);
        
        return [
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => $this->faker->sentence(),
            'price_per_kg' => $this->faker->randomFloat(2, 50, 150),
            'image_url' => 'https://via.placeholder.com/400x300',
            'is_active' => true,
        ];
    }
}
