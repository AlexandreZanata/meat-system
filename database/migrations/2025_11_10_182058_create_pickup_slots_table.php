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
        Schema::create('pickup_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('available_date_id');
            $table->foreign('available_date_id')->references('id')->on('available_dates')->onDelete('cascade');
            $table->time('start_at');
            $table->time('end_at');
            $table->integer('capacity')->default(1);
            $table->timestamps();

            $table->index(['available_date_id', 'start_at', 'end_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pickup_slots');
    }
};
