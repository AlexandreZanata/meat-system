<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MeatItem extends Model
{
    use HasUuids;
    protected $fillable = [
        'meat_id',
        'code',
        'weight_kg',
        'fixed_price',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'decimal:3',
            'fixed_price' => 'decimal:2',
        ];
    }

    /**
     * Get the meat this item belongs to
     */
    public function meat(): BelongsTo
    {
        return $this->belongsTo(Meat::class);
    }

    /**
     * Get the reservation for this item
     */
    public function reservation(): HasOne
    {
        return $this->hasOne(Reservation::class)
            ->whereIn('status', ['reserved', 'fulfilled']);
    }

    /**
     * Check if item is available
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Check if item is reserved
     */
    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }
}
