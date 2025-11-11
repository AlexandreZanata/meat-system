<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMeatRequest;
use App\Http\Requests\Admin\UpdateMeatRequest;
use App\Http\Resources\MeatResource;
use App\Models\Meat;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @OA\Tag(
 *     name="Admin/Meats",
 *     description="Endpoints administrativos para gerenciamento de carnes (requer autenticação e permissão de admin)"
 * )
 */
class MeatController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/v1/admin/meats",
     *     tags={"Admin/Meats"},
     *     security={{"bearerAuth":{}}},
     *     summary="Listar todas as carnes (Admin)",
     *     description="Retorna todas as carnes do sistema, incluindo inativas",
     *     @OA\Response(
     *         response=200,
     *         description="Lista de carnes",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Meat")),
     *             @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Não autenticado", @OA\JsonContent(@OA\Property(property="message", type="string", example="Unauthenticated."))),
     *     @OA\Response(response=403, description="Acesso negado - requer permissão de admin", @OA\JsonContent(@OA\Property(property="message", type="string", example="Acesso negado. Apenas administradores podem acessar este recurso.")))
     * )
     */
    public function index(): JsonResponse
    {
        try {
            $meats = Meat::withCount(['meatItems as available_count' => function ($q) {
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
        } catch (\Exception $e) {
            \Log::error('Error in MeatController@index: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Erro ao carregar carnes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/v1/admin/meats",
     *     tags={"Admin/Meats"},
     *     security={{"bearerAuth":{}}},
     *     summary="Criar nova carne (Admin)",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name"},
     *             @OA\Property(property="name", type="string", example="Picanha"),
     *             @OA\Property(property="slug", type="string", example="picanha"),
     *             @OA\Property(property="description", type="string", example="Corte nobre"),
     *             @OA\Property(property="price_per_kg", type="number", example=89.90),
     *             @OA\Property(property="image_url", type="string", example="https://example.com/image.jpg"),
     *             @OA\Property(property="is_active", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Carne criada", @OA\JsonContent(@OA\Property(property="data", ref="#/components/schemas/Meat"))),
     *     @OA\Response(response=401, description="Não autenticado"),
     *     @OA\Response(response=403, description="Acesso negado"),
     *     @OA\Response(response=422, description="Erro de validação")
     * )
     */
    public function store(StoreMeatRequest $request): JsonResponse
    {
        // Convert is_active to boolean before validation if present
        if ($request->has('is_active')) {
            $isActive = $request->input('is_active');
            // Convert to boolean: '1', 'true', 'on', 'yes', true, 1 -> true, otherwise -> false
            if (is_bool($isActive)) {
                // Already boolean
            } else {
                $isActive = in_array(strtolower(trim((string)$isActive)), ['1', 'true', 'on', 'yes'], true);
            }
            $request->merge(['is_active' => $isActive]);
        } else {
            $request->merge(['is_active' => true]); // Default to active
        }
        
        $data = $request->validated();
        
        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $extension = strtolower($image->getClientOriginalExtension());
            
            // Validar extensão
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                return response()->json([
                    'message' => 'Formato de imagem inválido. Use JPG, PNG ou WEBP.',
                ], 422);
            }
            
            // Garantir que o diretório existe
            Storage::disk('public')->makeDirectory('meats');
            
            // Gerar nome único
            $filename = Str::uuid() . '.' . $extension;
            
            // Salvar imagem no disco public dentro da pasta meats
            $path = Storage::disk('public')->putFileAs('meats', $image, $filename);
            
            // Verificar se o arquivo foi salvo
            if (!$path || !Storage::disk('public')->exists('meats/' . $filename)) {
                \Log::error('Erro: Arquivo não foi salvo', [
                    'path' => $path,
                    'filename' => $filename,
                    'disk' => 'public',
                    'full_path' => Storage::disk('public')->path('meats/' . $filename)
                ]);
                return response()->json([
                    'message' => 'Erro ao salvar imagem. Verifique as permissões do diretório.',
                ], 500);
            }
            
            // Gerar URL absoluta para a imagem
            // O arquivo está em storage/app/public/meats/filename
            // E é acessível via /storage/meats/filename através do symlink
            $baseUrl = request()->root();
            $data['image_url'] = $baseUrl . '/storage/meats/' . $filename;
            
            // Log para debug
            \Log::info('Imagem salva com sucesso', [
                'path' => $path,
                'filename' => $filename,
                'url' => $data['image_url'],
                'exists' => Storage::disk('public')->exists('meats/' . $filename),
                'size' => Storage::disk('public')->size('meats/' . $filename)
            ]);
        } elseif ($request->filled('image_url')) {
            // Se foi informada uma URL, usar diretamente
            $data['image_url'] = $request->input('image_url');
            \Log::info('URL de imagem informada', ['url' => $data['image_url']]);
        }
        
        // Remove image from data array (we only need image_url)
        unset($data['image']);
        
        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        
        // is_active is already converted to boolean before validation
        $meat = Meat::create($data);

        return response()->json([
            'data' => new MeatResource($meat),
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/admin/meats/{id}",
     *     tags={"Admin/Meats"},
     *     security={{"bearerAuth":{}}},
     *     summary="Detalhes de uma carne (Admin)",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Detalhes da carne", @OA\JsonContent(@OA\Property(property="data", ref="#/components/schemas/Meat"))),
     *     @OA\Response(response=401, description="Não autenticado"),
     *     @OA\Response(response=403, description="Acesso negado"),
     *     @OA\Response(response=404, description="Carne não encontrada")
     * )
     */
    public function show(Meat $meat): JsonResponse
    {
        $meat->loadCount(['meatItems as available_count' => function ($q) {
            $q->where('status', 'available');
        }]);

        return response()->json([
            'data' => new MeatResource($meat),
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/v1/admin/meats/{id}",
     *     tags={"Admin/Meats"},
     *     security={{"bearerAuth":{}}},
     *     summary="Atualizar carne (Admin)",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/Meat")),
     *     @OA\Response(response=200, description="Carne atualizada", @OA\JsonContent(@OA\Property(property="data", ref="#/components/schemas/Meat"))),
     *     @OA\Response(response=401, description="Não autenticado"),
     *     @OA\Response(response=403, description="Acesso negado"),
     *     @OA\Response(response=404, description="Carne não encontrada"),
     *     @OA\Response(response=422, description="Erro de validação")
     * )
     */
    public function update(UpdateMeatRequest $request, Meat $meat): JsonResponse
    {
        // Convert is_active to boolean before validation if present
        if ($request->has('is_active')) {
            $isActive = $request->input('is_active');
            // Convert to boolean: '1', 'true', 'on', 'yes', true, 1 -> true, otherwise -> false
            if (is_bool($isActive)) {
                // Already boolean
            } else {
                $isActive = in_array(strtolower(trim((string)$isActive)), ['1', 'true', 'on', 'yes'], true);
            }
            $request->merge(['is_active' => $isActive]);
        }
        
        $data = $request->validated();
        
        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($meat->image_url) {
                $oldUrl = parse_url($meat->image_url, PHP_URL_PATH);
                if ($oldUrl && str_contains($oldUrl, '/storage/meats/')) {
                    $oldFilename = basename($oldUrl);
                    Storage::disk('public')->delete('meats/' . $oldFilename);
                }
            }
            
            $image = $request->file('image');
            $extension = strtolower($image->getClientOriginalExtension());
            
            // Validar extensão
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                return response()->json([
                    'message' => 'Formato de imagem inválido. Use JPG, PNG ou WEBP.',
                ], 422);
            }
            
            // Garantir que o diretório existe
            Storage::disk('public')->makeDirectory('meats');
            
            // Gerar nome único
            $filename = Str::uuid() . '.' . $extension;
            
            // Salvar imagem no disco public dentro da pasta meats
            $path = Storage::disk('public')->putFileAs('meats', $image, $filename);
            
            // Verificar se o arquivo foi salvo
            if (!$path || !Storage::disk('public')->exists('meats/' . $filename)) {
                \Log::error('Erro: Arquivo não foi salvo', [
                    'path' => $path,
                    'filename' => $filename,
                    'disk' => 'public'
                ]);
                return response()->json([
                    'message' => 'Erro ao salvar imagem.',
                ], 500);
            }
            
            // Gerar URL absoluta para a imagem
            // O arquivo está em storage/app/public/meats/filename
            // E é acessível via /storage/meats/filename através do symlink
            $baseUrl = request()->root();
            $data['image_url'] = $baseUrl . '/storage/meats/' . $filename;
            
            // Log para debug
            \Log::info('Imagem atualizada com sucesso', [
                'path' => $path,
                'filename' => $filename,
                'url' => $data['image_url'],
                'exists' => Storage::disk('public')->exists('meats/' . $filename),
                'size' => Storage::disk('public')->size('meats/' . $filename)
            ]);
        } elseif ($request->filled('image_url')) {
            // Se foi informada uma URL, usar diretamente
            $data['image_url'] = $request->input('image_url');
            \Log::info('URL de imagem informada', ['url' => $data['image_url']]);
        }
        
        // Remove image from data array
        unset($data['image']);
        
        // Generate slug if not provided and name changed
        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        
        // is_active is already converted to boolean before validation
        $meat->update($data);

        return response()->json([
            'data' => new MeatResource($meat),
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/v1/admin/meats/{id}",
     *     tags={"Admin/Meats"},
     *     security={{"bearerAuth":{}}},
     *     summary="Remover carne (Admin)",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Carne removida", @OA\JsonContent(@OA\Property(property="message", type="string", example="Carne removida com sucesso."))),
     *     @OA\Response(response=401, description="Não autenticado"),
     *     @OA\Response(response=403, description="Acesso negado"),
     *     @OA\Response(response=404, description="Carne não encontrada")
     * )
     */
    public function destroy(Meat $meat): JsonResponse
    {
        // Deletar imagem se existir
        if ($meat->image_url) {
            $urlPath = parse_url($meat->image_url, PHP_URL_PATH);
            if ($urlPath && str_contains($urlPath, '/storage/meats/')) {
                $filename = basename($urlPath);
                Storage::disk('public')->delete('meats/' . $filename);
            }
        }
        
        $meat->delete();

        return response()->json(['message' => 'Carne removida com sucesso.']);
    }
}
