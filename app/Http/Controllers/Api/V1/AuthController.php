<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * @OA\Tag(
 *     name="Auth",
 *     description="Endpoints de autenticação e gerenciamento de usuários"
 * )
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/v1/auth/register",
     *     tags={"Auth"},
     *     summary="Registrar novo usuário",
     *     description="Cria uma nova conta de cliente no sistema. Retorna o usuário criado e um token de autenticação.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password","password_confirmation"},
     *             @OA\Property(property="name", type="string", example="João Silva", description="Nome completo do usuário"),
     *             @OA\Property(property="email", type="string", format="email", example="joao@example.com", description="E-mail único do usuário"),
     *             @OA\Property(property="password", type="string", format="password", example="password123", description="Senha (mínimo 8 caracteres)"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="password123", description="Confirmação da senha"),
     *             @OA\Property(property="phone", type="string", example="(65) 99999-9999", description="Telefone (opcional)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Usuário criado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/User"),
     *             @OA\Property(property="token", type="string", example="1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="O nome é obrigatório. (e mais 2 erros)"),
     *             @OA\Property(
     *                 property="errors",
     *                 type="object",
     *                 @OA\Property(
     *                     property="name",
     *                     type="array",
     *                     @OA\Items(type="string", example="O nome é obrigatório.")
     *                 ),
     *                 @OA\Property(
     *                     property="email",
     *                     type="array",
     *                     @OA\Items(type="string", example="Este e-mail já está cadastrado.")
     *                 ),
     *                 @OA\Property(
     *                     property="password",
     *                     type="array",
     *                     @OA\Items(type="string", example="A confirmação de senha não confere.")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        // Verificar se já existe usuário com mesmo email (dupla verificação)
        if (User::where('email', $request->email)->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['Este e-mail já está cadastrado.'],
            ]);
        }

        // Verificar rate limiting por IP (máximo 3 registros por hora do mesmo IP)
        $ip = $request->ip();
        $recentRegistrations = DB::table('users')
            ->where('created_at', '>=', now()->subHour())
            ->where('created_from_ip', $ip)
            ->count();

        if ($recentRegistrations >= 3) {
            throw ValidationException::withMessages([
                'email' => ['Muitas tentativas de registro. Tente novamente mais tarde.'],
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'customer',
            'created_from_ip' => $ip,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'data' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/login",
     *     tags={"Auth"},
     *     summary="Fazer login",
     *     description="Autentica um usuário e retorna um token de acesso. O token deve ser usado no header Authorization: Bearer {token}",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="joao@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login realizado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/User"),
     *             @OA\Property(property="token", type="string", example="1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Credenciais inválidas",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="As credenciais fornecidas estão incorretas."),
     *             @OA\Property(
     *                 property="errors",
     *                 type="object",
     *                 @OA\Property(
     *                     property="email",
     *                     type="array",
     *                     @OA\Items(type="string", example="As credenciais fornecidas estão incorretas.")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="O e-mail é obrigatório."),
     *             @OA\Property(
     *                 property="errors",
     *                 type="object",
     *                 @OA\Property(
     *                     property="email",
     *                     type="array",
     *                     @OA\Items(type="string", example="O e-mail é obrigatório.")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'data' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/auth/logout",
     *     tags={"Auth"},
     *     security={{"bearerAuth":{}}},
     *     summary="Fazer logout",
     *     description="Invalida o token de autenticação atual do usuário",
     *     @OA\Response(
     *         response=200,
     *         description="Logout realizado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Logout realizado com sucesso.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    /**
     * @OA\Get(
     *     path="/api/v1/auth/me",
     *     tags={"Auth"},
     *     security={{"bearerAuth":{}}},
     *     summary="Obter perfil do usuário autenticado",
     *     description="Retorna os dados do usuário autenticado",
     *     @OA\Response(
     *         response=200,
     *         description="Perfil do usuário",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }

    /**
     * @OA\Put(
     *     path="/api/v1/auth/profile",
     *     tags={"Auth"},
     *     security={{"bearerAuth":{}}},
     *     summary="Atualizar perfil do usuário",
     *     description="Atualiza os dados do usuário autenticado",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="João Silva"),
     *             @OA\Property(property="phone", type="string", example="(65) 99999-9999"),
     *             @OA\Property(property="whatsapp", type="string", example="5565999999999"),
     *             @OA\Property(property="avatar_url", type="string", example="https://example.com/avatar.jpg")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Perfil atualizado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Não autenticado"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação"
     *     )
     * )
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'avatar_url' => ['nullable', 'string', 'max:10000'], // Aceita data URLs também
        ]);

        $user = $request->user();
        
        // Validar URL apenas se não for data URL
        if (isset($validated['avatar_url']) && $validated['avatar_url'] && !str_starts_with($validated['avatar_url'], 'data:image')) {
            if (!filter_var($validated['avatar_url'], FILTER_VALIDATE_URL)) {
                return response()->json([
                    'message' => 'A URL da imagem de perfil é inválida.',
                    'errors' => ['avatar_url' => ['A URL da imagem de perfil é inválida.']]
                ], 422);
            }
        }
        
        $user->update($validated);

        return response()->json([
            'data' => new UserResource($user->fresh()),
            'message' => 'Perfil atualizado com sucesso.',
        ]);
    }
}
