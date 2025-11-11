<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCustomer() ?? false;
    }

    public function rules(): array
    {
        return [
            'meat_item_id' => ['required', 'uuid', 'exists:meat_items,id'],
            'available_date_id' => ['required', 'uuid', 'exists:available_dates,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'meat_item_id.required' => 'A peça de carne é obrigatória.',
            'meat_item_id.exists' => 'A peça selecionada não existe.',
            'available_date_id.required' => 'A data é obrigatória.',
            'available_date_id.exists' => 'A data selecionada não existe.',
            'pickup_slot_id.required' => 'O horário é obrigatório.',
            'pickup_slot_id.exists' => 'O horário selecionado não existe.',
        ];
    }
}
