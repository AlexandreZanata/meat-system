<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PickupSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'available_date_id' => $this->available_date_id,
            'start_at' => $this->start_at instanceof \DateTime ? $this->start_at->format('H:i') : $this->start_at,
            'end_at' => $this->end_at instanceof \DateTime ? $this->end_at->format('H:i') : $this->end_at,
            'capacity' => $this->capacity,
            'reserved_count' => $this->when(isset($this->reserved_count), $this->reserved_count),
            'available_capacity' => $this->when(isset($this->available_capacity), $this->available_capacity),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
