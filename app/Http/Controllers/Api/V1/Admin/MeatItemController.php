<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMeatItemBulkRequest;
use App\Http\Resources\MeatItemResource;
use App\Models\Meat;
use App\Models\MeatItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MeatItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MeatItem::with('meat');

        // Filter by meat_id if provided
        if ($request->has('meat_id') && $request->meat_id) {
            $query->where('meat_id', $request->meat_id);
        }

        // Filter by status if provided
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $items = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => MeatItemResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function show(MeatItem $meatItem): JsonResponse
    {
        return response()->json([
            'data' => new MeatItemResource($meatItem->load('meat')),
        ]);
    }

    public function bulk(StoreMeatItemBulkRequest $request): JsonResponse
    {
        $data = $request->validated();
        $meat = Meat::findOrFail($data['meat_id']);
        $items = [];
        $quantity = $data['quantity'];

        // Handle weight_kg - can be single value or array
        $weights = [];
        if (isset($data['weight_kg'])) {
            if (is_array($data['weight_kg'])) {
                $weights = $data['weight_kg'];
            } else {
                // Single value - apply to all items
                $weights = array_fill(0, $quantity, $data['weight_kg']);
            }
        }

        // Handle fixed_price - can be single value or array
        $prices = [];
        if (isset($data['fixed_price'])) {
            if (is_array($data['fixed_price'])) {
                $prices = $data['fixed_price'];
            } else {
                // Single value - apply to all items
                $prices = array_fill(0, $quantity, $data['fixed_price']);
            }
        }

        for ($i = 0; $i < $quantity; $i++) {
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

            if (isset($weights[$i]) && $weights[$i] !== null && $weights[$i] !== '') {
                $itemData['weight_kg'] = $weights[$i];
            }

            if (isset($prices[$i]) && $prices[$i] !== null && $prices[$i] !== '') {
                $itemData['fixed_price'] = $prices[$i];
            } elseif (isset($weights[$i]) && $weights[$i] && $meat->price_per_kg) {
                // Calculate price from weight and meat price_per_kg if not provided
                $itemData['fixed_price'] = round($weights[$i] * $meat->price_per_kg, 2);
            }

            $items[] = MeatItem::create($itemData);
        }

        return response()->json([
            'data' => MeatItemResource::collection($items),
            'message' => count($items) . ' peça(s) criada(s) com sucesso.',
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

    public function destroy(MeatItem $meatItem): JsonResponse
    {
        // Check if item is reserved or picked up
        if (in_array($meatItem->status, ['reserved', 'picked_up'])) {
            return response()->json([
                'message' => 'Não é possível excluir uma peça que está reservada ou já foi retirada.',
            ], 400);
        }

        $meatItem->delete();

        return response()->json([
            'message' => 'Peça excluída com sucesso.',
        ]);
    }
}
