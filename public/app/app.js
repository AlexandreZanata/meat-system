// Configuração
const API_BASE = '/api/v1';
let authToken = localStorage.getItem('auth_token');
let currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Permitir navegação sem login - só mostrar tela de login se necessário
    if (authToken && currentUser) {
        showMainScreen();
    } else {
        // Mostrar tela principal sem login - usuário pode navegar
        showMainScreenWithoutAuth();
    }
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
                localStorage.setItem('auth_token', authToken);
                localStorage.setItem('current_user', JSON.stringify(currentUser));
                showMessage('Login realizado com sucesso!', 'success');
                showMainScreen();

                // Se havia uma reserva pendente, abrir modal
                if (window.pendingReservation) {
                    setTimeout(() => {
                        openReservationModal(window.pendingReservation.meatItemId);
                        window.pendingReservation = null;
                    }, 500);
                }
            } else {
                showMessage('Resposta inválida do servidor', 'error');
            }
        } else {
            let errorMsg = data.message || 'Erro ao fazer login';
            if (data.errors) {
                const errors = Object.values(data.errors).flat();
                errorMsg = errors.join(', ');
            }
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage('Erro de conexão: ' + error.message, 'error');
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
                localStorage.setItem('auth_token', authToken);
                localStorage.setItem('current_user', JSON.stringify(currentUser));
                showMessage('Registro realizado com sucesso!', 'success');
                showMainScreen();

                // Se havia uma reserva pendente, abrir modal
                if (window.pendingReservation) {
                    setTimeout(() => {
                        openReservationModal(window.pendingReservation.meatItemId);
                        window.pendingReservation = null;
                    }, 500);
                }
            } else {
                showMessage('Resposta inválida do servidor', 'error');
            }
        } else {
            let errorMsg = data.message || 'Erro ao registrar';
            if (data.errors) {
                const errors = Object.values(data.errors).flat();
                errorMsg = errors.join(', ');
            }
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        showMessage('Erro de conexão: ' + error.message, 'error');
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

    showSection('catalog');
    loadMeats();
}

function showMainScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('guest-info').style.display = 'none';

    document.getElementById('user-name').textContent = currentUser.name;

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

    if (section === 'catalog') loadMeats();
    if (section === 'availability') loadAvailability();
    if (section === 'my-reservations') loadMyReservations();
    if (section === 'admin') {
        showAdminTab('admin-reservations');
        if (currentUser && currentUser.role === 'admin') {
            loadAdminReservations();
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
        const tabsArray = ['admin-reservations', 'admin-meats', 'admin-dates'];
        const index = tabsArray.indexOf(tab);
        if (index >= 0 && tabs[index]) {
            tabs[index].classList.add('active');
        }
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
        container.innerHTML = '<div class="error">Erro ao carregar carnes</div>';
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
        container.innerHTML = '<div class="error">Erro ao buscar</div>';
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
        showMessage('Erro ao carregar detalhes', 'error');
    }
}

