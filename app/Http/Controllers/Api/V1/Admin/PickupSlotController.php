<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePickupSlotRequest;
use App\Http\Resources\PickupSlotResource;
use App\Models\PickupSlot;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PickupSlotController extends Controller
{
    public function store(StorePickupSlotRequest $request): JsonResponse
    {
        $data = $request->validated();
        // Time fields are stored as time strings, not Carbon instances
        $slot = PickupSlot::create($data);

        return response()->json([
            'data' => new PickupSlotResource($slot),
        ], 201);
    }

    public function update(StorePickupSlotRequest $request, PickupSlot $pickupSlot): JsonResponse
    {
        $data = $request->validated();
        $pickupSlot->update($data);

        return response()->json([
            'data' => new PickupSlotResource($pickupSlot),
        ]);
    }

    public function destroy(PickupSlot $pickupSlot): JsonResponse
    {
        $pickupSlot->delete();

        return response()->json(['message' => 'Horário removido com sucesso.']);
    }
}
