<?php

namespace Database\Seeders;

use App\Models\Meat;
use Illuminate\Database\Seeder;

class MeatsSeeder extends Seeder
{
    public function run(): void
    {
        $meats = [
            [
                'name' => 'Picanha',
                'slug' => 'picanha',
                'description' => 'Corte nobre e suculento, ideal para churrasco.',
                'price_per_kg' => 89.90,
                'image_url' => 'https://via.placeholder.com/400x300?text=Picanha',
                'is_active' => true,
            ],
            [
                'name' => 'Alcatra',
                'slug' => 'alcatra',
                'description' => 'Carne macia e saborosa, perfeita para grelhar.',
                'price_per_kg' => 69.90,
                'image_url' => 'https://via.placeholder.com/400x300?text=Alcatra',
                'is_active' => true,
            ],
            [
                'name' => 'Maminha',
                'slug' => 'maminha',
                'description' => 'Corte macio e suculento, excelente para assar.',
                'price_per_kg' => 79.90,
                'image_url' => 'https://via.placeholder.com/400x300?text=Maminha',
                'is_active' => true,
            ],
            [
                'name' => 'Costela',
                'slug' => 'costela',
                'description' => 'Corte tradicional e saboroso, ideal para churrasco.',
                'price_per_kg' => 59.90,
                'image_url' => 'https://via.placeholder.com/400x300?text=Costela',
                'is_active' => true,
            ],
            [
                'name' => 'Fraldinha',
                'slug' => 'fraldinha',
                'description' => 'Carne saborosa e macia, perfeita para grelhar.',
                'price_per_kg' => 64.90,
                'image_url' => 'https://via.placeholder.com/400x300?text=Fraldinha',
                'is_active' => true,
            ],
        ];

        foreach ($meats as $meat) {
            Meat::firstOrCreate(['slug' => $meat['slug']], $meat);
        }
    }
}
