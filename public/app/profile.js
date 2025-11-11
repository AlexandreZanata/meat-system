// Profile Management - Usa variáveis globais do app.js
// API_BASE, authToken e currentUser são globais do app.js

// Mensagens
function showProfileMessage(msg, type = 'info') {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? '#ea1d2c' : type === 'success' ? '#00a859' : '#ea1d2c'};
        color: white; padding: 12px 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10000;
        font-size: 14px; font-weight: 600; max-width: 90%; text-align: center;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// Carregar perfil do servidor
async function loadProfile() {
    // Usar variáveis globais do app.js
    const token = window.authToken || localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/app/index.html';
        return;
    }

    // Tentar usar cache primeiro para mostrar dados imediatamente
    const cached = JSON.parse(localStorage.getItem('current_user') || 'null');
    if (cached && cached.id) {
        if (window.currentUser !== undefined) {
            window.currentUser = cached;
        }
        fillForm(cached);
    }

    try {
        // Usar API_BASE global do app.js
        const apiBase = window.API_BASE || '/api/v1';
        const response = await fetch(`${apiBase}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            showProfileMessage('Sessão expirada. Faça login novamente.', 'error');
            setTimeout(() => window.location.href = '/app/index.html', 2000);
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: Não foi possível carregar o perfil`);
        }

        const result = await response.json();
        
        // A API retorna { data: { ... } }
        const userData = result.data;
        
        if (userData && userData.id) {
            // Atualizar variável global
            if (window.currentUser !== undefined) {
                window.currentUser = userData;
            }
            localStorage.setItem('current_user', JSON.stringify(userData));
            fillForm(userData);
        } else {
            throw new Error('Dados do perfil inválidos');
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Se falhar, manter dados em cache se existirem
        if (!cached || !cached.id) {
            showProfileMessage('Erro ao carregar perfil. Tente recarregar a página.', 'error');
        }
    }
}

// Preencher formulário com dados do usuário
function fillForm(user) {
    console.log('Preenchendo formulário com:', user);
    
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const phoneInput = document.getElementById('profile-phone-input');
    const avatarInput = document.getElementById('profile-avatar-url-input');
    const whatsappInput = document.getElementById('profile-whatsapp-input');
    const adminField = document.getElementById('admin-whatsapp-field');
    
    if (nameEl) nameEl.textContent = user.name || 'Usuário';
    if (emailEl) emailEl.textContent = user.email || 'Sem e-mail';
    if (nameInput) {
        nameInput.value = user.name || '';
        nameInput.disabled = false;
    }
    if (emailInput) {
        emailInput.value = user.email || '';
        emailInput.disabled = true; // Email não pode ser editado
    }
    if (phoneInput) {
        phoneInput.value = user.phone || '';
        phoneInput.disabled = false;
    }
    if (avatarInput) avatarInput.value = user.avatar_url || '';
    
    // Campo WhatsApp do admin
    if (user.role === 'admin') {
        if (adminField) adminField.style.display = 'block';
        if (whatsappInput) {
            whatsappInput.value = user.whatsapp || '';
            whatsappInput.disabled = false;
        }
    } else {
        if (adminField) adminField.style.display = 'none';
    }
    
    updateAvatar(user.avatar_url);
}

// Avatar
function updateAvatar(url) {
    const img = document.getElementById('profile-avatar');
    if (!img) return;
    
    if (url && url.trim()) {
        img.src = url;
        img.onerror = () => showDefaultAvatar();
    } else {
        showDefaultAvatar();
    }
}

function showDefaultAvatar() {
    const img = document.getElementById('profile-avatar');
    if (!img) return;
    
    const user = window.currentUser || JSON.parse(localStorage.getItem('current_user') || 'null');
    const name = user ? (user.name || 'U') : 'U';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const size = window.innerWidth <= 768 ? 100 : 120;
    const fontSize = window.innerWidth <= 768 ? 40 : 48;
    
    img.src = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" fill="#ea1d2c" rx="${size/2}"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
                  fill="white" font-size="${fontSize}" font-weight="bold" font-family="Arial">${initials}</text>
        </svg>
    `)}`;
    img.onerror = null;
}

// Upload avatar
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showProfileMessage('Selecione uma imagem válida.', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showProfileMessage('Imagem deve ter no máximo 5MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('profile-avatar');
        const input = document.getElementById('profile-avatar-url-input');
        if (img) img.src = e.target.result;
        if (input) input.value = e.target.result;
        showProfileMessage('Imagem carregada! Clique em "Salvar Alterações".', 'success');
    };
    reader.onerror = () => showProfileMessage('Erro ao carregar imagem.', 'error');
    reader.readAsDataURL(file);
}

