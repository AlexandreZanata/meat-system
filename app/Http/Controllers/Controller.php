<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * @OA\Info(
 *     title="Sistema de Agendamento de Carnes API",
 *     version="1.0.0",
 *     description="API REST para sistema de agendamento e reserva de carnes",
 *     @OA\Contact(
 *         email="admin@local.test"
 *     )
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 *
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="name", type="string", example="João Silva"),
 *     @OA\Property(property="email", type="string", format="email", example="joao@example.com"),
 *     @OA\Property(property="phone", type="string", nullable=true, example="(65) 99999-9999"),
 *     @OA\Property(property="role", type="string", enum={"admin","customer"}, example="customer"),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="Meat",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="name", type="string", example="Picanha"),
 *     @OA\Property(property="slug", type="string", example="picanha"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="price_per_kg", type="number", format="float", nullable=true, example=89.90),
 *     @OA\Property(property="image_url", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="available_count", type="integer", example=15)
 * )
 *
 * @OA\Schema(
 *     schema="MeatItem",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="meat_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="code", type="string", example="PICANHA-ABC12345"),
 *     @OA\Property(property="weight_kg", type="number", format="float", nullable=true, example=2.5),
 *     @OA\Property(property="fixed_price", type="number", format="float", nullable=true, example=224.75),
 *     @OA\Property(property="status", type="string", enum={"available","reserved","picked_up","canceled"}, example="available")
 * )
 *
 * @OA\Schema(
 *     schema="AvailableDate",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="date", type="string", format="date", example="2024-11-15"),
 *     @OA\Property(property="is_open", type="boolean", example=true),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="PickupSlot",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="available_date_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="start_at", type="string", example="09:00"),
 *     @OA\Property(property="end_at", type="string", example="09:30"),
 *     @OA\Property(property="capacity", type="integer", example=3),
 *     @OA\Property(property="reserved_count", type="integer", example=1),
 *     @OA\Property(property="available_capacity", type="integer", example=2)
 * )
 *
 * @OA\Schema(
 *     schema="Reservation",
 *     type="object",
 *     @OA\Property(property="id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="user_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="meat_item_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="available_date_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="pickup_slot_id", type="string", format="uuid", example="550e8400-e29b-41d4-a716-446655440000"),
 *     @OA\Property(property="pickup_at", type="string", format="date-time"),
 *     @OA\Property(property="status", type="string", enum={"reserved","canceled","fulfilled"}, example="reserved"),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="Error",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="Erro de validação"),
 *     @OA\Property(property="errors", type="object", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="ValidationError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="O nome é obrigatório. (e mais 2 erros)"),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         @OA\Property(
 *             property="field_name",
 *             type="array",
 *             @OA\Items(type="string", example="Mensagem de erro específica")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="UnauthenticatedError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="Unauthenticated.")
 * )
 *
 * @OA\Schema(
 *     schema="UnauthorizedError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="This action is unauthorized.")
 * )
 *
 * @OA\Schema(
 *     schema="NotFoundError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Meat] {id}")
 * )
 *
 * @OA\Schema(
 *     schema="ConflictError",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="Esta peça não está disponível para reserva.")
 * )
 *
 * @OA\Schema(
 *     schema="PaginationMeta",
 *     type="object",
 *     @OA\Property(property="current_page", type="integer", example=1),
 *     @OA\Property(property="last_page", type="integer", example=5),
 *     @OA\Property(property="per_page", type="integer", example=12),
 *     @OA\Property(property="total", type="integer", example=50)
 * )
 */
abstract class Controller
{
    use AuthorizesRequests;
}
