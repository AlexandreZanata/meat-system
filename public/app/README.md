# 📱 Frontend - Sistema de Agendamento de Carnes

Interface web mobile-first para sistema de reserva e agendamento de carnes.

## ✨ Características

- 🎨 **Design Mobile-First** - Interface otimizada para celular
- 🔄 **AJAX** - Interações sem reload de página
- 🎯 **UX Profissional** - Visual limpo tipo aplicativo nativo
- 🟡 **Status Visual** - Identificação rápida por cores
- 📊 **Filtros Inteligentes** - Últimos 7 dias por padrão
- 📱 **100% Responsivo** - Funciona em qualquer dispositivo

## 🚀 Início Rápido

### Para Desenvolvimento Local (Computador)
```bash
php artisan serve
# Acesse: http://localhost:8000/app
```

### Para Acesso no Celular
```bash
# Use o script automático
./start-mobile.sh

# Ou manualmente
MY_IP=$(hostname -I | awk '{print $1}')
sed -i "s|APP_URL=.*|APP_URL=http://$MY_IP:8000|" .env
php artisan config:clear
php artisan serve --host=0.0.0.0 --port=8000
```

Então acesse no celular: `http://SEU_IP:8000/app`

📖 **Guia completo:** Veja [MOBILE_ACCESS.md](../MOBILE_ACCESS.md)

## 📂 Estrutura

```
public/app/
├── index.html       # Estrutura HTML
├── style.css        # Estilos mobile-first
└── app.js          # Lógica e AJAX
```

## 🎨 Design System

### Cores Principais
- **Primária:** `#ea1d2c` (Vermelho)
- **Sucesso:** `#00a859` (Verde)
- **Aviso:** `#ffb800` (Amarelo)
- **Perigo:** `#ea1d2c` (Vermelho)

### Status de Reservas
- 🟡 **Reservada (Aberta):** Fundo amarelo claro - destaque máximo
- 🟢 **Concluída:** Fundo verde claro
- ⚪ **Cancelada:** Fundo cinza com opacidade

### Breakpoints
- **Mobile:** < 768px (padrão)
- **Desktop:** > 768px

## 🔑 Funcionalidades

### 👤 Para Clientes

#### 📋 Catálogo
- Grid 2 colunas no mobile
- Busca em tempo real
- Cards compactos com imagem
- Preço e disponibilidade destacados

#### 🗓️ Minhas Reservas
- **Filtro padrão:** Últimos 7 dias
- **Histórico:** Botão para ver tudo
- **Status visual:** Cores por tipo
- **Cancelamento:** Direto pelo app (AJAX)

#### ✅ Fazer Reserva
- Seleção de peça disponível
- Escolha de data
- Observações opcionais

### 👨‍💼 Para Administradores

#### 🥩 Gerenciar Carnes
- Listar, criar, editar, excluir
- Upload de imagens
- Controle de disponibilidade

#### 📅 Gerenciar Datas
- Configurar horários de funcionamento
- Marcar datas abertas/fechadas
- Observações por data

#### 🎫 Gerenciar Reservas
- Visualizar todas as reservas
- Filtro últimos 7 dias
- Concluir retirada
- Cancelar reserva
- Histórico completo

## 🛠️ Tecnologias

- **HTML5** - Semântico e acessível
- **CSS3** - Custom properties, Flexbox, Grid
- **JavaScript (Vanilla)** - Zero dependências
- **Fetch API** - Requisições AJAX
- **LocalStorage** - Autenticação persistente

## 🔐 Autenticação

O sistema usa tokens Bearer armazenados no localStorage:
- Login/Registro sem reload
- Token automático nas requisições
- Persistência entre sessões
- Logout limpa dados locais

## 📱 Mobile Features

### Touch Optimizations
- Tap highlight desabilitado
- Scroll suave
- Botões com tamanho mínimo 44x44px
- `:active` states para feedback tátil

### Performance
- Lazy loading de imagens
- Requisições otimizadas
- Cache de dados do usuário
- Debounce na busca

### UX Mobile
- Header fixo compacto
- Navegação em tabs fixas
- Modais fullscreen em mobile
- Inputs otimizados para mobile

## 🎯 Padrões de Código

### Naming Conventions
- **IDs:** kebab-case (`filter-status`)
- **Classes:** kebab-case (`meat-card`)
- **Funções:** camelCase (`loadMeats()`)
- **Eventos:** inline handlers para simplicidade

### Estrutura de Funções
```javascript
// 1. Configuração e globals
const API_BASE = '/api/v1';
let authToken = localStorage.getItem('auth_token');

// 2. Autenticação
async function handleLogin(event) { }

// 3. Navegação
function showSection(section) { }

// 4. CRUD por entidade
async function loadMeats() { }
async function createReservation() { }

// 5. Helpers e utilities
function formatDate(date) { }
```

## 🐛 Debugging

### Logs Úteis
O app loga informações importantes no console:
```javascript
console.log('🔄 Normalizando URL:', imageUrl);
console.log('📦 Dados recebidos:', data);
console.log('✅ URL normalizada:', normalized);
```

### Problemas Comuns

#### Imagens não aparecem
- Verifique APP_URL no .env
- Confirme que storage:link foi executado
- Veja logs no console do navegador

#### Requisição falha
- Abra DevTools > Network
- Verifique se o token está presente
- Confirme que a API está rodando

#### Layout quebrado no mobile
- Limpe cache do navegador
- Force reload (Ctrl+Shift+R)
- Verifique o viewport meta tag

## 📊 API Integration

### Base URL
```javascript
const API_BASE = '/api/v1';
```

### Autenticação
```javascript
headers: {
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json'
}
```

### Endpoints Principais
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `POST /auth/logout` - Logout
- `GET /meats` - Listar carnes
- `GET /reservations/my` - Minhas reservas
- `POST /reservations` - Criar reserva
- `POST /reservations/{id}/cancel` - Cancelar

## 🎨 Customização

### Cores
Edite as CSS variables em `style.css`:
```css
:root {
    --primary-color: #ea1d2c;
    --success-color: #00a859;
    --warning-color: #ffb800;
    /* ... */
}
```

### Tamanhos
```css
:root {
    --radius-sm: 8px;
    --radius-md: 12px;
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
    /* ... */
}
```

## 📝 TODO / Melhorias Futuras

- [ ] PWA com Service Worker
- [ ] Modo offline
- [ ] Dark mode toggle
- [ ] Notificações push
- [ ] Compartilhar via WhatsApp
- [ ] Exportar reserva para calendário
- [ ] QR Code para check-in
- [ ] Galeria de imagens das carnes
- [ ] Avaliações e comentários
- [ ] Favoritos

## 📄 Licença

Este projeto é parte do Sistema de Agendamento de Carnes.

## 🤝 Contribuindo

1. Mantenha o design mobile-first
2. Teste em dispositivos reais
3. Mantenha zero dependências externas
4. Documente mudanças no CHANGELOG.md
5. Siga os padrões de código existentes

## 📞 Suporte

Problemas? Veja:
1. [MOBILE_ACCESS.md](../MOBILE_ACCESS.md) - Guia mobile
2. [CHANGELOG.md](../CHANGELOG.md) - Últimas mudanças
3. Console do navegador - Logs de debug
4. Network tab - Requisições API

---

**Desenvolvido com ❤️ para uma experiência mobile excepcional**

