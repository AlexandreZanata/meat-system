<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeatItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'meat_id' => $this->meat_id,
            'code' => $this->code,
            'weight_kg' => $this->weight_kg ? (float) $this->weight_kg : null,
            'fixed_price' => $this->fixed_price ? (float) $this->fixed_price : null,
            'status' => $this->status,
            'meat' => $this->whenLoaded('meat', fn() => new MeatResource($this->meat)),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
