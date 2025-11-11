<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AvailableDateResource;
use App\Http\Resources\PickupSlotResource;
use App\Models\AvailableDate;
use App\Models\PickupSlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Availability",
 *     description="Endpoints de disponibilidade e horários de retirada"
 * )
 */
class AvailabilityController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/availability/dates",
     *     tags={"Availability"},
     *     summary="Listar datas disponíveis",
     *     description="Retorna todas as datas futuras que estão abertas para agendamento",
     *     @OA\Response(
     *         response=200,
     *         description="Lista de datas disponíveis",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/AvailableDate")
     *             )
     *         )
     *     )
     * )
     */
    public function dates(): JsonResponse
    {
        // Retornar apenas datas abertas, futuras e com horários configurados
        $dates = AvailableDate::open()
            ->future()
            ->whereNotNull('opening_time')
            ->whereNotNull('closing_time')
            ->orderBy('date')
            ->get();

        return response()->json([
            'data' => AvailableDateResource::collection($dates),
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/availability/dates/{date}/slots",
     *     tags={"Availability"},
     *     summary="Listar horários de uma data",
     *     description="Retorna todos os horários de retirada disponíveis para uma data específica, incluindo capacidade e reservas",
     *     @OA\Parameter(
     *         name="date",
     *         in="path",
     *         required=true,
     *         description="Data no formato YYYY-MM-DD",
     *         @OA\Schema(type="string", format="date", example="2024-11-15")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de horários",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/PickupSlot")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Data não encontrada ou não está aberta",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\AvailableDate]")
     *         )
     *     )
     * )
     */
    public function slots(string $date): JsonResponse
    {
        $availableDate = AvailableDate::where('date', $date)
            ->where('is_open', true)
            ->firstOrFail();

        $slots = PickupSlot::where('available_date_id', $availableDate->id)
            ->withCount(['reservations as reserved_count' => function ($q) {
                $q->where('status', 'reserved');
            }])
            ->get()
            ->map(function ($slot) {
                $slot->available_capacity = max(0, $slot->capacity - $slot->reserved_count);
                return $slot;
            });

        return response()->json([
            'data' => PickupSlotResource::collection($slots),
        ]);
    }
}
