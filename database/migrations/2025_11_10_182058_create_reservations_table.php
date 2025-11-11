<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('meat_item_id');
            $table->foreign('meat_item_id')->references('id')->on('meat_items')->onDelete('restrict');
            $table->uuid('available_date_id');
            $table->foreign('available_date_id')->references('id')->on('available_dates')->onDelete('restrict');
            $table->uuid('pickup_slot_id');
            $table->foreign('pickup_slot_id')->references('id')->on('pickup_slots')->onDelete('restrict');
            $table->dateTime('pickup_at');
            $table->enum('status', ['reserved', 'canceled', 'fulfilled'])->default('reserved');
            $table->dateTime('canceled_at')->nullable();
            $table->dateTime('fulfilled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('meat_item_id');
            $table->index(['available_date_id', 'pickup_slot_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
