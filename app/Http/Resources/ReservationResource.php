<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'meat_item_id' => $this->meat_item_id,
            'available_date_id' => $this->available_date_id,
            'pickup_slot_id' => $this->pickup_slot_id,
            'pickup_at' => $this->pickup_at?->toIso8601String(),
            'status' => $this->status,
            'canceled_at' => $this->canceled_at?->toIso8601String(),
            'fulfilled_at' => $this->fulfilled_at?->toIso8601String(),
            'notes' => $this->notes,
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'meat_item' => $this->whenLoaded('meatItem', fn() => new MeatItemResource($this->meatItem)),
            'available_date' => $this->whenLoaded('availableDate', fn() => new AvailableDateResource($this->availableDate)),
            'pickup_slot' => $this->whenLoaded('pickupSlot', fn() => new PickupSlotResource($this->pickupSlot)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
