# Guia de Testes da API

Este documento contém exemplos de testes para todas as rotas da API usando `curl` e exemplos de requisições/respostas.

## Configuração Inicial

1. Inicie o servidor:
```bash
php artisan serve
```

2. A API estará disponível em: `http://localhost:8000`

## Autenticação

### 1. Registrar Usuário

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "(65) 99999-9999"
  }'
```

**Resposta de Sucesso (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(65) 99999-9999",
    "role": "customer",
    "created_at": "2024-11-10T18:00:00.000000Z"
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Erros Possíveis:**
- **422 - Validação**: Email já existe, senha não confere, campos obrigatórios faltando
- **422 - Validação**: Formato de email inválido

### 2. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "password123"
  }'
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "customer"
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Erros Possíveis:**
- **401 - Não autorizado**: Credenciais inválidas
- **422 - Validação**: Campos obrigatórios faltando

### 3. Obter Perfil (Me)

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "customer"
  }
}
```

**Erros Possíveis:**
- **401 - Não autenticado**: Token inválido ou ausente

### 4. Logout

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Logout realizado com sucesso."
}
```

## Catálogo Público

### 1. Listar Carnes

```bash
curl -X GET "http://localhost:8000/api/v1/meats?q=picanha&active=true&page=1"
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Picanha",
      "slug": "picanha",
      "description": "Corte nobre e suculento",
      "price_per_kg": 89.90,
      "image_url": "https://via.placeholder.com/400x300?text=Picanha",
      "is_active": true,
      "available_count": 15,
      "created_at": "2024-11-10T18:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 12,
    "total": 5
  }
}
```

### 2. Detalhes de uma Carne

```bash
curl -X GET http://localhost:8000/api/v1/meats/550e8400-e29b-41d4-a716-446655440000
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Picanha",
    "slug": "picanha",
    "description": "Corte nobre e suculento",
    "price_per_kg": 89.90,
    "available_count": 15
  }
}
```

**Erros Possíveis:**
- **404 - Não encontrado**: UUID inválido ou carne não existe
- **422 - Validação**: UUID em formato inválido

## Disponibilidade

### 1. Listar Datas Disponíveis

```bash
curl -X GET http://localhost:8000/api/v1/availability/dates
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2024-11-15",
      "is_open": true,
      "notes": null
    }
  ]
}
```

### 2. Listar Horários de uma Data

```bash
curl -X GET http://localhost:8000/api/v1/availability/dates/2024-11-15/slots
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "available_date_id": "550e8400-e29b-41d4-a716-446655440001",
      "start_at": "09:00",
      "end_at": "09:30",
      "capacity": 3,
      "reserved_count": 1,
      "available_capacity": 2
    }
  ]
}
```

**Erros Possíveis:**
- **404 - Não encontrado**: Data não existe ou não está aberta

## Reservas (Cliente)

### 1. Criar Reserva

```bash
curl -X POST http://localhost:8000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "meat_item_id": "550e8400-e29b-41d4-a716-446655440000",
    "available_date_id": "550e8400-e29b-41d4-a716-446655440001",
    "pickup_slot_id": "550e8400-e29b-41d4-a716-446655440002",
    "notes": "Observações opcionais"
  }'
```

**Resposta de Sucesso (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "user_id": "550e8400-e29b-41d4-a716-446655440004",
    "meat_item_id": "550e8400-e29b-41d4-a716-446655440000",
    "available_date_id": "550e8400-e29b-41d4-a716-446655440001",
    "pickup_slot_id": "550e8400-e29b-41d4-a716-446655440002",
    "pickup_at": "2024-11-15T09:00:00.000000Z",
    "status": "reserved",
    "notes": "Observações opcionais",
    "created_at": "2024-11-10T18:00:00.000000Z"
  }
}
```

**Erros Possíveis:**
- **400 - Bad Request**: Data não está aberta, horário não pertence à data
- **401 - Não autenticado**: Token inválido
- **403 - Acesso negado**: Apenas clientes podem criar reservas
- **409 - Conflito**: Peça já reservada, horário sem capacidade
- **422 - Validação**: UUIDs inválidos, campos obrigatórios faltando

### 2. Listar Minhas Reservas

