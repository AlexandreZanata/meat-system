<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StorePickupSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'available_date_id' => ['required', 'uuid', 'exists:available_dates,id'],
            'start_at' => ['required', 'date_format:H:i'],
            'end_at' => ['required', 'date_format:H:i', 'after:start_at'],
            'capacity' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'available_date_id.required' => 'A data é obrigatória.',
            'available_date_id.exists' => 'A data selecionada não existe.',
            'start_at.required' => 'O horário de início é obrigatório.',
            'start_at.date_format' => 'O horário de início deve estar no formato HH:MM.',
            'end_at.required' => 'O horário de término é obrigatório.',
            'end_at.date_format' => 'O horário de término deve estar no formato HH:MM.',
            'end_at.after' => 'O horário de término deve ser posterior ao horário de início.',
            'capacity.required' => 'A capacidade é obrigatória.',
            'capacity.integer' => 'A capacidade deve ser um número inteiro.',
            'capacity.min' => 'A capacidade mínima é 1.',
            'capacity.max' => 'A capacidade máxima é 100.',
        ];
    }
}
