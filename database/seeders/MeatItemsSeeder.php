<?php

namespace Database\Seeders;

use App\Models\Meat;
use App\Models\MeatItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MeatItemsSeeder extends Seeder
{
    public function run(): void
    {
        $meats = Meat::all();

        if ($meats->isEmpty()) {
            $this->command->warn('Nenhuma carne encontrada. Execute MeatsSeeder primeiro.');
            return;
        }

        $totalItems = 0;
        $itemsPerMeat = 20; // 20 peças por tipo de carne

        foreach ($meats as $meat) {
            for ($i = 0; $i < $itemsPerMeat; $i++) {
                $code = strtoupper($meat->slug) . '-' . Str::random(8);
                
                // Ensure unique code
                while (MeatItem::where('code', $code)->exists()) {
                    $code = strtoupper($meat->slug) . '-' . Str::random(8);
                }

                // Random weight between 1.5 and 3.5 kg
                $weight = round(1.5 + (mt_rand(0, 2000) / 1000), 3);
                
                // Calculate price if meat has price_per_kg
                $fixedPrice = $meat->price_per_kg ? round($meat->price_per_kg * $weight, 2) : null;

                MeatItem::create([
                    'meat_id' => $meat->id,
                    'code' => $code,
                    'weight_kg' => $weight,
                    'fixed_price' => $fixedPrice,
                    'status' => 'available',
                ]);

                $totalItems++;
            }
        }

        $this->command->info("Criadas {$totalItems} peças de carne.");
    }
}
