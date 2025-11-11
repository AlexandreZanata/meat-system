<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableDateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Formatar horários para H:i
        $openingTime = null;
        $closingTime = null;
        
        try {
            // Acessar diretamente os atributos do modelo
            $rawOpeningTime = $this->resource->getAttribute('opening_time');
            $rawClosingTime = $this->resource->getAttribute('closing_time');
            
            if ($rawOpeningTime) {
                if (is_string($rawOpeningTime)) {
                    // Se está no formato H:i:s, remover segundos
                    if (preg_match('/^(\d{2}:\d{2}):\d{2}$/', $rawOpeningTime, $matches)) {
                        $openingTime = $matches[1];
                    } elseif (preg_match('/^\d{2}:\d{2}$/', $rawOpeningTime)) {
                        $openingTime = $rawOpeningTime;
                    }
                } elseif ($rawOpeningTime instanceof \Carbon\Carbon) {
                    $openingTime = $rawOpeningTime->format('H:i');
                }
            }
            
            if ($rawClosingTime) {
                if (is_string($rawClosingTime)) {
                    // Se está no formato H:i:s, remover segundos
                    if (preg_match('/^(\d{2}:\d{2}):\d{2}$/', $rawClosingTime, $matches)) {
                        $closingTime = $matches[1];
                    } elseif (preg_match('/^\d{2}:\d{2}$/', $rawClosingTime)) {
                        $closingTime = $rawClosingTime;
                    }
                } elseif ($rawClosingTime instanceof \Carbon\Carbon) {
                    $closingTime = $rawClosingTime->format('H:i');
                }
            }
        } catch (\Exception $e) {
            // Se houver erro, usar valores null
            $openingTime = null;
            $closingTime = null;
        }
        
        return [
            'id' => $this->id,
            'date' => $this->date ? $this->date->format('Y-m-d') : null,
            'is_open' => $this->is_open ?? false,
            'opening_time' => $openingTime,
            'closing_time' => $closingTime,
            'notes' => $this->notes,
            'pickup_slots' => $this->whenLoaded('pickupSlots', fn() => PickupSlotResource::collection($this->pickupSlots)),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
