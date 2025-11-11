<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\MeatController;
use App\Http\Controllers\Api\V1\AvailabilityController;
use App\Http\Controllers\Api\V1\ReservationController;
use App\Http\Controllers\Api\V1\Admin\MeatController as AdminMeatController;
use App\Http\Controllers\Api\V1\Admin\MeatItemController;
use App\Http\Controllers\Api\V1\Admin\AvailableDateController;
use App\Http\Controllers\Api\V1\Admin\PickupSlotController;
use App\Http\Controllers\Api\V1\Admin\ReservationController as AdminReservationController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::prefix('v1')->group(function () {
    // Auth (com rate limiting)
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,60');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,60');

    // Public catalog
    Route::get('/meats', [MeatController::class, 'index']);
    Route::get('/meats/{id}', [MeatController::class, 'show']);
    Route::get('/meats/{id}/items', [MeatController::class, 'items']);

    // Availability
    Route::get('/availability/dates', [AvailabilityController::class, 'dates']);
    Route::get('/availability/dates/{date}/slots', [AvailabilityController::class, 'slots']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Customer reservations
        Route::get('/reservations/my', [ReservationController::class, 'my']);
        Route::post('/reservations', [ReservationController::class, 'store']);
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Meats
            Route::apiResource('meats', AdminMeatController::class);

            // Meat Items
            Route::post('/meat-items/bulk', [MeatItemController::class, 'bulk']);
            Route::patch('/meat-items/{meatItem}', [MeatItemController::class, 'update']);

            // Available Dates
            Route::apiResource('available-dates', AvailableDateController::class);

            // Pickup Slots
            Route::post('/pickup-slots', [PickupSlotController::class, 'store']);
            Route::patch('/pickup-slots/{pickupSlot}', [PickupSlotController::class, 'update']);
            Route::delete('/pickup-slots/{pickupSlot}', [PickupSlotController::class, 'destroy']);

            // Reservations
            Route::get('/reservations', [AdminReservationController::class, 'index']);
            Route::post('/reservations/{reservation}/fulfill', [AdminReservationController::class, 'fulfill']);
        });
    });
});

