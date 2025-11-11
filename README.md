# Sistema de Agendamento de Carnes - Backend API

Backend desenvolvido em **Laravel 11** para sistema de agendamento e reserva de carnes. API REST completa com autenticação via Sanctum, documentação Swagger completa com todos os erros possíveis, e controle de concorrência para reservas usando UUIDs.

## ✨ Características

- ✅ **UUIDs** em todas as tabelas (versão mais segura e confiável)
- ✅ **Documentação Swagger completa** com todos os erros possíveis
- ✅ **Controle de concorrência** com transações e locks
- ✅ **Validação robusta** com mensagens em português
- ✅ **Testes automatizados** incluídos
- ✅ **API versionada** (`/api/v1`)

## 📋 Requisitos

- PHP 8.2+
- MySQL 8.0+
- Composer
- Node.js (opcional, para assets)

## 🚀 Instalação

### 1. Clone o repositório e instale as dependências

```bash
composer install
```

### 2. Configure o ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Configure as variáveis de ambiente no arquivo `.env`:

```env
APP_NAME="Sistema de Agendamento de Carnes"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=America/Cuiaba
APP_LOCALE=pt_BR
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=carnes_agendamento
DB_USERNAME=root
DB_PASSWORD=

L5_SWAGGER_CONST_HOST=http://localhost:8000
```

### 3. Gere a chave da aplicação

```bash
php artisan key:generate
```

### 4. Execute as migrations

```bash
php artisan migrate
```

### 5. Execute os seeders

```bash
php artisan db:seed
```

Isso criará:
- Usuário admin: `admin@local.test` / `password123`
- 5 tipos de carnes (Picanha, Alcatra, Maminha, Costela, Fraldinha)
- 100 peças de carne distribuídas entre os tipos
- 14 datas disponíveis (próximos 14 dias)
- Horários de retirada de 09:00 às 18:00 (intervalos de 30 minutos)

### 6. Publique e gere a documentação Swagger

```bash
php artisan l5-swagger:generate
```

### 7. Inicie o servidor de desenvolvimento

```bash
php artisan serve
```

A API estará disponível em: `http://localhost:8000`

A documentação Swagger estará disponível em: `http://localhost:8000/api/documentation`

## 📚 Estrutura da API

### Autenticação

Todas as rotas protegidas requerem um token Bearer no header:

```
Authorization: Bearer {token}
```

### Endpoints Principais

#### Autenticação (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Registrar novo usuário
- `POST /api/v1/auth/login` - Fazer login
- `POST /api/v1/auth/logout` - Fazer logout
- `GET /api/v1/auth/me` - Obter perfil do usuário autenticado

#### Catálogo Público (`/api/v1/meats`)
- `GET /api/v1/meats` - Listar carnes disponíveis
- `GET /api/v1/meats/{id}` - Detalhes de uma carne

#### Disponibilidade (`/api/v1/availability`)
- `GET /api/v1/availability/dates` - Listar datas disponíveis
- `GET /api/v1/availability/dates/{date}/slots` - Listar horários de uma data

#### Reservas - Cliente (`/api/v1/reservations`)
- `POST /api/v1/reservations` - Criar nova reserva
- `GET /api/v1/reservations/my` - Listar minhas reservas
- `GET /api/v1/reservations/{id}` - Detalhes de uma reserva
- `POST /api/v1/reservations/{id}/cancel` - Cancelar uma reserva

#### Admin (`/api/v1/admin/*`)
- Gerenciamento de carnes, peças, datas, horários e reservas
- Requer autenticação e permissão de administrador

## 🔐 Autenticação

### Registrar um novo usuário

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

### Fazer login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "password123"
  }'
```

Resposta:
```json
{
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "customer"
  },
  "token": "1|xxxxxxxxxxxx"
}
```

### Criar uma reserva

```bash
curl -X POST http://localhost:8000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "meat_item_id": 1,
    "available_date_id": 1,
    "pickup_slot_id": 1,
    "notes": "Observações opcionais"
  }'
