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
        Schema::create('meat_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('meat_id');
            $table->foreign('meat_id')->references('id')->on('meats')->onDelete('cascade');
            $table->string('code')->unique();
            $table->decimal('weight_kg', 6, 3)->nullable();
            $table->decimal('fixed_price', 10, 2)->nullable();
            $table->enum('status', ['available', 'reserved', 'picked_up', 'canceled'])->default('available');
            $table->timestamps();

            $table->index('meat_id');
            $table->index('status');
            $table->index(['meat_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meat_items');
    }
};
