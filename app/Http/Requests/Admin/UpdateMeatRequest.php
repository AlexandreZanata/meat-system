<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMeatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $meatId = $this->route('meat')?->id ?? $this->route('id');

        // Se não tem arquivo de imagem, image_url deve ser URL válida (se fornecida)
        $imageUrlRule = ['nullable'];
        if (!$this->hasFile('image')) {
            $imageUrlRule[] = 'url';
            $imageUrlRule[] = 'max:500';
        }

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('meats', 'slug')->ignore($meatId)],
            'description' => ['nullable', 'string'],
            'price_per_kg' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'], // 5MB max
            'image_url' => $imageUrlRule,
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório.',
            'slug.unique' => 'Este slug já está em uso.',
            'price_per_kg.numeric' => 'O preço por kg deve ser um número.',
            'image_url.url' => 'A URL da imagem deve ser válida.',
        ];
    }
}
