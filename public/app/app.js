// Configuração - Variáveis globais
window.API_BASE = '/api/v1';
window.authToken = localStorage.getItem('auth_token');
window.currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');

// Manter compatibilidade com código antigo
const API_BASE = window.API_BASE;
let authToken = window.authToken;
let currentUser = window.currentUser;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Permitir navegação sem login - só mostrar tela de login se necessário
    if (authToken && currentUser) {
        showMainScreen();
    } else {
        // Mostrar tela principal sem login - usuário pode navegar
        showMainScreenWithoutAuth();
    }
    
    // Carregar botão WhatsApp
    setTimeout(() => {
        loadWhatsAppButton();
    }, 500);
});

// Funções de Autenticação
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage('Preencha todos os campos', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token && data.data) {
                authToken = data.token;
                currentUser = data.data;
                window.authToken = authToken;
                window.currentUser = currentUser;
                localStorage.setItem('auth_token', authToken);
                localStorage.setItem('current_user', JSON.stringify(currentUser));
                showMainScreen();
                
                // Mostrar botão WhatsApp (apenas visual)
                const btn = document.getElementById('whatsapp-float-btn');
                if (btn) {
                    btn.style.display = 'flex';
                    btn.style.zIndex = '9999';
                }

                // Se havia uma reserva pendente, abrir modal
                if (window.pendingReservation) {
                    setTimeout(() => {
                        openReservationModal(window.pendingReservation.meatItemId);
                        window.pendingReservation = null;
                    }, 500);
                }
            } else {
                showMessage('Resposta inválida do servidor. Por favor, tente novamente.', 'error');
            }
        } else {
            let errorMsg = data.message || 'Não foi possível realizar o login. Verifique suas credenciais.';
            if (data.errors) {
                const errors = Object.values(data.errors).flat();
                errorMsg = errors.join(', ');
            }
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirmation = document.getElementById('register-password-confirm').value;
    const phone = document.getElementById('register-phone').value;

    if (!name || !email || !password || !passwordConfirmation) {
        showMessage('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (password !== passwordConfirmation) {
        showMessage('As senhas não coincidem', 'error');
        return;
    }

    if (password.length < 8) {
        showMessage('A senha deve ter pelo menos 8 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
                phone: phone || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token && data.data) {
                authToken = data.token;
                currentUser = data.data;
                window.authToken = authToken;
                window.currentUser = currentUser;
                localStorage.setItem('auth_token', authToken);
                localStorage.setItem('current_user', JSON.stringify(currentUser));
                showMessage('Registro realizado com sucesso.', 'success');
                showMainScreen();
                
                // Mostrar botão WhatsApp (apenas visual)
                const btn = document.getElementById('whatsapp-float-btn');
                if (btn) {
                    btn.style.display = 'flex';
                    btn.style.zIndex = '9999';
                }

                // Se havia uma reserva pendente, abrir modal
                if (window.pendingReservation) {
                    setTimeout(() => {
                        openReservationModal(window.pendingReservation.meatItemId);
                        window.pendingReservation = null;
                    }, 500);
                }
            } else {
                showMessage('Resposta inválida do servidor. Por favor, tente novamente.', 'error');
            }
        } else {
            let errorMsg = data.message || 'Não foi possível realizar o registro. Verifique os dados informados.';
            if (data.errors) {
                const errors = Object.values(data.errors).flat();
                errorMsg = errors.join(', ');
            }
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

function logout() {
    if (authToken) {
        fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    }
    authToken = null;
    window.authToken = null;
    window.currentUser = null;
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    showAuthScreen();
}

// Funções de Navegação
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'block';
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('guest-info').style.display = 'none';
}

function showMainScreenWithoutAuth() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('guest-info').style.display = 'flex';

    // Esconder seção de reservas se não estiver logado
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        if (tab.textContent.includes('Reservas')) {
            tab.style.display = 'none';
        }
    });

    document.getElementById('main-nav-tabs').style.display = 'flex';
    showSection('catalog');
    loadMeats();
    // Carregar botão WhatsApp
    loadWhatsAppButton();
}

function showMainScreen() {
    // Verificar se estamos na página de perfil (não tem esses elementos)
    const authScreen = document.getElementById('auth-screen');
    const mainScreen = document.getElementById('main-screen');
    
    if (!authScreen || !mainScreen) {
        // Estamos em outra página (como profile.html), não fazer nada
        return;
    }
    
    authScreen.style.display = 'none';
    mainScreen.style.display = 'block';
    
    const userInfo = document.getElementById('user-info');
    const guestInfo = document.getElementById('guest-info');
    const userName = document.getElementById('user-name');
    
    if (userInfo) userInfo.style.display = 'flex';
    if (guestInfo) guestInfo.style.display = 'none';
    if (userName && currentUser) userName.textContent = currentUser.name;

    // Se for admin, mostrar apenas o painel administrativo
    if (currentUser.role === 'admin') {
        // Esconder navegação principal
        document.getElementById('main-nav-tabs').style.display = 'none';
        // Mostrar seção admin diretamente
        showSection('admin');
        loadAdminReservations();
        loadAdminMeats();
        loadAdminDates();
    } else {
        // Se for cliente, mostrar abas normais
        document.getElementById('main-nav-tabs').style.display = 'flex';
        showSection('catalog');
        loadMeats();
    }
    
    // Carregar botão WhatsApp
    loadWhatsAppButton();
}

async function loadWhatsAppButton() {
    const btn = document.getElementById('whatsapp-float-btn');
    if (!btn) {
        console.warn('Botão WhatsApp não encontrado');
        return;
    }
    
    try {
        console.log('Carregando número do WhatsApp...');
        const response = await fetch(`${API_BASE}/admin/whatsapp`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Resposta WhatsApp status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Dados WhatsApp recebidos:', data);
            
            // Verificar se há número e não está vazio
            if (data && data.whatsapp !== null && data.whatsapp !== undefined) {
                const whatsappNumber = String(data.whatsapp).trim();
                
                if (whatsappNumber !== '') {
                    window.adminWhatsApp = whatsappNumber;
                    btn.style.display = 'flex';
                    btn.style.cursor = 'pointer';
                    btn.onclick = openWhatsApp;
                    console.log('Botão WhatsApp exibido com número:', whatsappNumber.substring(0, 5) + '...');
                } else {
                    console.log('Número WhatsApp vazio');
                    btn.style.display = 'none';
                }
            } else {
                console.log('Número WhatsApp não configurado (null/undefined)');
                btn.style.display = 'none';
            }
        } else {
            console.error('Erro na resposta WhatsApp:', response.status);
            btn.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar WhatsApp:', error);
        btn.style.display = 'none';
    }
}

function openWhatsApp() {
    if (!window.adminWhatsApp) {
        showMessage('Número de WhatsApp não disponível.', 'error');
        loadWhatsAppButton();
        return;
    }
    
    // Pegar o número do admin (ex: "66997227927")
    const phoneNumber = window.adminWhatsApp.replace(/\D/g, ''); // Remove tudo que não é número
    
    if (!phoneNumber || phoneNumber.length < 10) {
        showMessage('Número de WhatsApp inválido.', 'error');
        return;
    }
    
    // Criar link do WhatsApp: https://wa.me/66997227927
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    
    // Abrir em nova aba
    window.open(whatsappUrl, '_blank');
}

function openProfile() {
    if (!authToken || !currentUser) {
        showAuthScreen();
        return;
    }
    window.location.href = '/app/profile.html';
}

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';

    // Ativar a aba correta
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((t, index) => {
        if ((tab === 'login' && index === 0) || (tab === 'register' && index === 1)) {
            t.classList.add('active');
        }
    });
}

