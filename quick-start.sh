#!/bin/bash

# Quick Start - Sistema de Agendamento de Carnes
# Execute: ./quick-start.sh

clear

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🥩 Sistema de Agendamento de Carnes - Quick Start      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo ""
    read -p "Deseja criar a partir do .env.example? (s/n): " criar
    if [ "$criar" = "s" ] || [ "$criar" = "S" ]; then
        cp .env.example .env
        echo "✅ Arquivo .env criado!"
        echo ""
        echo "📝 Configure o banco de dados no arquivo .env e execute novamente."
        exit 0
    else
        echo "❌ Operação cancelada."
        exit 1
    fi
fi

# Perguntar o que fazer
echo "O que você deseja fazer?"
echo ""
echo "1) 🖥️  Desenvolvimento local (apenas este computador)"
echo "2) 📱 Acesso mobile (celular + computador na mesma rede)"
echo "3) 🔧 Configurar banco de dados e migrations"
echo "4) 📦 Criar usuário admin"
echo "5) 🌱 Popular banco com dados de teste (seeders)"
echo "6) 📋 Ver logs em tempo real"
echo "7) 🧹 Limpar cache do Laravel"
echo "8) ❌ Sair"
echo ""
read -p "Escolha uma opção (1-8): " opcao

case $opcao in
    1)
        echo ""
        echo "🚀 Iniciando servidor para desenvolvimento local..."
        echo ""
        echo "✅ Acesse em: http://localhost:8000/app"
        echo ""
        php artisan serve
        ;;
    2)
        echo ""
        echo "📱 Configurando para acesso mobile..."
        ./start-mobile.sh
        ;;
    3)
        echo ""
        echo "🔧 Configurando banco de dados..."
        echo ""

        # Gerar chave se não existir
        if ! grep -q "APP_KEY=" .env || [ -z "$(grep APP_KEY= .env | cut -d '=' -f2)" ]; then
            echo "🔑 Gerando chave da aplicação..."
            php artisan key:generate
        fi

        echo "📊 Executando migrations..."
        php artisan migrate

        echo ""
        echo "🔗 Criando link simbólico do storage..."
        php artisan storage:link

        echo ""
        echo "✅ Banco de dados configurado!"
        ;;
    4)
        echo ""
        echo "👤 Criando usuário administrador..."
        echo ""
        read -p "Nome: " nome
        read -p "E-mail: " email
        read -sp "Senha: " senha
        echo ""
        read -sp "Confirme a senha: " senha2
        echo ""

        if [ "$senha" != "$senha2" ]; then
            echo "❌ Senhas não conferem!"
            exit 1
        fi

        php artisan tinker --execute="
            \$user = new App\Models\User();
            \$user->name = '$nome';
            \$user->email = '$email';
            \$user->password = bcrypt('$senha');
            \$user->role = 'admin';
            \$user->save();
            echo '✅ Usuário admin criado com sucesso!\n';
        "
        ;;
    5)
        echo ""
        echo "🌱 Populando banco com dados de teste..."
        php artisan db:seed
        echo ""
        echo "✅ Dados de teste inseridos!"
        ;;
    6)
        echo ""
        echo "📋 Exibindo logs em tempo real (Ctrl+C para sair)..."
        echo ""
        tail -f storage/logs/laravel.log
        ;;
    7)
        echo ""
        echo "🧹 Limpando cache..."
        php artisan cache:clear
        php artisan config:clear
        php artisan route:clear
        php artisan view:clear
        echo ""
        echo "✅ Cache limpo!"
        ;;
    8)
        echo ""
        echo "👋 Até logo!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

