<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMeatItemBulkRequest;
use App\Http\Resources\MeatItemResource;
use App\Models\Meat;
use App\Models\MeatItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class MeatItemController extends Controller
{
    public function bulk(StoreMeatItemBulkRequest $request): JsonResponse
    {
        $data = $request->validated();
        $meat = Meat::findOrFail($data['meat_id']);
        $items = [];

        for ($i = 0; $i < $data['quantity']; $i++) {
            $code = 'MEAT-' . strtoupper(Str::random(8));
            
            // Ensure unique code
            while (MeatItem::where('code', $code)->exists()) {
                $code = 'MEAT-' . strtoupper(Str::random(8));
            }

            $itemData = [
                'meat_id' => $meat->id,
                'code' => $code,
                'status' => 'available',
            ];

            if (isset($data['weight_kg'][$i])) {
                $itemData['weight_kg'] = $data['weight_kg'][$i];
            }

            if (isset($data['fixed_price'][$i])) {
                $itemData['fixed_price'] = $data['fixed_price'][$i];
            }

            $items[] = MeatItem::create($itemData);
        }

        return response()->json([
            'data' => MeatItemResource::collection($items),
            'message' => count($items) . ' peças criadas com sucesso.',
        ], 201);
    }

    public function update(MeatItem $meatItem): JsonResponse
    {
        $validated = request()->validate([
            'status' => 'sometimes|in:available,reserved,picked_up,canceled',
            'weight_kg' => 'nullable|numeric|min:0|max:999.999',
            'fixed_price' => 'nullable|numeric|min:0|max:999999.99',
        ]);

        $meatItem->update($validated);

        return response()->json([
            'data' => new MeatItemResource($meatItem->load('meat')),
        ]);
    }
}
