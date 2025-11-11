# Como Resetar Rate Limiting em Produção

## Problema: "Too Many Attempts"

Quando você vê a mensagem "Too many attempts" no celular, significa que o rate limiting do Laravel bloqueou as tentativas de login/registro.

### Configuração Atual:
- **Login**: 10 tentativas por 60 minutos
- **Registro**: 5 tentativas por 60 minutos

## Soluções

### Opção 1: Usar o Comando Artisan (Recomendado)

Foi criado um comando para limpar o rate limiting:

```bash
# Limpar rate limiting para um IP específico
php artisan rate-limit:clear 192.168.1.100

# Limpar TODOS os rate limits (cuidado!)
php artisan rate-limit:clear
```

**Para descobrir o IP do celular:**
1. Peça para a pessoa acessar: https://whatismyipaddress.com/ no celular
2. Ou verifique os logs do servidor para ver o IP das tentativas bloqueadas

### Opção 2: Limpar Cache Manualmente

Se estiver usando **Redis**:
```bash
# Conectar ao Redis
redis-cli

# Ver todas as chaves de throttle
KEYS *throttle*

# Deletar todas as chaves de throttle
KEYS *throttle* | xargs redis-cli DEL
```

Se estiver usando **Cache em arquivo**:
```bash
# Limpar todo o cache
php artisan cache:clear
```

### Opção 3: Aumentar o Limite Temporariamente

Edite `routes/api.php` e aumente os limites:

```php
// De: throttle:10,60
// Para: throttle:20,60 (mais tentativas)
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:20,60');
```

Depois faça deploy e aguarde 60 minutos para os limites antigos expirarem.

### Opção 4: Desabilitar Rate Limiting Temporariamente (NÃO RECOMENDADO)

**⚠️ ATENÇÃO: Isso remove a proteção contra ataques!**

Edite `routes/api.php` e remova o middleware:

```php
// Remover ->middleware('throttle:10,60')
Route::post('/auth/login', [AuthController::class, 'login']);
```

## Prevenção

Para evitar que isso aconteça novamente:

1. **Aumentar os limites** se muitos usuários estão sendo bloqueados
2. **Melhorar a UX** para evitar múltiplas tentativas (validação em tempo real)
3. **Adicionar mensagens claras** quando o limite é atingido
4. **Implementar recuperação de senha** para reduzir tentativas de login

## Verificar Rate Limiting Ativo

Para ver quais IPs estão bloqueados:

```bash
# Se usar Redis
redis-cli
KEYS *throttle*

# Ver conteúdo de uma chave específica
GET laravel_cache:throttle:api/v1/auth/login:192.168.1.100
```

## Comando Rápido para Produção

```bash
# SSH no servidor
ssh usuario@seu-servidor.com

# Navegar para o diretório do projeto
cd /caminho/do/projeto

# Limpar rate limiting para um IP específico
php artisan rate-limit:clear IP_DO_CELULAR

# Ou limpar tudo (se necessário)
php artisan rate-limit:clear
```

## Nota Importante

O rate limiting é uma **proteção de segurança importante**. Só desabilite ou aumente muito os limites se tiver certeza de que não é um ataque.

