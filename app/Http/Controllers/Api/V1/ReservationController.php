<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Reservations",
 *     description="Endpoints de reservas (cliente)"
 * )
 */
class ReservationController extends Controller
{
    public function __construct(
        private ReservationService $reservationService
    ) {}

    /**
     * @OA\Post(
     *     path="/api/v1/reservations",
     *     tags={"Reservations"},
     *     security={{"bearerAuth":{}}},
     *     summary="Criar nova reserva",
     *     description="Cria uma nova reserva de uma peça de carne. A peça deve estar disponível e o horário deve ter capacidade. Usa transações com locks para evitar reservas duplicadas.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"meat_item_id","available_date_id","pickup_slot_id"},
     *             @OA\Property(property="meat_item_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000", description="UUID da peça de carne"),
     *             @OA\Property(property="available_date_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440001", description="UUID da data disponível"),
     *             @OA\Property(property="pickup_slot_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440002", description="UUID do horário de retirada"),
     *             @OA\Property(property="notes", type="string", example="Observações opcionais", description="Observações sobre a reserva (opcional)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Reserva criada com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Reservation")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Erro na requisição",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Esta data não está aberta para agendamentos.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Acesso negado - apenas clientes podem criar reservas",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="This action is unauthorized.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=409,
     *         description="Conflito - peça ou horário indisponível",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Esta peça não está disponível para reserva.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="A peça de carne é obrigatória. (e mais 2 erros)"),
     *             @OA\Property(
     *                 property="errors",
     *                 type="object",
     *                 @OA\Property(
     *                     property="meat_item_id",
     *                     type="array",
     *                     @OA\Items(type="string", example="A peça selecionada não existe.")
     *                 ),
     *                 @OA\Property(
     *                     property="available_date_id",
     *                     type="array",
     *                     @OA\Items(type="string", example="A data selecionada não existe.")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function store(StoreReservationRequest $request): JsonResponse
    {
        try {
            $reservation = $this->reservationService->create(
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'data' => new ReservationResource($reservation),
            ], 201);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return response()->json([
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/v1/reservations/my",
     *     tags={"Reservations"},
     *     security={{"bearerAuth":{}}},
     *     summary="Listar minhas reservas",
     *     description="Retorna todas as reservas do usuário autenticado, com paginação",
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filtrar por status",
     *         required=false,
     *         @OA\Schema(type="string", enum={"reserved","canceled","fulfilled"}, example="reserved")
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número da página",
     *         required=false,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de reservas",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/Reservation")
     *             ),
     *             @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
     */
    public function my(Request $request): JsonResponse
    {
        $query = Reservation::where('user_id', $request->user()->id)
            ->with(['meatItem.meat', 'availableDate', 'pickupSlot']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reservations = $query->orderBy('created_at', 'desc')->paginate(12);

        return response()->json([
            'data' => ReservationResource::collection($reservations->items()),
            'meta' => [
                'current_page' => $reservations->currentPage(),
                'last_page' => $reservations->lastPage(),
                'per_page' => $reservations->perPage(),
                'total' => $reservations->total(),
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/reservations/{id}",
     *     tags={"Reservations"},
     *     security={{"bearerAuth":{}}},
     *     summary="Detalhes de uma reserva",
     *     description="Retorna os detalhes completos de uma reserva. Apenas o dono da reserva ou admin pode visualizar.",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID da reserva",
     *         @OA\Schema(type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Detalhes da reserva",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Reservation")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Acesso negado - não é o dono da reserva",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="This action is unauthorized.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Reserva não encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Reservation] {id}")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
     */
    public function show(Reservation $reservation, Request $request): JsonResponse
    {
        $this->authorize('view', $reservation);

        $reservation->load(['meatItem.meat', 'availableDate', 'pickupSlot', 'user']);

        return response()->json([
            'data' => new ReservationResource($reservation),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/reservations/{id}/cancel",
     *     tags={"Reservations"},
     *     security={{"bearerAuth":{}}},
     *     summary="Cancelar uma reserva",
     *     description="Cancela uma reserva. Apenas o dono pode cancelar e apenas se estiver com status 'reserved' e antes do horário de retirada. A peça volta para 'available'.",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID da reserva",
     *         @OA\Schema(type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Reserva cancelada com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Reservation"),
     *             @OA\Property(property="message", type="string", example="Reserva cancelada com sucesso.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Reserva não pode ser cancelada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Esta reserva não pode ser cancelada.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Acesso negado - não é o dono da reserva",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="This action is unauthorized.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Reserva não encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Reservation] {id}")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
     */
    public function cancel(Reservation $reservation, Request $request): JsonResponse
    {
        // Verificar se o usuário tem permissão para cancelar esta reserva
        // (apenas o dono da reserva pode cancelar)
        $this->authorize('cancel', $reservation);

        try {
            $reservation = $this->reservationService->cancel($reservation);

            return response()->json([
                'data' => new ReservationResource($reservation),
                'message' => 'Reserva cancelada com sucesso.',
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            return response()->json([
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}
