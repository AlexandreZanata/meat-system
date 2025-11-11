<?php

namespace Database\Seeders;

use App\Models\AvailableDate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AvailableDatesSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        if (!$admin) {
            $this->command->warn('Nenhum admin encontrado. Execute AdminUserSeeder primeiro.');
            return;
        }

        // Horário padrão de funcionamento: 07:00 às 14:00
        $openingTime = '07:00:00';
        $closingTime = '14:00:00';

        // Create dates for the next 30 days
        for ($i = 0; $i < 30; $i++) {
            $date = Carbon::today()->addDays($i);

            AvailableDate::updateOrCreate(
                ['date' => $date->toDateString()],
                [
                    'is_open' => true,
                    'opening_time' => $openingTime,
                    'closing_time' => $closingTime,
                    'notes' => null,
                    'created_by' => $admin->id,
                ]
            );
        }

        $this->command->info('Criadas/atualizadas 30 datas disponíveis com horário de funcionamento (07:00 às 14:00).');
    }
}
