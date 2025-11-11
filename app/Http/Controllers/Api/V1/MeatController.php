<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeatResource;
use App\Models\Meat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Meats",
 *     description="Endpoints públicos do catálogo de carnes"
 * )
 */
class MeatController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/meats",
     *     tags={"Meats"},
     *     summary="Listar carnes disponíveis",
     *     description="Retorna uma lista paginada de carnes disponíveis. Por padrão, retorna apenas carnes ativas.",
     *     @OA\Parameter(
     *         name="q",
     *         in="query",
     *         description="Busca por nome (busca parcial)",
     *         required=false,
     *         @OA\Schema(type="string", example="picanha")
     *     ),
     *     @OA\Parameter(
     *         name="active",
     *         in="query",
     *         description="Filtrar por status ativo (true/false). Se não informado, retorna apenas ativas.",
     *         required=false,
     *         @OA\Schema(type="boolean", example=true)
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
     *         description="Lista de carnes",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/Meat")
     *             ),
     *             @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $query = Meat::query();

        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        } else {
            $query->where('is_active', true);
        }

        // Load available count
        $meats = $query->withCount(['meatItems as available_count' => function ($q) {
            $q->where('status', 'available');
        }])->paginate(12);

        return response()->json([
            'data' => MeatResource::collection($meats->items()),
            'meta' => [
                'current_page' => $meats->currentPage(),
                'last_page' => $meats->lastPage(),
                'per_page' => $meats->perPage(),
                'total' => $meats->total(),
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/meats/{id}",
     *     tags={"Meats"},
     *     summary="Detalhes de uma carne",
     *     description="Retorna os detalhes completos de uma carne, incluindo peças disponíveis",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID da carne",
     *         @OA\Schema(type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Detalhes da carne",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/Meat")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Carne não encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Meat] {id}")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="UUID inválido",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="The id must be a valid UUID.")
     *         )
     *     )
     * )
     */
    public function show(string $id): JsonResponse
    {
        $meat = Meat::withCount(['meatItems as available_count' => function ($q) {
            $q->where('status', 'available');
        }])->with(['meatItems' => function ($q) {
            $q->where('status', 'available')->limit(20);
        }])->findOrFail($id);

        return response()->json([
            'data' => new MeatResource($meat),
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/meats/{id}/items",
     *     tags={"Meats"},
     *     summary="Listar peças disponíveis de uma carne",
     *     description="Retorna todas as peças disponíveis de um tipo de carne específico",
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="UUID da carne",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de peças disponíveis",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/MeatItem")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Carne não encontrada")
     * )
     */
    public function items(string $id): JsonResponse
    {
        $meat = Meat::findOrFail($id);
        
        $items = $meat->meatItems()
            ->where('status', 'available')
            ->get();

        return response()->json([
            'data' => \App\Http\Resources\MeatItemResource::collection($items),
        ]);
    }
}
