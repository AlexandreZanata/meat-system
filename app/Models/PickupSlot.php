<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PickupSlot extends Model
{
    use HasUuids;
    protected $fillable = [
        'available_date_id',
        'start_at',
        'end_at',
        'capacity',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
        ];
    }

    /**
     * Get the available date this slot belongs to
     */
    public function availableDate(): BelongsTo
    {
        return $this->belongsTo(AvailableDate::class);
    }

    /**
     * Get reservations for this slot
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Get active reservations count
     */
    public function getReservedCountAttribute(): int
    {
        return $this->reservations()
            ->where('status', 'reserved')
            ->count();
    }

    /**
     * Get available capacity
     */
    public function getAvailableCapacityAttribute(): int
    {
        return max(0, $this->capacity - $this->reserved_count);
    }

    /**
     * Check if slot has available capacity
     */
    public function hasAvailableCapacity(): bool
    {
        return $this->available_capacity > 0;
    }
}