```

## 🧪 Testes

Execute os testes:

```bash
php artisan test
```

### Testes de Concorrência

O sistema inclui testes para garantir que duas reservas simultâneas para a mesma peça resultem em apenas uma reserva bem-sucedida (201) e uma com erro 409 (Conflict).

## 📖 Documentação Swagger

A documentação completa da API está disponível em:

```
http://localhost:8000/api/documentation
```

### Recursos da Documentação

A documentação Swagger inclui:

- ✅ **Todos os endpoints** com descrições detalhadas
- ✅ **Exemplos de requisições** para cada endpoint
- ✅ **Exemplos de respostas de sucesso** (200, 201)
- ✅ **Todos os possíveis erros** documentados:
  - 400 (Bad Request) - Erros de regra de negócio
  - 401 (Unauthenticated) - Não autenticado
  - 403 (Forbidden) - Acesso negado
  - 404 (Not Found) - Recurso não encontrado
  - 409 (Conflict) - Conflitos (peça já reservada, capacidade esgotada)
  - 422 (Validation Error) - Erros de validação
- ✅ **Schemas completos** de todos os modelos
- ✅ **Autenticação Bearer Token** configurada
- ✅ **Teste interativo** de endpoints diretamente na interface

### Testar a API

#### Opção 1: Interface Swagger (Recomendado)

1. Acesse `http://localhost:8000/api/documentation`
2. Clique em "Authorize" e cole seu token
3. Teste os endpoints diretamente na interface

#### Opção 2: Script de Teste Automatizado

Execute o script de testes:

```bash
./test-api.sh
```

#### Opção 3: Manual com curl

Veja exemplos completos no arquivo `API_TESTING.md`:

```bash
cat API_TESTING.md
```

Para regenerar a documentação após alterações:

```bash
php artisan l5-swagger:generate
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- `users` - Usuários (admin/customer)
- `meats` - Tipos de carnes (catálogo)
- `meat_items` - Peças individuais reserváveis
- `available_dates` - Datas disponíveis para agendamento
- `pickup_slots` - Horários de retirada por data
- `reservations` - Reservas dos clientes

### Regras de Negócio

1. **Reserva**: Uma peça só pode ser reservada se estiver com status `available`
2. **Concorrência**: Uso de transações com locks (`SELECT ... FOR UPDATE`) para evitar reservas duplicadas
3. **Capacidade**: Cada horário tem uma capacidade máxima de reservas
4. **Cancelamento**: Cliente pode cancelar apenas reservas com status `reserved` e antes do horário de retirada
5. **Conclusão**: Apenas admin pode marcar uma reserva como `fulfilled`

## 🔧 Configurações Importantes

### Timezone

O sistema está configurado para `America/Cuiaba`. Todos os timestamps são salvos em UTC e convertidos para o timezone configurado nas respostas.

### Locale

O sistema está configurado para `pt_BR` com mensagens de validação em português.

### Rate Limiting

- Rotas de autenticação: 10 requisições por minuto por IP
- Rotas de mutação: 60 requisições por minuto por usuário

## 📝 Seeders Individuais

Se precisar executar seeders específicos:

```bash
php artisan db:seed --class=AdminUserSeeder
php artisan db:seed --class=MeatsSeeder
php artisan db:seed --class=MeatItemsSeeder
php artisan db:seed --class=AvailableDatesSeeder
php artisan db:seed --class=PickupSlotsSeeder
```

## 🐛 Troubleshooting

### Erro de conexão com banco de dados

Verifique as credenciais no arquivo `.env` e certifique-se de que o MySQL está rodando.

### Erro ao gerar documentação Swagger

Certifique-se de que todas as anotações estão corretas nos controllers. Execute:

```bash
php artisan l5-swagger:generate
```

### Erro 409 Conflict ao criar reserva

Isso é esperado quando:
- A peça já foi reservada por outro usuário
- O horário não possui capacidade disponível
- A data não está aberta para agendamentos

## 📄 Licença

Este projeto é privado e de uso interno.

## 👥 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
