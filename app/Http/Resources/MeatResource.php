<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Garantir que a URL da imagem seja absoluta
        $imageUrl = $this->image_url;
        $originalUrl = $imageUrl;
        
        if ($imageUrl) {
            // Se já for URL absoluta (http:// ou https://), usar como está
            if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                // Já é URL absoluta, usar como está
            } elseif (str_starts_with($imageUrl, '/storage/')) {
                // Caminho relativo começando com /storage/ - usar request()->root() para pegar porta correta
                $baseUrl = request()->root();
                $imageUrl = $baseUrl . $imageUrl;
            } elseif (str_starts_with($imageUrl, 'storage/')) {
                // Caminho relativo começando com storage/
                $baseUrl = request()->root();
                $imageUrl = $baseUrl . '/' . $imageUrl;
            } elseif (!empty($imageUrl)) {
                // Outro caminho relativo
                $baseUrl = request()->root();
                if (!str_starts_with($imageUrl, '/')) {
                    $imageUrl = $baseUrl . '/' . $imageUrl;
                } else {
                    $imageUrl = $baseUrl . $imageUrl;
                }
            }
            
            // Log para debug
            \Log::info('MeatResource - Normalizando URL', [
                'meat_id' => $this->id,
                'meat_name' => $this->name,
                'original_url' => $originalUrl,
                'normalized_url' => $imageUrl,
                'base_url' => request()->root()
            ]);
        }
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price_per_kg' => $this->price_per_kg ? (float) $this->price_per_kg : null,
            'image_url' => $imageUrl,
            'is_active' => $this->is_active,
            'available_count' => $this->when(isset($this->available_count), $this->available_count),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