function showSection(section, clickedElement = null) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Apenas remover active das abas principais se a navegação principal estiver visível
    const mainNavTabs = document.getElementById('main-nav-tabs');
    if (mainNavTabs && mainNavTabs.style.display !== 'none') {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    }

    document.getElementById(`${section}-section`).style.display = 'block';

    if (clickedElement) {
        clickedElement.classList.add('active');
    } else if (section !== 'admin') {
        // Se não foi passado elemento e não for admin, ativar pelo índice
        const tabs = document.querySelectorAll('.nav-tab');
        const sections = ['catalog', 'availability', 'my-reservations'];
        const index = sections.indexOf(section);
        if (index >= 0 && tabs[index]) {
            tabs[index].classList.add('active');
        }
    }

    if (section === 'catalog') {
        loadMeats();
        // Carregar WhatsApp se não for admin
        if (!currentUser || currentUser.role !== 'admin') {
            loadWhatsAppButton();
        }
    }
    if (section === 'availability') {
        loadAvailability();
        // Carregar WhatsApp se não for admin
        if (!currentUser || currentUser.role !== 'admin') {
            loadWhatsAppButton();
        }
    }
    if (section === 'my-reservations') loadMyReservations();
    if (section === 'admin') {
        showAdminTab('admin-reservations');
        if (currentUser && currentUser.role === 'admin') {
            loadAdminReservations();
            loadAdminStock();
            loadAdminMeats();
            loadAdminDates();
        }
    }
}

function showAdminTab(tab, clickedElement = null) {
    document.querySelectorAll('.admin-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tab).style.display = 'block';

    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        // Ativar pelo índice
        const tabs = document.querySelectorAll('.admin-tab');
        const tabsArray = ['admin-reservations', 'admin-stock', 'admin-meats', 'admin-dates'];
        const index = tabsArray.indexOf(tab);
        if (index >= 0 && tabs[index]) {
            tabs[index].classList.add('active');
        }
    }

    // Carregar dados quando a aba é selecionada
    if (tab === 'admin-stock') {
        loadStockMeatsFilter();
        loadAdminStock();
    }
}

// Função helper para normalizar URLs de imagens
function normalizeImageUrl(imageUrl) {
    if (!imageUrl) {
        console.log('⚠️ normalizeImageUrl: URL vazia');
        return null;
    }

    console.log('🔄 Normalizando URL:', imageUrl, 'Origin:', window.location.origin);

    // Se já for URL absoluta, retornar como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('//')) {
        console.log('✅ URL já é absoluta:', imageUrl);
        return imageUrl;
    }

    // Se for relativa, tornar absoluta
    let normalized;
    if (imageUrl.startsWith('/')) {
        normalized = window.location.origin + imageUrl;
    } else {
        normalized = window.location.origin + '/' + imageUrl;
    }

    console.log('✅ URL normalizada:', normalized);
    return normalized;
}