// Salvar perfil
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const token = window.authToken || localStorage.getItem('auth_token');
    if (!token) {
        showProfileMessage('Não autenticado. Faça login novamente.', 'error');
        window.location.href = '/app/index.html';
        return;
    }
    
    const nameInput = document.getElementById('profile-name-input');
    const phoneInput = document.getElementById('profile-phone-input');
    const avatarInput = document.getElementById('profile-avatar-url-input');
    const whatsappInput = document.getElementById('profile-whatsapp-input');
    
    if (!nameInput) {
        showProfileMessage('Erro ao carregar formulário.', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    if (!name) {
        showProfileMessage('O nome é obrigatório.', 'error');
        nameInput.focus();
        return;
    }
    
    const user = window.currentUser || JSON.parse(localStorage.getItem('current_user') || 'null');
    
    const data = {
        name: name,
        phone: phoneInput ? (phoneInput.value.trim() || null) : null,
        avatar_url: avatarInput ? (avatarInput.value.trim() || null) : null,
    };
    
    // Adicionar WhatsApp apenas se for admin
    if (user && user.role === 'admin' && whatsappInput) {
        const whatsappValue = whatsappInput.value.trim();
        data.whatsapp = whatsappValue !== '' ? whatsappValue : null;
        console.log('Enviando WhatsApp para salvar:', data.whatsapp);
    }
    
    console.log('Dados a serem salvos:', data);
    
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
    }
    
    try {
        const apiBase = window.API_BASE || '/api/v1';
        const response = await fetch(`${apiBase}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Resposta do servidor:', result);
        
        if (response.ok && result.data) {
            // Atualizar variável global
            if (window.currentUser !== undefined) {
                window.currentUser = result.data;
            }
            localStorage.setItem('current_user', JSON.stringify(result.data));
            fillForm(result.data);
            showProfileMessage(result.message || 'Perfil atualizado!', 'success');
            
            // Recarregar botão WhatsApp após salvar
            setTimeout(() => {
                if (typeof loadWhatsAppButton === 'function') {
                    loadWhatsAppButton();
                }
            }, 500);
        } else {
            const msg = result.message || (result.errors ? Object.values(result.errors).flat().join(', ') : 'Erro ao atualizar.');
            showProfileMessage(msg, 'error');
            
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                setTimeout(() => window.location.href = '/app/index.html', 2000);
            }
        }
    } catch (error) {
        showProfileMessage('Erro de conexão: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// ========== WHATSAPP BUTTON ==========

// Carregar número do WhatsApp do admin
async function loadWhatsAppButtonForProfile() {
    const btn = document.getElementById('whatsapp-float-btn');
    if (!btn) {
        return;
    }
    
    // Não mostrar botão WhatsApp para admin - verificar imediatamente
    const user = window.currentUser || JSON.parse(localStorage.getItem('current_user') || 'null');
    if (user && user.role === 'admin') {
        btn.classList.remove('show');
        btn.style.display = 'none';
        btn.style.visibility = 'hidden';
        return;
    }
    
    // Garantir que está visível se não for admin
    btn.style.visibility = 'visible';
    
    try {
        const apiBase = window.API_BASE || '/api/v1';
        const response = await fetch(`${apiBase}/admin/whatsapp`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Verificar se há número e não está vazio
            if (data && data.whatsapp !== null && data.whatsapp !== undefined) {
                const whatsappNumber = String(data.whatsapp).trim();
                
                if (whatsappNumber !== '') {
                    window.adminWhatsApp = whatsappNumber;
                    btn.classList.add('show');
                    btn.style.cursor = 'pointer';
                    btn.onclick = openWhatsApp;
                } else {
                    btn.classList.remove('show');
                }
            } else {
                btn.classList.remove('show');
            }
        } else {
            btn.classList.remove('show');
        }
    } catch (error) {
        console.error('Erro ao carregar WhatsApp:', error);
        btn.classList.remove('show');
    }
}

// Abrir WhatsApp - Funcionalidade simples
function openWhatsApp() {
    if (!window.adminWhatsApp) {
        showProfileMessage('Número de WhatsApp não disponível.', 'error');
        if (typeof loadWhatsAppButton === 'function') {
            loadWhatsAppButton();
        } else {
            loadWhatsAppButtonForProfile();
        }
        return;
    }
    
    // Pegar o número do admin (ex: "66997227927")
    const phoneNumber = window.adminWhatsApp.replace(/\D/g, ''); // Remove tudo que não é número
    
    if (!phoneNumber || phoneNumber.length < 10) {
        showProfileMessage('Número de WhatsApp inválido.', 'error');
        return;
    }
    
    // Criar link do WhatsApp: https://wa.me/66997227927
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    
    // Abrir em nova aba
    window.open(whatsappUrl, '_blank');
}

// Tornar função global
window.openWhatsApp = openWhatsApp;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const token = window.authToken || localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/app/index.html';
        return;
    }
    
    // Esconder botão WhatsApp imediatamente se for admin
    const btn = document.getElementById('whatsapp-float-btn');
    if (btn) {
        const user = window.currentUser || JSON.parse(localStorage.getItem('current_user') || 'null');
        if (user && user.role === 'admin') {
            btn.classList.remove('show');
            btn.style.display = 'none';
            btn.style.visibility = 'hidden';
        }
    }
    
    // Carregar perfil
    loadProfile();
    
    // Carregar botão WhatsApp - usar função do app.js se disponível
    setTimeout(() => {
        if (typeof loadWhatsAppButton === 'function') {
            loadWhatsAppButton();
        } else {
            loadWhatsAppButtonForProfile();
        }
    }, 500);
});
