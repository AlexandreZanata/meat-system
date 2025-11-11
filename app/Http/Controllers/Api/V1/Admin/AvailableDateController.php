<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAvailableDateRequest;
use App\Http\Resources\AvailableDateResource;
use App\Models\AvailableDate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailableDateController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $dates = AvailableDate::with('creator')->orderBy('date')->paginate(12);

            return response()->json([
                'data' => AvailableDateResource::collection($dates->items()),
                'meta' => [
                    'current_page' => $dates->currentPage(),
                    'last_page' => $dates->lastPage(),
                    'per_page' => $dates->perPage(),
                    'total' => $dates->total(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in AvailableDateController@index: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Erro ao carregar datas: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(StoreAvailableDateRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        // Converter horários para formato time se necessário
        if (isset($data['opening_time']) && is_string($data['opening_time'])) {
            // Se está no formato H:i, converter para H:i:s
            if (preg_match('/^\d{2}:\d{2}$/', $data['opening_time'])) {
                $data['opening_time'] = $data['opening_time'] . ':00';
            }
        }
        
        if (isset($data['closing_time']) && is_string($data['closing_time'])) {
            // Se está no formato H:i, converter para H:i:s
            if (preg_match('/^\d{2}:\d{2}$/', $data['closing_time'])) {
                $data['closing_time'] = $data['closing_time'] . ':00';
            }
        }
        
        $date = AvailableDate::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'data' => new AvailableDateResource($date->load('creator')),
        ], 201);
    }

    public function update(StoreAvailableDateRequest $request, AvailableDate $availableDate): JsonResponse
    {
        $data = $request->validated();
        
        // Converter horários para formato time se necessário
        if (isset($data['opening_time']) && is_string($data['opening_time'])) {
            // Se está no formato H:i, converter para H:i:s
            if (preg_match('/^\d{2}:\d{2}$/', $data['opening_time'])) {
                $data['opening_time'] = $data['opening_time'] . ':00';
            }
        }
        
        if (isset($data['closing_time']) && is_string($data['closing_time'])) {
            // Se está no formato H:i, converter para H:i:s
            if (preg_match('/^\d{2}:\d{2}$/', $data['closing_time'])) {
                $data['closing_time'] = $data['closing_time'] . ':00';
            }
        }
        
        $availableDate->update($data);

        return response()->json([
            'data' => new AvailableDateResource($availableDate->load('creator')),
        ]);
    }

    public function destroy(AvailableDate $availableDate): JsonResponse
    {
        $availableDate->delete();

        return response()->json(['message' => 'Data removida com sucesso.']);
    }
}