// Funções de API
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
            // Se houver erro, lançar exceção com os dados
            const error = new Error(data.message || `Erro na requisição: ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } else {
        // Se não for JSON, ler como texto e lançar erro
        const text = await response.text();
        console.error('Resposta não-JSON recebida:', text);
        const error = new Error(`Erro do servidor (${response.status}): ${response.statusText}`);
        error.status = response.status;
        error.text = text;
        throw error;
    }
}

// Catálogo de Carnes
async function loadMeats() {
    const container = document.getElementById('meats-list');
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const data = await apiRequest('/meats');
        console.log('📦 Dados recebidos (catalog meats):', data);

        if (data.data) {
            container.innerHTML = '';
            data.data.forEach(meat => {
                const card = document.createElement('div');
                card.className = 'meat-card';
                card.onclick = () => showMeatDetails(meat.id);

                const imageUrl = normalizeImageUrl(meat.image_url);

                // Debug: log da URL da imagem
                console.log('🥩 Processando carne:', meat.name, 'Image URL original:', meat.image_url, 'Normalized:', imageUrl);

                const imageHtml = imageUrl
                    ? `<img src="${imageUrl}" alt="${meat.name}" class="meat-card-image" loading="lazy" onerror="console.error('Erro ao carregar imagem:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : '';

                const placeholderHtml = `<div class="meat-card-image-placeholder" style="${imageUrl ? 'display:none;' : ''}"><i class="bi bi-image" style="font-size: 2rem;"></i> Sem imagem</div>`;

                card.innerHTML = `
                    ${imageHtml}
                    ${placeholderHtml}
                    <div class="meat-card-content">
                        <h3>${meat.name}</h3>
                        ${meat.description ? `<p class="description">${meat.description}</p>` : ''}
                        ${meat.price_per_kg ? `
                            <div class="price">
                                R$ ${parseFloat(meat.price_per_kg).toFixed(2)}
                                <span class="price-label">/kg</span>
                            </div>
                        ` : ''}
                        <div class="${meat.available_count > 0 ? 'available' : 'unavailable'}">
                            ${meat.available_count > 0 ? `<span><i class="bi bi-check-circle"></i> ${meat.available_count} peças disponíveis</span>` : '<span><i class="bi bi-x-circle"></i> Indisponível</span>'}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar as carnes. Por favor, tente novamente.</div>';
    }
}

async function searchMeats() {
    const query = document.getElementById('search-meat').value;
    const container = document.getElementById('meats-list');
    container.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        const data = await apiRequest(`/meats?q=${encodeURIComponent(query)}`);
        if (data.data) {
            container.innerHTML = '';
            data.data.forEach(meat => {
                const card = document.createElement('div');
                card.className = 'meat-card';
                card.onclick = () => showMeatDetails(meat.id);

                const imageUrl = normalizeImageUrl(meat.image_url);

                // Debug: log da URL da imagem
                console.log('Meat:', meat.name, 'Image URL:', meat.image_url, 'Normalized:', imageUrl);

                const imageHtml = imageUrl
                    ? `<img src="${imageUrl}" alt="${meat.name}" class="meat-card-image" loading="lazy" onerror="console.error('Erro ao carregar imagem:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : '';

                const placeholderHtml = `<div class="meat-card-image-placeholder" style="${imageUrl ? 'display:none;' : ''}"><i class="bi bi-image" style="font-size: 2rem;"></i> Sem imagem</div>`;

                card.innerHTML = `
                    ${imageHtml}
                    ${placeholderHtml}
                    <div class="meat-card-content">
                        <h3>${meat.name}</h3>
                        ${meat.description ? `<p class="description">${meat.description}</p>` : ''}
                        ${meat.price_per_kg ? `
                            <div class="price">
                                R$ ${parseFloat(meat.price_per_kg).toFixed(2)}
                                <span class="price-label">/kg</span>
                            </div>
                        ` : ''}
                        <div class="${meat.available_count > 0 ? 'available' : 'unavailable'}">
                            ${meat.available_count > 0 ? `<span><i class="bi bi-check-circle"></i> ${meat.available_count} peças disponíveis</span>` : '<span><i class="bi bi-x-circle"></i> Indisponível</span>'}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível buscar as carnes. Por favor, tente novamente.</div>';
    }
}

async function showMeatDetails(meatId) {
    try {
        const data = await apiRequest(`/meats/${meatId}`);
        const meat = data.data;
        const details = document.getElementById('meat-details');

        // Buscar peças disponíveis
        let availableItemsHtml = '';
        if (meat.available_count > 0) {
            try {
                const itemsData = await apiRequest(`/meats/${meatId}/items`);
                if (itemsData.data && itemsData.data.length > 0) {
                    availableItemsHtml = `
                        <div style="background: rgba(0, 168, 89, 0.1); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 20px;">
                            <p style="color: var(--success-color); font-weight: 600; margin: 0;"><i class="bi bi-check-circle"></i> ${meat.available_count} peças disponíveis</p>
                        </div>
                        <h3 style="margin-bottom: 16px; font-size: 1.2rem;">Peças Disponíveis:</h3>
                        <div style="max-height: 400px; overflow-y: auto; margin: 15px 0;">
                            ${itemsData.data.map(item => `
                                <div style="border: 2px solid var(--border-color); padding: 16px; margin-bottom: 12px; border-radius: var(--radius-md); background: white; transition: all 0.3s ease;"
                                     onmouseover="this.style.borderColor='var(--primary-color)'; this.style.boxShadow='var(--shadow-sm)'"
                                     onmouseout="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none'">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                                        <div>
                                            <p style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">${item.code}</p>
                                            ${item.weight_kg ? `<p style="font-size: 14px; color: var(--text-secondary); margin: 4px 0;"><i class="bi bi-scale"></i> ${item.weight_kg}kg</p>` : ''}
                                            ${item.fixed_price ? `<p style="font-size: 16px; font-weight: 700; color: var(--primary-color); margin-top: 8px;">R$ ${parseFloat(item.fixed_price).toFixed(2)}</p>` : ''}
                                        </div>
                                        <button onclick="event.stopPropagation(); openReservationModal('${item.id}')" style="white-space: nowrap;">Reservar</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    availableItemsHtml = `<p><strong>Disponíveis:</strong> ${meat.available_count} peças</p>`;
                }
            } catch (e) {
                availableItemsHtml = `<p><strong>Disponíveis:</strong> ${meat.available_count} peças</p>`;
            }
        } else {
            availableItemsHtml = '<p style="color: #d32f2f;"><strong>Indisponível</strong></p>';
        }

        const imageUrl = normalizeImageUrl(meat.image_url);

        // Debug: log da URL da imagem
        console.log('📋 Meat Details:', meat.name, 'Image URL original:', meat.image_url, 'Normalized:', imageUrl);

        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${meat.name}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 20px; box-shadow: var(--shadow-md);" loading="lazy" onerror="console.error('Erro ao carregar imagem:', this.src); this.style.display='none';">`
            : '';

        details.innerHTML = `
            ${imageHtml}
            <h2 style="margin-bottom: 12px;">${meat.name}</h2>
            ${meat.description ? `<p style="color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">${meat.description}</p>` : ''}
            ${meat.price_per_kg ? `
                <div style="background: linear-gradient(135deg, rgba(234, 29, 44, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Preço por kg</p>
                    <p style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">R$ ${parseFloat(meat.price_per_kg).toFixed(2)}</p>
                </div>
            ` : ''}
            ${availableItemsHtml}
        `;

        document.getElementById('meat-modal').style.display = 'block';
    } catch (error) {
        showMessage('Não foi possível carregar os detalhes da carne. Por favor, tente novamente.', 'error');
    }
}

// Disponibilidade
async function loadAvailability() {
    const container = document.getElementById('dates-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const response = await fetch(`${API_BASE}/availability/dates`);
        const result = await response.json();
        
        if (result.data && Array.isArray(result.data)) {
            container.innerHTML = '';
            
            if (result.data.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma data disponível</p>';
                return;
            }
            
            const today = new Date().toISOString().split('T')[0];
            let hasValidDates = false;
            
            result.data.forEach(date => {
                // Mostrar apenas datas abertas e futuras (o backend já filtra, mas verificamos novamente)
                if (date.is_open && date.date >= today) {
                    hasValidDates = true;
                    const dateCard = document.createElement('div');
                    dateCard.className = 'date-card';
                    dateCard.innerHTML = `
                        <h3>${formatDate(date.date)}</h3>
                        <p><strong>Status:</strong> <span><i class="bi bi-check-circle"></i> Disponível para agendamento</span></p>
                        ${date.notes ? `<p><strong>Observações:</strong> ${date.notes}</p>` : ''}
                    `;
                    container.appendChild(dateCard);
                }
            });
            
            if (!hasValidDates) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma data disponível</p>';
            }
        } else {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma data disponível</p>';
        }
    } catch (error) {
        console.error('Error loading availability:', error);
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar a disponibilidade. Por favor, tente novamente.</div>';
    }
}

// Reservas
let selectedMeatItemId = null;
let selectedDate = null;

function openReservationModal(meatItemId) {
    // Verificar se está logado
    if (!authToken || !currentUser) {
        showMessage('Você precisa fazer login ou criar uma conta para realizar uma reserva.', 'info');
        // Mostrar tela de login/registro
        showAuthScreen();
        // Armazenar o meatItemId para usar após login
        window.pendingReservation = { meatItemId };
        return;
    }

    selectedMeatItemId = meatItemId;
    document.getElementById('reservation-meat-item-id').value = meatItemId;
    closeModal('meat-modal');

    // Carregar datas disponíveis
    loadDatesForReservation();
    document.getElementById('reservation-modal').style.display = 'block';

    // Limpar seleções anteriores
    document.getElementById('reservation-date').value = '';
    document.getElementById('reservation-notes').value = '';
}

let availableDatesData = [];

async function loadDatesForReservation() {
    const select = document.getElementById('reservation-date');
    select.innerHTML = '<option>Carregando...</option>';

    try {
        const dates = await apiRequest('/availability/dates');
        availableDatesData = dates.data;
        select.innerHTML = '<option value="">Selecione uma data</option>';
        // Filtrar apenas datas abertas e futuras
        const today = new Date().toISOString().split('T')[0];
        dates.data.forEach(date => {
            if (date.is_open && date.date >= today) {
                const option = document.createElement('option');
                option.value = date.id;
                option.textContent = formatDate(date.date);
                option.dataset.dateId = date.id;
                select.appendChild(option);
            }
        });

        if (select.options.length === 1) {
            select.innerHTML = '<option value="">Nenhuma data disponível</option>';
        }
    } catch (error) {
        showMessage('Não foi possível carregar as datas disponíveis. Por favor, tente novamente.', 'error');
    }
}

// Função removida - não é mais necessária sem horários

