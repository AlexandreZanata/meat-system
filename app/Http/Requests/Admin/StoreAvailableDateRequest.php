<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAvailableDateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $dateId = $this->route('availableDate')?->id ?? $this->route('id');
        
        return [
            'date' => ['required', 'date', 'after_or_equal:today', Rule::unique('available_dates', 'date')->ignore($dateId)],
            'is_open' => ['boolean'],
            'opening_time' => ['nullable', 'date_format:H:i'],
            'closing_time' => ['nullable', 'date_format:H:i', 'after:opening_time'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'A data é obrigatória.',
            'date.date' => 'A data deve ser válida.',
            'date.after_or_equal' => 'A data deve ser hoje ou uma data futura.',
            'date.unique' => 'Esta data já está cadastrada.',
        ];
    }
}