// Disponibilidade
async function loadAvailability() {
    const container = document.getElementById('dates-list');
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const dates = await apiRequest('/availability/dates');
        if (dates.data) {
            container.innerHTML = '';
            const today = new Date().toISOString().split('T')[0];
            dates.data.forEach(date => {
                // Mostrar apenas datas abertas e futuras
                if (date.is_open && date.date >= today) {
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
            if (container.innerHTML === '') {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma data disponível</p>';
            }
        }
    } catch (error) {
        container.innerHTML = '<div class="error">Erro ao carregar disponibilidade</div>';
    }
}

// Reservas
let selectedMeatItemId = null;
let selectedDate = null;

function openReservationModal(meatItemId) {
    // Verificar se está logado
    if (!authToken || !currentUser) {
        showMessage('Você precisa fazer login ou criar uma conta para fazer uma reserva.', 'info');
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
        showMessage('Erro ao carregar datas', 'error');
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
            showMessage('Reserva criada com sucesso!', 'success');
            closeModal('reservation-modal');
            // Limpar formulário
            document.getElementById('reservation-notes').value = '';
            document.getElementById('reservation-date').value = '';
            document.getElementById('reservation-meat-item-id').value = '';
            showSection('my-reservations');
            loadMyReservations();
        } else {
            // Tratar diferentes tipos de erro
            let errorMsg = 'Erro ao criar reserva';

            if (data.message) {
                errorMsg = data.message;
            } else if (data.errors) {
                const errors = Object.values(data.errors).flat();
                errorMsg = errors.join(', ');
            } else if (response.status === 409) {
                errorMsg = 'Esta peça não está mais disponível. Tente novamente.';
            } else if (response.status === 422) {
                errorMsg = 'Dados inválidos. Verifique os campos preenchidos.';
            } else if (response.status === 401) {
                errorMsg = 'Sessão expirada. Faça login novamente.';
                logout();
            }

            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        showMessage('Erro de conexão: ' + (error.message || 'Não foi possível conectar ao servidor'), 'error');
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
        container.innerHTML = '<div class="error">Erro ao carregar reservas</div>';
    }
}

function showReservationHistory() {
    // Marcar que estamos no modo histórico
    const filterBar = document.querySelector('#my-reservations-section .filter-bar');
    if (!filterBar.querySelector('.filter-date-range')) {
        const dateRange = document.createElement('span');
        dateRange.className = 'filter-date-range';
        dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Mostrando todo o histórico';
        filterBar.appendChild(dateRange);
    } else {
        filterBar.querySelector('.filter-date-range').textContent = '📅 Mostrando todo o histórico';
    }

    loadMyReservations(true);
}

function showRecentReservations() {
    const filterBar = document.querySelector('#my-reservations-section .filter-bar');
    const dateRange = filterBar.querySelector('.filter-date-range');
    if (dateRange) {
        dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Últimos 7 dias';
    }

    loadMyReservations(false);
}

async function cancelReservation(reservationId) {
    if (!confirm('Deseja realmente cancelar esta reserva?')) return;

    // Adicionar indicador de loading no botão
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
            showMessage('Reserva cancelada com sucesso!', 'success');
            // Recarregar reservas sem reload da página
            const filterBar = document.querySelector('#my-reservations-section .filter-bar');
            const isShowingHistory = filterBar.querySelector('.filter-date-range')?.textContent.includes('todo o histórico');
            loadMyReservations(isShowingHistory);
        } else {
            showMessage(data.message || 'Erro ao cancelar reserva', 'error');
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
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
        container.innerHTML = '<div class="error">Erro ao carregar</div>';
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
        showMessage('Erro ao carregar dados da carne', 'error');
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
    formData.append('is_active', document.getElementById('admin-meat-active').checked ? '1' : '0');

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

            showMessage(isEdit ? 'Carne atualizada com sucesso!' : 'Carne criada com sucesso!', 'success');
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
            showMessage(errorMsg || 'Erro ao salvar', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão: ' + error.message, 'error');
    }
}

async function deleteMeat(meatId) {
    if (!confirm('Deseja realmente excluir esta carne?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/meats/${meatId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Carne excluída com sucesso!', 'success');
            loadAdminMeats();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Erro ao excluir', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
    }
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
            showMessage(isEdit ? 'Data atualizada com sucesso!' : 'Data criada com sucesso!', 'success');
            closeModal('admin-date-modal');
            loadAdminDates();
        } else {
            const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message;
            showMessage(errorMsg || 'Erro ao salvar', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
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
        container.innerHTML = '<div class="error">Erro ao carregar</div>';
    }
}

function showAdminReservationHistory() {
    loadAdminReservations(true);
    const filterBar = document.querySelector('#admin-reservations .filter-bar');
    if (filterBar) {
        const dateRange = filterBar.querySelector('.filter-date-range');
        if (dateRange) {
            dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Mostrando todo o histórico';
        }
    }
}

function showAdminRecentReservations() {
    loadAdminReservations(false);
    const filterBar = document.querySelector('#admin-reservations .filter-bar');
    if (filterBar) {
        const dateRange = filterBar.querySelector('.filter-date-range');
        if (dateRange) {
            dateRange.innerHTML = '<i class="bi bi-calendar3"></i> Últimos 7 dias';
        }
    }
}

async function loadAdminDates() {
    const container = document.getElementById('admin-dates-list');
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const data = await apiRequest('/admin/available-dates');
        if (data.data) {
            container.innerHTML = '';
            if (data.data.length === 0) {
                container.innerHTML = '<p>Nenhuma data cadastrada</p>';
                return;
            }
            data.data.forEach(date => {
                const card = document.createElement('div');
                card.className = 'date-card';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h3>${formatDate(date.date)}</h3>
                            <p><strong>Status:</strong> <span>${date.is_open ? '<i class="bi bi-check-circle"></i> Aberta' : '<i class="bi bi-x-circle"></i> Fechada'}</span></p>
                            ${date.notes ? `<p><strong>Observações:</strong> ${date.notes}</p>` : ''}
                        </div>
                        <div>
                            <button onclick="editDate('${date.id}')" style="margin-right: 5px;">Editar</button>
                            <button onclick="deleteDate('${date.id}')" style="background: var(--danger-color);">Excluir</button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error">Erro ao carregar</div>';
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
        showMessage('Erro ao carregar dados da data', 'error');
    }
}

async function deleteDate(dateId) {
    if (!confirm('Deseja realmente excluir esta data?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/available-dates/${dateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Data excluída com sucesso!', 'success');
            loadAdminDates();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Erro ao excluir', 'error');
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
    }
}

async function fulfillReservation(reservationId) {
    if (!confirm('Confirmar que o cliente retirou a carne?')) return;

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
            showMessage('Retirada concluída!', 'success');
            // Recarregar sem reload da página
            const filterBar = document.querySelector('#admin-reservations .filter-bar');
            const isShowingHistory = filterBar?.querySelector('.filter-date-range')?.textContent.includes('todo o histórico');
            loadAdminReservations(isShowingHistory);
        } else {
            showMessage(data.message || 'Erro', 'error');
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
}

async function adminCancelReservation(reservationId) {
    if (!confirm('Deseja realmente cancelar esta reserva?')) return;

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
            showMessage('Reserva cancelada!', 'success');
            const filterBar = document.querySelector('#admin-reservations .filter-bar');
            const isShowingHistory = filterBar?.querySelector('.filter-date-range')?.textContent.includes('todo o histórico');
            loadAdminReservations(isShowingHistory);
        } else {
            showMessage(data.message || 'Erro ao cancelar', 'error');
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
        showMessage('Erro de conexão', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
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
