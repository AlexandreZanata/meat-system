<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAvailableDateRequest;
use App\Http\Resources\AvailableDateResource;
use App\Models\AvailableDate;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'message' => 'Não foi possível carregar as datas. Por favor, tente novamente.',
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

    public function show(AvailableDate $availableDate): JsonResponse
    {
        return response()->json([
            'data' => new AvailableDateResource($availableDate->load('creator')),
        ]);
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
        try {
            DB::beginTransaction();

            // Verificar se há reservas associadas
            $reservations = Reservation::where('available_date_id', $availableDate->id)->get();
            $dateFormatted = $availableDate->date->format('d/m/Y');
            $canceledCount = 0;
            
            if ($reservations->count() > 0) {
                // Fazer backup: cancelar reservas ativas e adicionar nota
                foreach ($reservations as $reservation) {
                    if ($reservation->status === 'reserved') {
                        $reservation->status = 'canceled';
                        $reservation->canceled_at = now();
                        $originalNotes = $reservation->notes ?? '';
                        $backupNote = "Reserva cancelada automaticamente devido à exclusão da data de retirada ({$dateFormatted}).";
                        $reservation->notes = $originalNotes 
                            ? $originalNotes . "\n\n" . $backupNote 
                            : $backupNote;
                        $reservation->save();
                        $canceledCount++;
                    }
                }
                
                // Liberar as peças de carne das reservas canceladas
                foreach ($reservations as $reservation) {
                    if ($reservation->status === 'canceled' && $reservation->meatItem) {
                        $reservation->meatItem->status = 'available';
                        $reservation->meatItem->save();
                    }
                }
                
                // Para permitir exclusão mesmo com reservas associadas
                // Desabilitar foreign key checks temporariamente (funciona para MySQL e SQLite)
                $driver = DB::getDriverName();
                
                if ($driver === 'sqlite') {
                    // SQLite: desabilitar foreign keys usando PRAGMA
                    DB::statement('PRAGMA foreign_keys = OFF');
                } else {
                    // MySQL: desabilitar foreign key checks
                    DB::statement('SET FOREIGN_KEY_CHECKS=0');
                }
            }

            // Excluir a data
        $availableDate->delete();

            // Reativar foreign key checks
            if ($reservations->count() > 0) {
                $driver = DB::getDriverName();
                if ($driver === 'sqlite') {
                    DB::statement('PRAGMA foreign_keys = ON');
                } else {
                    DB::statement('SET FOREIGN_KEY_CHECKS=1');
                }
            }

            DB::commit();

            $message = 'Data excluída com sucesso.';
            if ($canceledCount > 0) {
                $message .= " {$canceledCount} reserva(s) foram canceladas e permanecem visíveis no histórico.";
            }

            return response()->json(['message' => $message]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Reativar foreign key checks em caso de erro
            $driver = DB::getDriverName();
            try {
                if ($driver === 'sqlite') {
                    DB::statement('PRAGMA foreign_keys = ON');
                } else {
                    DB::statement('SET FOREIGN_KEY_CHECKS=1');
                }
            } catch (\Exception $e2) {
                // Ignorar erro ao reativar checks
            }
            
            \Log::error('Error deleting available date: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Não foi possível excluir a data. Verifique se não há reservas associadas ou tente novamente.'
            ], 500);
        }
    }
}
