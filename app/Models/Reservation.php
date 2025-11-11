<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasUuids;
    protected $fillable = [
        'user_id',
        'meat_item_id',
        'available_date_id',
        'pickup_slot_id',
        'pickup_at',
        'status',
        'canceled_at',
        'fulfilled_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'pickup_at' => 'datetime',
            'canceled_at' => 'datetime',
            'fulfilled_at' => 'datetime',
        ];
    }

    /**
     * Get the user who made this reservation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the meat item
     */
    public function meatItem(): BelongsTo
    {
        return $this->belongsTo(MeatItem::class);
    }

    /**
     * Get the available date
     */
    public function availableDate(): BelongsTo
    {
        return $this->belongsTo(AvailableDate::class);
    }

    /**
     * Get the pickup slot
     */
    public function pickupSlot(): BelongsTo
    {
        return $this->belongsTo(PickupSlot::class);
    }

    /**
     * Check if reservation is active
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['reserved', 'fulfilled']);
    }

    /**
     * Check if reservation can be canceled
     */
    public function canBeCanceled(): bool
    {
        return $this->status === 'reserved' && 
               $this->pickup_at > now();
    }

    /**
     * Scope for active reservations
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['reserved', 'fulfilled']);
    }

    /**
     * Scope for reserved status
     */
    public function scopeReserved($query)
    {
        return $query->where('status', 'reserved');
    }
}
