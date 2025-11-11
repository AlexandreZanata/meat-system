#!/bin/bash

# Script de teste da API
# Uso: ./test-api.sh

BASE_URL="http://localhost:8000/api/v1"
TOKEN=""
ADMIN_TOKEN=""

echo "=== Testando API de Agendamento de Carnes ==="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer requisições
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expected_status=$5
    
    echo -n "Testando: $description ... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ OK (${http_code})${NC}"
        if [ ! -z "$TOKEN" ] && [[ "$endpoint" == *"auth/register"* ]] || [[ "$endpoint" == *"auth/login"* ]]; then
            TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            echo "  Token obtido: ${TOKEN:0:20}..."
        fi
    else
        echo -e "${RED}✗ FALHOU (esperado: $expected_status, recebido: $http_code)${NC}"
        echo "  Resposta: $body"
    fi
    echo ""
}

# 1. Testes de Autenticação
echo "=== 1. AUTENTICAÇÃO ==="
test_endpoint "POST" "/auth/register" \
    '{"name":"Test User","email":"test'$(date +%s)'@example.com","password":"password123","password_confirmation":"password123"}' \
    "Registrar usuário" "201"

test_endpoint "POST" "/auth/login" \
    '{"email":"admin@local.test","password":"password123"}' \
    "Login como admin" "200"

ADMIN_TOKEN=$TOKEN

test_endpoint "POST" "/auth/login" \
    '{"email":"test'$(date +%s)'@example.com","password":"password123"}' \
    "Login como cliente" "200"

test_endpoint "GET" "/auth/me" "" "Obter perfil" "200"

# 2. Testes de Catálogo
echo "=== 2. CATÁLOGO PÚBLICO ==="
test_endpoint "GET" "/meats" "" "Listar carnes" "200"
test_endpoint "GET" "/meats?q=picanha" "" "Buscar carnes por nome" "200"

# Obter ID de uma carne para teste
MEAT_ID=$(curl -s "$BASE_URL/meats" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ ! -z "$MEAT_ID" ]; then
    test_endpoint "GET" "/meats/$MEAT_ID" "" "Detalhes de uma carne" "200"
fi

# 3. Testes de Disponibilidade
echo "=== 3. DISPONIBILIDADE ==="
test_endpoint "GET" "/availability/dates" "" "Listar datas disponíveis" "200"

# Obter uma data para teste
DATE=$(curl -s "$BASE_URL/availability/dates" | grep -o '"date":"[^"]*' | head -1 | cut -d'"' -f4)
if [ ! -z "$DATE" ]; then
    test_endpoint "GET" "/availability/dates/$DATE/slots" "" "Listar horários de uma data" "200"
fi

# 4. Testes de Reservas
echo "=== 4. RESERVAS (CLIENTE) ==="
test_endpoint "GET" "/reservations/my" "" "Listar minhas reservas" "200"

# Obter IDs para criar reserva
MEAT_ITEM_ID=$(curl -s "$BASE_URL/admin/meat-items" -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
AVAILABLE_DATE_ID=$(curl -s "$BASE_URL/availability/dates" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
PICKUP_SLOT_ID=$(curl -s "$BASE_URL/availability/dates/$DATE/slots" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$MEAT_ITEM_ID" ] && [ ! -z "$AVAILABLE_DATE_ID" ] && [ ! -z "$PICKUP_SLOT_ID" ]; then
    test_endpoint "POST" "/reservations" \
        "{\"meat_item_id\":\"$MEAT_ITEM_ID\",\"available_date_id\":\"$AVAILABLE_DATE_ID\",\"pickup_slot_id\":\"$PICKUP_SLOT_ID\"}" \
        "Criar reserva" "201"
fi

# 5. Testes Admin
echo "=== 5. ADMIN ==="
TOKEN=$ADMIN_TOKEN
test_endpoint "GET" "/admin/meats" "" "Listar todas as carnes (Admin)" "200"
test_endpoint "GET" "/admin/reservations" "" "Listar todas as reservas (Admin)" "200"

echo -e "${GREEN}=== Testes concluídos! ===${NC}"
echo ""
echo "Para ver a documentação completa, acesse:"
echo "http://localhost:8000/api/documentation"

