#!/bin/bash

# Script para iniciar o servidor Laravel para acesso mobile

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "🥩 Sistema de Agendamento de Carnes"
echo "======================================"
echo -e "${NC}"

# Descobrir IP da rede local
MY_IP=$(hostname -I | awk '{print $1}')

if [ -z "$MY_IP" ]; then
    echo -e "${RED}❌ Não foi possível detectar o IP da rede${NC}"
    echo "Por favor, descubra seu IP manualmente e configure APP_URL no .env"
    exit 1
fi

echo -e "${GREEN}✓ IP detectado: $MY_IP${NC}"

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Execute: cp .env.example .env"
    exit 1
fi

# Atualizar APP_URL no .env
echo -e "${YELLOW}⚙️  Atualizando APP_URL...${NC}"
if grep -q "^APP_URL=" .env; then
    sed -i "s|^APP_URL=.*|APP_URL=http://$MY_IP:8000|" .env
else
    echo "APP_URL=http://$MY_IP:8000" >> .env
fi

# Limpar cache
echo -e "${YELLOW}🧹 Limpando cache...${NC}"
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1

echo -e "${GREEN}✓ Configuração concluída!${NC}"
echo ""
echo -e "${BLUE}======================================"
echo "📱 Acesso Mobile"
echo "======================================"
echo -e "${NC}"
echo -e "${GREEN}Computador:${NC}  http://localhost:8000/app"
echo -e "${GREEN}Celular:${NC}     http://$MY_IP:8000/app"
echo ""
echo -e "${YELLOW}⚠️  Certifique-se de que seu celular está na mesma rede Wi-Fi${NC}"
echo ""
echo -e "${BLUE}======================================"
echo "🚀 Iniciando servidor..."
echo "======================================"
echo -e "${NC}"
echo ""

# Iniciar servidor
php artisan serve --host=0.0.0.0 --port=8000

