<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Admin/Reservations",
 *     description="Endpoints administrativos para gerenciamento de reservas"
 * )
 */
class ReservationController extends Controller
{
    public function __construct(
        private ReservationService $reservationService
    ) {}

    /**
     * @OA\Get(
     *     path="/api/v1/admin/reservations",
     *     tags={"Admin/Reservations"},
     *     security={{"bearerAuth":{}}},
     *     summary="Listar todas as reservas (Admin)",
     *     description="Retorna todas as reservas do sistema com filtros opcionais",
     *     @OA\Parameter(name="status", in="query", description="Filtrar por status", @OA\Schema(type="string", enum={"reserved","canceled","fulfilled"})),
     *     @OA\Parameter(name="date", in="query", description="Filtrar por data (YYYY-MM-DD)", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="meat_id", in="query", description="Filtrar por tipo de carne (UUID)", @OA\Schema(type="string", format="uuid")),
     *     @OA\Parameter(name="user", in="query", description="Buscar por nome ou email do usuário", @OA\Schema(type="string")),
     *     @OA\Parameter(name="page", in="query", description="Número da página", @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de reservas",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Reservation")),
     *             @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Não autenticado"),
     *     @OA\Response(response=403, description="Acesso negado - requer permissão de admin")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Reservation::with(['user', 'meatItem.meat', 'availableDate', 'pickupSlot']);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date')) {
                $query->whereHas('availableDate', function ($q) use ($request) {
                    $q->where('date', $request->date);
                });
            }

            if ($request->has('meat_id')) {
                $query->whereHas('meatItem', function ($q) use ($request) {
                    $q->where('meat_id', $request->meat_id);
                });
            }

            if ($request->has('user')) {
                $query->whereHas('user', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->user . '%')
                      ->orWhere('email', 'like', '%' . $request->user . '%');
                });
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
        } catch (\Exception $e) {
            \Log::error('Error in ReservationController@index: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Erro ao carregar reservas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/v1/admin/reservations/{id}/fulfill",
     *     tags={"Admin/Reservations"},
     *     security={{"bearerAuth":{}}},
     *     summary="Concluir retirada (Admin)",
     *     description="Marca uma reserva como concluída (fulfilled) e atualiza o status da peça para 'picked_up'",
     *     @OA\Parameter(name="id", in="path", required=true, description="UUID da reserva", @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(
     *         response=200,
     *         description="Retirada concluída com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Reservation"),
     *             @OA\Property(property="message", type="string", example="Retirada concluída com sucesso.")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Reserva não pode ser concluída", @OA\JsonContent(@OA\Property(property="message", type="string", example="Apenas reservas com status 'reserved' podem ser concluídas."))),
     *     @OA\Response(response=401, description="Não autenticado"),
     *     @OA\Response(response=403, description="Acesso negado - requer permissão de admin"),
     *     @OA\Response(response=404, description="Reserva não encontrada")
     * )
     */
    public function fulfill(Reservation $reservation): JsonResponse
    {
        try {
            $reservation = $this->reservationService->fulfill($reservation);

            return response()->json([
                'data' => new ReservationResource($reservation),
                'message' => 'Retirada concluída com sucesso.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
