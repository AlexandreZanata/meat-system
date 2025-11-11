# 📱 Guia de Acesso Mobile

## Configuração para Acesso no Celular

### 1. Descobrir o IP da sua máquina

```bash
# Linux
ip addr show | grep inet
# ou
hostname -I

# O IP geralmente é algo como: 192.168.0.x ou 192.168.1.x
```

### 2. Iniciar o servidor Laravel

```bash
# IMPORTANTE: Use --host=0.0.0.0 para aceitar conexões externas
php artisan serve --host=0.0.0.0 --port=8000
```

### 3. Configurar o arquivo .env

Edite o arquivo `.env` e configure:

```env
APP_URL=http://SEU_IP_LOCAL:8000
# Exemplo: APP_URL=http://192.168.1.100:8000
```

**⚠️ IMPORTANTE:** Após alterar o `.env`, limpe o cache:

```bash
php artisan config:clear
php artisan cache:clear
```

### 4. Acessar do celular

No navegador do celular, acesse:
```
http://SEU_IP_LOCAL:8000/app
```

Exemplo: `http://192.168.1.100:8000/app`

## 🐛 Problemas Comuns

### Imagens não aparecem no celular

**Causa:** URLs das imagens estão usando `localhost` ao invés do IP da rede.

**Solução:**
1. Configure `APP_URL` no `.env` com o IP correto
2. Limpe o cache: `php artisan config:clear`
3. Reinicie o servidor
4. Acesse sempre pelo IP, nunca por localhost no celular

### Não consigo conectar

**Verifique:**
1. Computador e celular estão na mesma rede Wi-Fi
2. Firewall não está bloqueando a porta 8000
3. O servidor foi iniciado com `--host=0.0.0.0`

**Liberar porta no firewall (se necessário):**
```bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp

# Fedora/CentOS
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

## ✅ Checklist de Verificação

- [ ] Servidor iniciado com `php artisan serve --host=0.0.0.0 --port=8000`
- [ ] `APP_URL` configurado no `.env` com o IP da rede
- [ ] Cache limpo (`php artisan config:clear`)
- [ ] Celular e computador na mesma rede
- [ ] Acessando via IP (não localhost)
- [ ] Link simbólico do storage criado (`php artisan storage:link`)

## 🔧 Comandos Úteis

```bash
# Descobrir seu IP
hostname -I | awk '{print $1}'

# Verificar se o servidor está ouvindo
netstat -tuln | grep 8000

# Verificar logs em tempo real
tail -f storage/logs/laravel.log

# Limpar todos os caches
php artisan optimize:clear
```

## 📝 Exemplo de Configuração Completa

```bash
# 1. Descobrir IP
MY_IP=$(hostname -I | awk '{print $1}')
echo "Seu IP: $MY_IP"

# 2. Atualizar .env
# Edite manualmente ou use:
sed -i "s|APP_URL=.*|APP_URL=http://$MY_IP:8000|" .env

# 3. Limpar cache
php artisan config:clear
php artisan cache:clear

# 4. Iniciar servidor
php artisan serve --host=0.0.0.0 --port=8000

# 5. Acessar no celular: http://$MY_IP:8000/app
```

## 🎯 Melhor Prática

Para desenvolvimento, crie um script `start-mobile.sh`:

```bash
#!/bin/bash
MY_IP=$(hostname -I | awk '{print $1}')
echo "======================================"
echo "🚀 Servidor iniciando..."
echo "======================================"
echo "📱 Acesse no celular:"
echo "   http://$MY_IP:8000/app"
echo "======================================"
echo ""
php artisan serve --host=0.0.0.0 --port=8000
```

Torne executável: `chmod +x start-mobile.sh`
Execute: `./start-mobile.sh`

