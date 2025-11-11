<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeatItemBulkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'meat_id' => ['required', 'uuid', 'exists:meats,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'weight_kg' => ['nullable', 'array'],
            'weight_kg.*' => ['nullable', 'numeric', 'min:0', 'max:999.999'],
            'fixed_price' => ['nullable', 'array'],
            'fixed_price.*' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }

    public function messages(): array
    {
        return [
            'meat_id.required' => 'O tipo de carne é obrigatório.',
            'meat_id.exists' => 'O tipo de carne selecionado não existe.',
            'quantity.required' => 'A quantidade é obrigatória.',
            'quantity.integer' => 'A quantidade deve ser um número inteiro.',
            'quantity.min' => 'A quantidade mínima é 1.',
            'quantity.max' => 'A quantidade máxima é 100.',
        ];
    }
}
