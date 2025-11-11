<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Meat extends Model
{
    use HasUuids;
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_per_kg',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_per_kg' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($meat) {
            if (empty($meat->slug)) {
                $meat->slug = Str::slug($meat->name);
            }
        });
    }

    /**
     * Get meat items
     */
    public function meatItems(): HasMany
    {
        return $this->hasMany(MeatItem::class);
    }

    /**
     * Get available meat items
     */
    public function availableItems(): HasMany
    {
        return $this->meatItems()->where('status', 'available');
    }

    /**
     * Get available items count
     */
    public function getAvailableCountAttribute(): int
    {
        return $this->availableItems()->count();
    }
}