async function handleCreateReservation(event) {
    event.preventDefault();
    const meatItemId = document.getElementById('reservation-meat-item-id').value;
    const selectedDateId = document.getElementById('reservation-date').value;
    const notes = document.getElementById('reservation-notes').value;

    if (!meatItemId || !selectedDateId) {
        showMessage('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                meat_item_id: meatItemId,
                available_date_id: selectedDateId,
                notes: notes || null
            })
        });

        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Se não for JSON, tentar ler como texto para debug
            const text = await response.text();
            console.error('Resposta não-JSON recebida:', text);
            showMessage(`Erro do servidor (${response.status}): ${response.statusText}`, 'error');
            return;
        }

        if (response.ok) {
            showMessage('Reserva criada com sucesso.', 'success');
            closeModal('reservation-modal');
            // Limpar formulário
            document.getElementById('reservation-notes').value = '';
            document.getElementById('reservation-date').value = '';
            document.getElementById('reservation-meat-item-id').value = '';
            showSection('my-reservations');
            loadMyReservations();
        } else {
            // Tratar diferentes tipos de erro
            let errorMsg = 'Não foi possível criar a reserva. Por favor, tente novamente.';

            if (data.message) {
                errorMsg = data.message;
            } else if (data.errors) {
                const errors = Object.values(data.errors).flat();
                errorMsg = errors.join(', ');
            } else if (response.status === 409) {
                errorMsg = 'Esta peça não está mais disponível. Por favor, selecione outra peça.';
            } else if (response.status === 422) {
                errorMsg = 'Dados inválidos. Verifique os campos preenchidos e tente novamente.';
            } else if (response.status === 401) {
                errorMsg = 'Sua sessão expirou. Por favor, faça login novamente.';
                logout();
            }

            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

async function loadMyReservations(showAll = false) {
    const container = document.getElementById('reservations-list');
    const status = document.getElementById('filter-status').value;
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        let url = `/reservations/my${status ? `?status=${status}` : ''}`;

        // Se não estiver mostrando tudo, filtrar últimos 7 dias
        if (!showAll) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
            url += (url.includes('?') ? '&' : '?') + `from_date=${dateFrom}`;
        }

        const data = await apiRequest(url);
        if (data.data) {
            container.innerHTML = '';
            if (data.data.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma reserva encontrada</p>';
                return;
            }
            data.data.forEach(reservation => {
                const card = document.createElement('div');
                card.className = `reservation-card status-${reservation.status}`;
                card.innerHTML = `
                    <div class="info">
                        <h3>${reservation.meat_item?.meat?.name || 'Carne'}</h3>
                        <p><strong>Código da peça:</strong> ${reservation.meat_item?.code || 'N/A'}</p>
                        ${reservation.meat_item?.weight_kg ? `<p><strong>Peso:</strong> ${reservation.meat_item.weight_kg}kg</p>` : ''}
                        ${reservation.meat_item?.fixed_price ? `<p><strong>Preço:</strong> R$ ${parseFloat(reservation.meat_item.fixed_price).toFixed(2)}</p>` : ''}
                        <p><strong>Data de retirada:</strong> ${formatDate(reservation.available_date?.date)}</p>
                        <p><strong>Status:</strong> <span class="status ${reservation.status}">${getStatusText(reservation.status)}</span></p>
                        ${reservation.notes ? `<p><strong>Observações:</strong> ${reservation.notes}</p>` : ''}
                        <p style="font-size: 12px; color: var(--text-light); margin-top: 8px;">Reservado em: ${formatDateTime(reservation.created_at)}</p>
                    </div>
                    <div class="actions">
                        ${reservation.status === 'reserved' ? `
                            <button onclick="cancelReservation('${reservation.id}')">Cancelar Reserva</button>
                        ` : ''}
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar as reservas. Por favor, tente novamente.</div>';
    }
}

function showReservationHistory() {
    // Marcar que estamos no modo histórico
    const filterBar = document.querySelector('#my-reservations-section .filter-bar');
    const historyBtn = filterBar.querySelector('.btn-history');
    if (historyBtn) {
        historyBtn.style.display = 'none';
    }
    
    // Adicionar botão de voltar
    let backBtn = filterBar.querySelector('.btn-back-history');
    if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.className = 'btn-back-history';
        backBtn.innerHTML = '<i class="bi bi-arrow-left"></i> Voltar';
        backBtn.onclick = showRecentReservations;
        filterBar.insertBefore(backBtn, filterBar.firstChild);
    }
    backBtn.style.display = 'flex';
    
    if (!filterBar.querySelector('.filter-date-range')) {
        const dateRange = document.createElement('span');
        dateRange.className = 'filter-date-range';
        dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Mostrando todo o histórico';
        filterBar.appendChild(dateRange);
    } else {
        filterBar.querySelector('.filter-date-range').innerHTML = '<i class="bi bi-calendar3"></i> Mostrando todo o histórico';
    }

    loadMyReservations(true);
}

function showRecentReservations() {
    const filterBar = document.querySelector('#my-reservations-section .filter-bar');
    const backBtn = filterBar.querySelector('.btn-back-history');
    if (backBtn) {
        backBtn.style.display = 'none';
    }
    
    const historyBtn = filterBar.querySelector('.btn-history');
    if (historyBtn) {
        historyBtn.style.display = 'flex';
    }
    
    const dateRange = filterBar.querySelector('.filter-date-range');
    if (dateRange) {
        dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Últimos 7 dias';
    }

    loadMyReservations(false);
}

async function cancelReservation(reservationId) {
    showConfirm(
        'Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.',
        async () => {
            // Adicionar indicador de loading
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Cancelando...';

    try {
        const response = await fetch(`${API_BASE}/reservations/${reservationId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
                    showMessage('Reserva cancelada com sucesso.', 'success');
            // Recarregar reservas sem reload da página
            const filterBar = document.querySelector('#my-reservations-section .filter-bar');
                    const isShowingHistory = filterBar?.querySelector('.filter-date-range')?.textContent.includes('todo o histórico');
            loadMyReservations(isShowingHistory);
        } else {
                    showMessage(data.message || 'Não foi possível cancelar a reserva. Por favor, tente novamente.', 'error');
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
                showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
        }
    );
}

// Admin
async function loadAdminMeats() {
    const container = document.getElementById('admin-meats-list');
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const data = await apiRequest('/admin/meats');
        console.log('📦 Dados recebidos (admin meats):', data);

        if (data.data) {
            container.innerHTML = '';
            if (data.data.length === 0) {
                container.innerHTML = '<p>Nenhuma carne cadastrada</p>';
                return;
            }
            data.data.forEach(meat => {
                meat.price_per_kg = undefined;
                const card = document.createElement('div');
                card.className = 'meat-card';

                const imageUrl = normalizeImageUrl(meat.image_url);

                // Debug: log da URL da imagem
                console.log('🥩 Processando carne:', meat.name, 'Image URL original:', meat.image_url, 'Normalized:', imageUrl);

                const imageHtml = imageUrl
                    ? `<img src="${imageUrl}" alt="${meat.name}" class="meat-card-image" loading="lazy" onerror="console.error('Erro ao carregar imagem:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : '';

                const placeholderHtml = `<div class="meat-card-image-placeholder" style="${imageUrl ? 'display:none;' : ''}"><i class="bi bi-image" style="font-size: 2rem;"></i> Sem imagem</div>`;

                card.innerHTML = `
                    ${imageHtml}
                    ${placeholderHtml}
                    <div class="meat-card-content">
                        <h3>${meat.name}</h3>
                        ${meat.description ? `<p class="description">${meat.description}</p>` : ''}
                        ${meat.price_per_kg ? `
                            <div class="price">
                                R$ ${parseFloat(meat.price_per_kg).toFixed(2)}
                                <span class="price-label">/kg</span>
                            </div>
                        ` : ''}
                        <div class="${meat.available_count > 0 ? 'available' : 'unavailable'}" style="margin-bottom: 12px;">
                            ${meat.available_count > 0 ? `<span><i class="bi bi-check-circle"></i> ${meat.available_count} peças disponíveis</span>` : '<span><i class="bi bi-x-circle"></i> Indisponível</span>'}
                        </div>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                            <strong>Status:</strong> <span>${meat.is_active ? '<i class="bi bi-check-circle"></i> Ativa' : '<i class="bi bi-x-circle"></i> Inativa'}</span>
                        </p>
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            <button onclick="event.stopPropagation(); editMeat('${meat.id}')" style="flex: 1;">Editar</button>
                            <button onclick="event.stopPropagation(); deleteMeat('${meat.id}')" style="background: var(--danger-color); flex: 1;">Excluir</button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar as carnes. Por favor, tente novamente.</div>';
    }
}

function showCreateMeatForm() {
        document.getElementById('admin-meat-modal-title').innerHTML = '<i class="bi bi-plus-circle"></i> Nova Carne';
    document.getElementById('admin-meat-id').value = '';
    document.getElementById('admin-meat-name').value = '';
    document.getElementById('admin-meat-slug').value = '';
    document.getElementById('admin-meat-description').value = '';
    document.getElementById('admin-meat-price').value = '';
    document.getElementById('admin-meat-image').value = '';
    document.getElementById('admin-meat-image-file').value = '';
    document.getElementById('admin-meat-image-preview').style.display = 'none';
    document.getElementById('admin-meat-image-text').innerHTML = '<i class="bi bi-camera"></i> Escolher Imagem';
    document.getElementById('admin-meat-active').checked = true;
    document.getElementById('admin-meat-modal').style.display = 'block';
}

async function editMeat(meatId) {
    try {
        const data = await apiRequest(`/admin/meats/${meatId}`);
        const meat = data.data;

        document.getElementById('admin-meat-modal-title').innerHTML = '<i class="bi bi-pencil"></i> Editar Carne';
        document.getElementById('admin-meat-id').value = meat.id;
        document.getElementById('admin-meat-name').value = meat.name;
        document.getElementById('admin-meat-slug').value = meat.slug;
        document.getElementById('admin-meat-description').value = meat.description || '';
        document.getElementById('admin-meat-price').value = meat.price_per_kg || '';
        document.getElementById('admin-meat-image').value = meat.image_url || '';
        document.getElementById('admin-meat-active').checked = meat.is_active;

        // Mostrar preview da imagem se existir
        const preview = document.getElementById('admin-meat-image-preview');
        const text = document.getElementById('admin-meat-image-text');
        if (meat.image_url) {
            preview.src = normalizeImageUrl(meat.image_url);
            preview.style.display = 'block';
            text.innerHTML = '<i class="bi bi-check-circle"></i> Imagem atual';
        } else {
            preview.style.display = 'none';
            text.innerHTML = '<i class="bi bi-camera"></i> Escolher Imagem';
        }

        // Limpar input de arquivo
        document.getElementById('admin-meat-image-file').value = '';

        document.getElementById('admin-meat-modal').style.display = 'block';
    } catch (error) {
        showMessage('Não foi possível carregar os dados da carne. Por favor, tente novamente.', 'error');
    }
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const text = document.getElementById('admin-meat-image-text');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            text.innerHTML = '<i class="bi bi-check-circle"></i> Imagem selecionada';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function handleSaveMeat(event) {
    event.preventDefault();
    const id = document.getElementById('admin-meat-id').value;
    const isEdit = !!id;

    const formData = new FormData();
    formData.append('name', document.getElementById('admin-meat-name').value);
    formData.append('slug', document.getElementById('admin-meat-slug').value);
    formData.append('description', document.getElementById('admin-meat-description').value || '');
    formData.append('price_per_kg', document.getElementById('admin-meat-price').value || '');
    // Enviar is_active como boolean - usar '1' ou '0' que o Laravel converte corretamente
    const isActive = document.getElementById('admin-meat-active').checked;
    formData.append('is_active', isActive ? '1' : '0');

    // Se tem arquivo de imagem, usar ele. Senão, usar URL se informada
    const imageFile = document.getElementById('admin-meat-image-file').files[0];
    if (imageFile) {
        console.log('📤 Enviando arquivo de imagem:', imageFile.name, 'Tamanho:', imageFile.size, 'bytes', 'Tipo:', imageFile.type);
        formData.append('image', imageFile);
    } else {
        const imageUrl = document.getElementById('admin-meat-image').value;
        if (imageUrl) {
            console.log('📤 Enviando URL de imagem:', imageUrl);
            formData.append('image_url', imageUrl);
        } else {
            console.log('⚠️ Nenhuma imagem ou URL informada');
        }
    }

    try {
        const url = isEdit ? `${API_BASE}/admin/meats/${id}` : `${API_BASE}/admin/meats`;

        if (isEdit) {
            formData.append('_method', 'PUT');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
                // Não definir Content-Type - o browser define automaticamente com boundary para FormData
            },
            body: formData
        });

        const data = await response.json();

        // Debug: log da resposta completa
        console.log('Resposta do servidor (salvar carne):', {
            status: response.status,
            ok: response.ok,
            data: data
        });

        if (response.ok) {
            // Debug: log da imagem retornada
            if (data.data && data.data.image_url) {
                console.log('✅ Imagem retornada pelo servidor:', data.data.image_url);
                console.log('✅ URL normalizada seria:', normalizeImageUrl(data.data.image_url));
            } else {
                console.warn('⚠️ Nenhuma imagem retornada na resposta');
            }

            showMessage(isEdit ? 'Carne atualizada com sucesso.' : 'Carne criada com sucesso.', 'success');
            closeModal('admin-meat-modal');
            // Limpar formulário
            document.getElementById('admin-meat-id').value = '';
            document.getElementById('admin-meat-name').value = '';
            document.getElementById('admin-meat-slug').value = '';
            document.getElementById('admin-meat-description').value = '';
            document.getElementById('admin-meat-price').value = '';
            document.getElementById('admin-meat-image').value = '';
            document.getElementById('admin-meat-image-file').value = '';
            document.getElementById('admin-meat-image-preview').style.display = 'none';
            document.getElementById('admin-meat-image-text').innerHTML = '<i class="bi bi-camera"></i> Escolher Imagem';
            document.getElementById('admin-meat-active').checked = true;
            // Recarregar lista
            loadAdminMeats();
        } else {
            const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message;
            showMessage(errorMsg || 'Não foi possível salvar a carne. Por favor, tente novamente.', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

async function deleteMeat(meatId) {
    showConfirm(
        'Tem certeza que deseja excluir esta carne? Esta ação não pode ser desfeita.',
        async () => {
    try {
        const response = await fetch(`${API_BASE}/admin/meats/${meatId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
                    showMessage('Carne excluída com sucesso.', 'success');
            loadAdminMeats();
        } else {
            const data = await response.json();
                    showMessage(data.message || 'Não foi possível excluir a carne. Por favor, tente novamente.', 'error');
        }
    } catch (error) {
                showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
        }
    );
}

function showCreateDateForm() {
        document.getElementById('admin-date-modal-title').innerHTML = '<i class="bi bi-calendar-plus"></i> Nova Data';
    document.getElementById('admin-date-id').value = '';
    document.getElementById('admin-date-date').value = '';
    document.getElementById('admin-date-open').checked = true;
    document.getElementById('admin-date-notes').value = '';
    document.getElementById('admin-date-modal').style.display = 'block';
}

async function handleSaveDate(event) {
    event.preventDefault();
    const id = document.getElementById('admin-date-id').value;
    const isEdit = !!id;

    const dateData = {
        date: document.getElementById('admin-date-date').value,
        is_open: document.getElementById('admin-date-open').checked,
        notes: document.getElementById('admin-date-notes').value || null,
    };

    try {
        const url = isEdit ? `${API_BASE}/admin/available-dates/${id}` : `${API_BASE}/admin/available-dates`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(dateData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(isEdit ? 'Data atualizada com sucesso.' : 'Data criada com sucesso.', 'success');
            closeModal('admin-date-modal');
            loadAdminDates();
        } else {
            const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message;
            showMessage(errorMsg || 'Não foi possível salvar a data. Por favor, tente novamente.', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}


async function loadAdminReservations(showAll = false) {
    const container = document.getElementById('admin-reservations-list');
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        let url = '/admin/reservations';

        // Se não estiver mostrando tudo, filtrar últimos 7 dias
        if (!showAll) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
            url += `?from_date=${dateFrom}`;
        }

        const data = await apiRequest(url);
        if (data.data) {
            container.innerHTML = '';
            if (data.data.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma reserva encontrada</p>';
                return;
            }
            data.data.forEach(reservation => {
                const card = document.createElement('div');
                card.className = `reservation-card status-${reservation.status}`;
                card.innerHTML = `
                    <div class="info">
                        <h3>${reservation.user?.name || 'N/A'} - ${reservation.meat_item?.meat?.name || 'Carne'}</h3>
                        <p><strong>Cliente:</strong> ${reservation.user?.email || 'N/A'} ${reservation.user?.phone ? `| Tel: ${reservation.user.phone}` : ''}</p>
                        <p><strong>Peça:</strong> ${reservation.meat_item?.code || 'N/A'}</p>
                        ${reservation.meat_item?.weight_kg ? `<p><strong>Peso:</strong> ${reservation.meat_item.weight_kg}kg</p>` : ''}
                        ${reservation.meat_item?.fixed_price ? `<p><strong>Preço:</strong> R$ ${parseFloat(reservation.meat_item.fixed_price).toFixed(2)}</p>` : ''}
                        <p><strong>Data de retirada:</strong> ${formatDate(reservation.available_date?.date)}</p>
                        <p><strong>Status:</strong> <span class="status ${reservation.status}">${getStatusText(reservation.status)}</span></p>
                        ${reservation.notes ? `<p><strong>Observações:</strong> ${reservation.notes}</p>` : ''}
                        <p style="font-size: 12px; color: var(--text-light); margin-top: 8px;">Reservado em: ${formatDateTime(reservation.created_at)}</p>
                    </div>
                    <div class="actions">
                        ${reservation.status === 'reserved' ? `
                            <button onclick="fulfillReservation('${reservation.id}')" style="background: var(--success-color);"><i class="bi bi-check-circle"></i> Concluir Retirada</button>
                            <button onclick="adminCancelReservation('${reservation.id}')" style="background: var(--danger-color);"><i class="bi bi-x-circle"></i> Cancelar</button>
                        ` : ''}
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar as reservas. Por favor, tente novamente.</div>';
    }
}

function showAdminReservationHistory() {
    const filterBar = document.querySelector('#admin-reservations .filter-bar');
    if (filterBar) {
        const historyBtn = filterBar.querySelector('.btn-history');
        if (historyBtn) {
            historyBtn.style.display = 'none';
        }
        
        // Adicionar botão de voltar
        let backBtn = filterBar.querySelector('.btn-back-history');
        if (!backBtn) {
            backBtn = document.createElement('button');
            backBtn.className = 'btn-back-history';
            backBtn.innerHTML = '<i class="bi bi-arrow-left"></i> Voltar';
            backBtn.onclick = showAdminRecentReservations;
            filterBar.insertBefore(backBtn, filterBar.firstChild);
        }
        backBtn.style.display = 'flex';
        
        const dateRange = filterBar.querySelector('.filter-date-range');
        if (dateRange) {
            dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Mostrando todo o histórico';
        }
    }
    
    loadAdminReservations(true);
}

function showAdminRecentReservations() {
    const filterBar = document.querySelector('#admin-reservations .filter-bar');
    if (filterBar) {
        const backBtn = filterBar.querySelector('.btn-back-history');
        if (backBtn) {
            backBtn.style.display = 'none';
        }
        
        const historyBtn = filterBar.querySelector('.btn-history');
        if (historyBtn) {
            historyBtn.style.display = 'flex';
        }
        
        const dateRange = filterBar.querySelector('.filter-date-range');
        if (dateRange) {
            dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Últimos 7 dias';
        }
    }
    
    loadAdminReservations(false);
}

async function loadAdminDates() {
    const container = document.getElementById('admin-dates-list');
    container.innerHTML = '<div class="loading">Carregando datas disponíveis...</div>';

    try {
        const data = await apiRequest('/admin/available-dates');
        if (data.data) {
            container.innerHTML = '';
            if (data.data.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma data cadastrada</p>';
                return;
            }
            data.data.forEach(date => {
                const card = document.createElement('div');
                card.className = 'date-card';
                card.innerHTML = `
                        <div>
                            <h3>${formatDate(date.date)}</h3>
                        <p><strong>Status:</strong> <span>${date.is_open ? '<i class="bi bi-check-circle"></i> Aberta para agendamentos' : '<i class="bi bi-x-circle"></i> Fechada</span>'}</p>
                            ${date.notes ? `<p><strong>Observações:</strong> ${date.notes}</p>` : ''}
                        </div>
                    <div class="date-card-actions">
                        <button onclick="editDate('${date.id}')" class="btn-edit"><i class="bi bi-pencil"></i> Editar</button>
                        <button onclick="deleteDate('${date.id}')" class="btn-delete"><i class="bi bi-trash"></i> Excluir</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar as datas. Por favor, tente novamente.</div>';
    }
}

async function editDate(dateId) {
    try {
        const data = await apiRequest(`/admin/available-dates/${dateId}`);
        const date = data.data;

        document.getElementById('admin-date-modal-title').innerHTML = '<i class="bi bi-pencil"></i> Editar Data';
        document.getElementById('admin-date-id').value = date.id;
        document.getElementById('admin-date-date').value = date.date;
        document.getElementById('admin-date-open').checked = date.is_open;
        document.getElementById('admin-date-notes').value = date.notes || '';
        document.getElementById('admin-date-modal').style.display = 'block';
    } catch (error) {
        showMessage('Não foi possível carregar os dados da data. Por favor, tente novamente.', 'error');
    }
}

async function deleteDate(dateId) {
    showConfirm(
        'Tem certeza que deseja excluir esta data? Se houver reservas associadas, elas serão canceladas automaticamente e permanecerão visíveis no histórico.',
        async () => {
    try {
        const response = await fetch(`${API_BASE}/admin/available-dates/${dateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

                const data = await response.json();

        if (response.ok) {
                    showMessage(data.message || 'Data excluída com sucesso.', 'success');
            loadAdminDates();
        } else {
                    showMessage(data.message || 'Não foi possível excluir a data. Por favor, tente novamente.', 'error');
                }
            } catch (error) {
                showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
            }
        }
    );
}

// Estoque
async function loadAdminStock() {
    const container = document.getElementById('admin-stock-list');
    container.innerHTML = '<div class="loading">Carregando estoque...</div>';

    try {
        const meatId = document.getElementById('filter-stock-meat')?.value || '';
        const status = document.getElementById('filter-stock-status')?.value || '';
        
        let url = '/admin/meat-items';
        const params = new URLSearchParams();
        if (meatId) params.append('meat_id', meatId);
        if (status) params.append('status', status);
        if (params.toString()) url += '?' + params.toString();

        const data = await apiRequest(url);
        if (data.data) {
            container.innerHTML = '';
            if (data.data.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum item no estoque</p>';
                return;
            }
            data.data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'stock-item-card';
                card.innerHTML = `
                    <div class="stock-item-info">
                        <h3>${item.code}</h3>
                        <p><strong>Tipo:</strong> ${item.meat?.name || 'N/A'}</p>
                        ${item.weight_kg ? `<p><strong>Peso:</strong> ${parseFloat(item.weight_kg).toFixed(3)} kg</p>` : '<p><strong>Peso:</strong> Não informado</p>'}
                        ${item.fixed_price ? `<p><strong>Preço:</strong> R$ ${parseFloat(item.fixed_price).toFixed(2)}</p>` : '<p><strong>Preço:</strong> Não informado</p>'}
                        <p><strong>Status:</strong> <span class="stock-status status-${item.status}">${getStockStatusText(item.status)}</span></p>
                    </div>
                    <div class="stock-item-actions">
                        <button onclick="editStockItem('${item.id}')" class="btn-edit"><i class="bi bi-pencil"></i> Editar</button>
                        ${item.status === 'available' || item.status === 'canceled' ? `<button onclick="deleteStockItem('${item.id}')" class="btn-delete"><i class="bi bi-trash"></i> Excluir</button>` : ''}
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error" style="text-align: center; padding: 40px; color: var(--danger-color);">Não foi possível carregar o estoque. Por favor, tente novamente.</div>';
    }
}

async function loadStockMeatsFilter() {
    const select = document.getElementById('filter-stock-meat');
    const modalSelect = document.getElementById('admin-stock-meat');
    
    if (!select || !modalSelect) return;

    try {
        const data = await apiRequest('/admin/meats');
        if (data.data) {
            // Limpar opções existentes (exceto a primeira)
            select.innerHTML = '<option value="">Todas as carnes</option>';
            modalSelect.innerHTML = '<option value="">Selecione o tipo de carne</option>';
            
            data.data.forEach(meat => {
                const option1 = document.createElement('option');
                option1.value = meat.id;
                option1.textContent = meat.name;
                select.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = meat.id;
                option2.textContent = meat.name;
                modalSelect.appendChild(option2);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar carnes para filtro:', error);
    }
}

function showCreateStockForm() {
    loadStockMeatsFilter();
    document.getElementById('admin-stock-quantity').value = '1';
    document.getElementById('admin-stock-weight').value = '';
    document.getElementById('admin-stock-price').value = '';
    document.getElementById('admin-stock-meat').value = '';
    document.getElementById('admin-stock-modal').style.display = 'block';
}

async function handleSaveStock(event) {
    event.preventDefault();
    const meatId = document.getElementById('admin-stock-meat').value;
    const quantity = parseInt(document.getElementById('admin-stock-quantity').value);
    const weight = document.getElementById('admin-stock-weight').value.trim();
    const price = document.getElementById('admin-stock-price').value.trim();

    if (!meatId || !quantity) {
        showMessage('Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    try {
        const requestData = {
            meat_id: meatId,
            quantity: quantity,
        };

        // Se weight ou price foram fornecidos, adicionar como valores únicos (o backend aplica a todos)
        if (weight) {
            const weightNum = parseFloat(weight);
            if (!isNaN(weightNum) && weightNum > 0) {
                requestData.weight_kg = weightNum;
            }
        }
        if (price) {
            const priceNum = parseFloat(price);
            if (!isNaN(priceNum) && priceNum > 0) {
                requestData.fixed_price = priceNum;
            }
        }

        const response = await fetch(`${API_BASE}/admin/meat-items/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
        });

            const data = await response.json();

        if (response.ok) {
            showMessage(data.message || `${quantity} peça(s) cadastrada(s) com sucesso.`, 'success');
            closeModal('admin-stock-modal');
            loadAdminStock();
        } else {
            showMessage(data.message || 'Não foi possível cadastrar o estoque. Por favor, tente novamente.', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

async function editStockItem(itemId) {
    try {
        const data = await apiRequest(`/admin/meat-items/${itemId}`);
        if (data.data) {
            populateEditStockItemModal(data.data);
        } else {
            showMessage('Item não encontrado.', 'error');
        }
    } catch (error) {
        showMessage('Não foi possível carregar os dados do item. Por favor, tente novamente.', 'error');
    }
}

function populateEditStockItemModal(item) {
    document.getElementById('admin-stock-item-id').value = item.id;
    document.getElementById('admin-stock-item-code').value = item.code;
    document.getElementById('admin-stock-item-meat').value = item.meat?.name || 'N/A';
    document.getElementById('admin-stock-item-weight').value = item.weight_kg || '';
    document.getElementById('admin-stock-item-price').value = item.fixed_price || '';
    document.getElementById('admin-stock-item-status').value = item.status;
    document.getElementById('admin-stock-item-modal').style.display = 'block';
}

async function handleUpdateStockItem(event) {
    event.preventDefault();
    const itemId = document.getElementById('admin-stock-item-id').value;
    const weight = document.getElementById('admin-stock-item-weight').value;
    const price = document.getElementById('admin-stock-item-price').value;
    const status = document.getElementById('admin-stock-item-status').value;

    try {
        const requestData = {
            weight_kg: weight ? parseFloat(weight) : null,
            fixed_price: price ? parseFloat(price) : null,
            status: status,
        };

        const response = await fetch(`${API_BASE}/admin/meat-items/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Item atualizado com sucesso.', 'success');
            closeModal('admin-stock-item-modal');
            loadAdminStock();
        } else {
            showMessage(data.message || 'Não foi possível atualizar o item. Por favor, tente novamente.', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

async function deleteStockItem(itemId) {
    showConfirm(
        'Tem certeza que deseja excluir este item do estoque? Esta ação não pode ser desfeita.',
        async () => {
            try {
                const response = await fetch(`${API_BASE}/admin/meat-items/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(data.message || 'Item excluído com sucesso.', 'success');
                    loadAdminStock();
                } else {
                    showMessage(data.message || 'Não foi possível excluir o item. Por favor, tente novamente.', 'error');
                }
            } catch (error) {
                showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
            }
        }
    );
}

function getStockStatusText(status) {
    const statusMap = {
        'available': 'Disponível',
        'reserved': 'Reservado',
        'picked_up': 'Retirado',
        'canceled': 'Cancelado'
    };
    return statusMap[status] || status;
}

async function fulfillReservation(reservationId) {
    showConfirm(
        'Confirmar que o cliente retirou a carne? Esta ação marcará a reserva como concluída.',
        async () => {
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processando...';

    try {
        const response = await fetch(`${API_BASE}/admin/reservations/${reservationId}/fulfill`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
                    showMessage('Retirada confirmada com sucesso.', 'success');
            // Recarregar sem reload da página
            const filterBar = document.querySelector('#admin-reservations .filter-bar');
            const isShowingHistory = filterBar?.querySelector('.filter-date-range')?.textContent.includes('todo o histórico');
            loadAdminReservations(isShowingHistory);
        } else {
                    showMessage(data.message || 'Não foi possível confirmar a retirada. Por favor, tente novamente.', 'error');
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
                showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
        }
    );
}

async function adminCancelReservation(reservationId) {
    showConfirm(
        'Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.',
        async () => {
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Cancelando...';

    try {
        const response = await fetch(`${API_BASE}/reservations/${reservationId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
                    showMessage('Reserva cancelada com sucesso.', 'success');
            const filterBar = document.querySelector('#admin-reservations .filter-bar');
            const isShowingHistory = filterBar?.querySelector('.filter-date-range')?.textContent.includes('todo o histórico');
            loadAdminReservations(isShowingHistory);
        } else {
                    showMessage(data.message || 'Não foi possível cancelar a reserva. Por favor, tente novamente.', 'error');
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
                showMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
        }
    );
}

// Utilitários
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showMessage(message, type = 'info') {
    const msgEl = document.getElementById('message');
    msgEl.textContent = message;
    msgEl.className = `message ${type}`;
    msgEl.style.display = 'block';

    setTimeout(() => {
        msgEl.style.display = 'none';
    }, 5000);
}

// Função de confirmação profissional
function showConfirm(message, onConfirm, onCancel = null) {
    // Criar modal de confirmação
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal';
    confirmModal.id = 'confirm-modal';
    confirmModal.style.display = 'block';
    confirmModal.innerHTML = `
        <div class="modal-content confirm-modal-content">
            <h3 style="margin-bottom: 16px; color: var(--text-primary);">Confirmar ação</h3>
            <p style="margin-bottom: 24px; color: var(--text-secondary); line-height: 1.6;">${message}</p>
            <div class="confirm-modal-actions">
                <button onclick="closeConfirmModal(false)" class="btn-secondary confirm-btn-cancel">Cancelar</button>
                <button onclick="closeConfirmModal(true)" class="btn-primary confirm-btn-confirm">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);

    // Armazenar callbacks
    window.confirmCallback = onConfirm;
    window.cancelCallback = onCancel;

    // Fechar ao clicar fora
    confirmModal.onclick = function(event) {
        if (event.target === confirmModal) {
            closeConfirmModal(false);
        }
    };
}

function closeConfirmModal(confirmed) {
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) {
        confirmModal.remove();
    }

    if (confirmed && window.confirmCallback) {
        window.confirmCallback();
    } else if (!confirmed && window.cancelCallback) {
        window.cancelCallback();
    }

    delete window.confirmCallback;
    delete window.cancelCallback;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statusMap = {
        'reserved': 'Reservada',
        'canceled': 'Cancelada',
        'fulfilled': 'Concluída'
    };
    return statusMap[status] || status;
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Funções de validação em tempo real
function validateLoginEmail() {
    const emailInput = document.getElementById('login-email');
    const errorEl = document.getElementById('login-email-error');
    const email = emailInput.value.trim();

    if (!email) {
        errorEl.textContent = '';
        emailInput.classList.remove('error', 'success');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorEl.textContent = 'Por favor, insira um e-mail válido';
        emailInput.classList.add('error');
        emailInput.classList.remove('success');
        return false;
    }

    errorEl.textContent = '';
    emailInput.classList.remove('error');
    emailInput.classList.add('success');
    return true;
}

function validateLoginPassword() {
    const passwordInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-password-error');
    const password = passwordInput.value;

    if (!password) {
        errorEl.textContent = '';
        passwordInput.classList.remove('error', 'success');
        return false;
    }

    if (password.length < 8) {
        errorEl.textContent = 'A senha deve ter no mínimo 8 caracteres';
        passwordInput.classList.add('error');
        passwordInput.classList.remove('success');
        return false;
    }

    errorEl.textContent = '';
    passwordInput.classList.remove('error');
    passwordInput.classList.add('success');
    return true;
}

function validateRegisterName() {
    const nameInput = document.getElementById('register-name');
    const errorEl = document.getElementById('register-name-error');
    const name = nameInput.value.trim();

    if (!name) {
        errorEl.textContent = '';
        nameInput.classList.remove('error', 'success');
        return false;
    }

    if (name.length < 3) {
        errorEl.textContent = 'O nome deve ter no mínimo 3 caracteres';
        nameInput.classList.add('error');
        nameInput.classList.remove('success');
        return false;
    }

    errorEl.textContent = '';
    nameInput.classList.remove('error');
    nameInput.classList.add('success');
    return true;
}

function validateRegisterEmail() {
    const emailInput = document.getElementById('register-email');
    const errorEl = document.getElementById('register-email-error');
    const email = emailInput.value.trim();

    if (!email) {
        errorEl.textContent = '';
        emailInput.classList.remove('error', 'success');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorEl.textContent = 'Por favor, insira um e-mail válido';
        emailInput.classList.add('error');
        emailInput.classList.remove('success');
        return false;
    }

    errorEl.textContent = '';
    emailInput.classList.remove('error');
    emailInput.classList.add('success');
    return true;
}

function validateRegisterPassword() {
    const passwordInput = document.getElementById('register-password');
    const errorEl = document.getElementById('register-password-error');
    const password = passwordInput.value;

    if (!password) {
        errorEl.textContent = '';
        passwordInput.classList.remove('error', 'success');
        return false;
    }

    if (password.length < 8) {
        errorEl.textContent = 'A senha deve ter no mínimo 8 caracteres';
        passwordInput.classList.add('error');
        passwordInput.classList.remove('success');
        return false;
    }

    // Verificar se tem pelo menos uma letra e um número
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
        errorEl.textContent = 'A senha deve conter letras e números';
        passwordInput.classList.add('error');
        passwordInput.classList.remove('success');
        return false;
    }

    errorEl.textContent = '';
    passwordInput.classList.remove('error');
    passwordInput.classList.add('success');

    // Revalidar confirmação se já preenchida
    const confirmInput = document.getElementById('register-password-confirm');
    if (confirmInput.value) {
        validateRegisterPasswordConfirm();
    }

    return true;
}

function validateRegisterPasswordConfirm() {
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-password-confirm');
    const errorEl = document.getElementById('register-password-confirm-error');
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!confirm) {
        errorEl.textContent = '';
        confirmInput.classList.remove('error', 'success');
        return false;
    }

    if (password !== confirm) {
        errorEl.textContent = 'As senhas não coincidem';
        confirmInput.classList.add('error');
        confirmInput.classList.remove('success');
        return false;
    }

    errorEl.textContent = '';
    confirmInput.classList.remove('error');
    confirmInput.classList.add('success');
    return true;
}