```bash
curl -X GET "http://localhost:8000/api/v1/reservations/my?status=reserved&page=1" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "status": "reserved",
      "pickup_at": "2024-11-15T09:00:00.000000Z",
      "meat_item": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "PICANHA-ABC12345",
        "meat": {
          "name": "Picanha"
        }
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 12,
    "total": 1
  }
}
```

### 3. Detalhes de uma Reserva

```bash
curl -X GET http://localhost:8000/api/v1/reservations/550e8400-e29b-41d4-a716-446655440003 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Erros Possíveis:**
- **403 - Acesso negado**: Não é o dono da reserva
- **404 - Não encontrado**: Reserva não existe

### 4. Cancelar Reserva

```bash
curl -X POST http://localhost:8000/api/v1/reservations/550e8400-e29b-41d4-a716-446655440003/cancel \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "canceled",
    "canceled_at": "2024-11-10T18:30:00.000000Z"
  },
  "message": "Reserva cancelada com sucesso."
}
```

**Erros Possíveis:**
- **400 - Bad Request**: Reserva não pode ser cancelada (já cancelada, já retirada, horário passou)
- **403 - Acesso negado**: Não é o dono da reserva

## Admin - Carnes

### Login como Admin

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local.test",
    "password": "password123"
  }'
```

### 1. Listar Todas as Carnes (Admin)

```bash
curl -X GET http://localhost:8000/api/v1/admin/meats \
  -H "Authorization: Bearer TOKEN_ADMIN_AQUI"
```

### 2. Criar Carne (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/admin/meats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN_AQUI" \
  -d '{
    "name": "Costela de Porco",
    "slug": "costela-porco",
    "description": "Costela suína defumada",
    "price_per_kg": 45.90,
    "image_url": "https://example.com/image.jpg",
    "is_active": true
  }'
```

**Erros Possíveis:**
- **403 - Acesso negado**: Não é admin
- **422 - Validação**: Slug já existe, campos inválidos

### 3. Atualizar Carne (Admin)

```bash
curl -X PUT http://localhost:8000/api/v1/admin/meats/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN_AQUI" \
  -d '{
    "price_per_kg": 95.90,
    "is_active": true
  }'
```

### 4. Remover Carne (Admin)

```bash
curl -X DELETE http://localhost:8000/api/v1/admin/meats/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer TOKEN_ADMIN_AQUI"
```

## Admin - Reservas

### 1. Listar Todas as Reservas (Admin)

```bash
curl -X GET "http://localhost:8000/api/v1/admin/reservations?status=reserved&date=2024-11-15" \
  -H "Authorization: Bearer TOKEN_ADMIN_AQUI"
```

### 2. Concluir Retirada (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/admin/reservations/550e8400-e29b-41d4-a716-446655440003/fulfill \
  -H "Authorization: Bearer TOKEN_ADMIN_AQUI"
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "fulfilled",
    "fulfilled_at": "2024-11-15T09:00:00.000000Z"
  },
  "message": "Retirada concluída com sucesso."
}
```

**Erros Possíveis:**
- **400 - Bad Request**: Reserva não está com status 'reserved'

## Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro na requisição (dados inválidos, regra de negócio)
- **401**: Não autenticado (token inválido/ausente)
- **403**: Acesso negado (sem permissão)
- **404**: Recurso não encontrado
- **409**: Conflito (peça já reservada, capacidade esgotada)
- **422**: Erro de validação (dados inválidos)
- **500**: Erro interno do servidor

## Exemplos de Erros Comuns

### Erro 401 - Não Autenticado
```json
{
  "message": "Unauthenticated."
}
```

### Erro 403 - Acesso Negado
```json
{
  "message": "Acesso negado. Apenas administradores podem acessar este recurso."
}
```

### Erro 404 - Não Encontrado
```json
{
  "message": "No query results for model [App\\Models\\Meat] 550e8400-e29b-41d4-a716-446655440000"
}
```

### Erro 409 - Conflito
```json
{
  "message": "Esta peça não está disponível para reserva."
}
```

### Erro 422 - Validação
```json
{
  "message": "A peça de carne é obrigatória. (e mais 2 erros)",
  "errors": {
    "meat_item_id": [
      "A peça de carne é obrigatória.",
      "A peça selecionada não existe."
    ],
    "available_date_id": [
      "A data selecionada não existe."
    ]
  }
}
```

