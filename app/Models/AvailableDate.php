<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AvailableDate extends Model
{
    use HasUuids;
    protected $fillable = [
        'date',
        'is_open',
        'opening_time',
        'closing_time',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_open' => 'boolean',
        ];
    }

    /**
     * Get the admin who created this date
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get pickup slots for this date
     */
    public function pickupSlots(): HasMany
    {
        return $this->hasMany(PickupSlot::class);
    }

    /**
     * Get reservations for this date
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Scope to get only open dates
     */
    public function scopeOpen($query)
    {
        return $query->where('is_open', true);
    }

    /**
     * Scope to get future dates
     */
    public function scopeFuture($query)
    {
        return $query->where('date', '>=', now()->toDateString());
    }
}
