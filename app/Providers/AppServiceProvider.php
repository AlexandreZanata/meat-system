<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // As policies são descobertas automaticamente pelo Laravel 11
        // se seguirem a convenção de nomes (Model => Policy)
        // Exemplo: ReservationPolicy para Reservation model
    }
}
