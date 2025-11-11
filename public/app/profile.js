// Profile Management
const API_BASE = '/api/v1';
let authToken = localStorage.getItem('auth_token');
let currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');

// Função para exibir mensagens
function showProfileMessage(message, type = 'info') {
    // Criar elemento de mensagem temporário
    const messageEl = document.createElement('div');
    messageEl.className = `profile-message profile-message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'var(--danger-color)' : type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 600;
        max-width: 90%;
        text-align: center;
    `;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    if (!authToken || !currentUser) {
        window.location.href = '/app/index.html';
        return;
    }

    loadProfile();
});

async function loadProfile() {
    try {
        console.log('Loading profile...', { hasToken: !!authToken });
        
        if (!authToken) {
            window.location.href = '/app/index.html';
            return;
        }
        
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                window.location.href = '/app/index.html';
                return;
            }
            throw new Error(`HTTP ${response.status}: Não foi possível carregar o perfil`);
        }

        const data = await response.json();
        console.log('Profile data received:', data);
        
        if (!data.data) {
            throw new Error('Dados do perfil não encontrados na resposta');
        }
        
        currentUser = data.data;
        localStorage.setItem('current_user', JSON.stringify(currentUser));

        // Update UI - garantir que os elementos existam
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        const profileNameInput = document.getElementById('profile-name-input');
        const profileEmailInput = document.getElementById('profile-email-input');
        const profilePhoneInput = document.getElementById('profile-phone-input');
        const profileAvatarUrlInput = document.getElementById('profile-avatar-url-input');
        
        if (profileNameEl) profileNameEl.textContent = currentUser.name || 'Usuário';
        if (profileEmailEl) profileEmailEl.textContent = currentUser.email || '';
        if (profileNameInput) profileNameInput.value = currentUser.name || '';
        if (profileEmailInput) profileEmailInput.value = currentUser.email || '';
        if (profilePhoneInput) profilePhoneInput.value = currentUser.phone || '';
        if (profileAvatarUrlInput) profileAvatarUrlInput.value = currentUser.avatar_url || '';

        // Show WhatsApp field for admin
        if (currentUser.role === 'admin') {
            const adminWhatsappField = document.getElementById('admin-whatsapp-field');
            const profileWhatsappInput = document.getElementById('profile-whatsapp-input');
            if (adminWhatsappField) adminWhatsappField.style.display = 'block';
            if (profileWhatsappInput) profileWhatsappInput.value = currentUser.whatsapp || '';
        }

        // Update avatar
        updateAvatar(currentUser.avatar_url);
        
        console.log('Profile loaded successfully');
    } catch (error) {
        console.error('Error loading profile:', error);
        showProfileMessage('Não foi possível carregar o perfil. Por favor, tente novamente.', 'error');
        
        // Se for erro de autenticação, redirecionar após um delay
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthenticated'))) {
            setTimeout(() => {
                window.location.href = '/app/index.html';
            }, 2000);
        }
    }
}

function updateAvatar(avatarUrl) {
    const avatarImg = document.getElementById('profile-avatar');
    if (!avatarImg) return;
    
    if (avatarUrl && avatarUrl.trim() !== '') {
        avatarImg.src = avatarUrl;
        avatarImg.style.display = 'block';
        avatarImg.onerror = function() {
            // Se a imagem falhar ao carregar, usar inicial
            showDefaultAvatar();
        };
    } else {
        showDefaultAvatar();
    }
}

function showDefaultAvatar() {
    const avatarImg = document.getElementById('profile-avatar');
    if (!avatarImg) return;
    
    const userName = currentUser ? currentUser.name : 'U';
    const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#ea1d2c';
    
    avatarImg.src = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="140" height="140" xmlns="http://www.w3.org/2000/svg">
            <rect width="140" height="140" fill="${primaryColor}" rx="70"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-weight="bold" font-family="Arial, sans-serif">${initials}</text>
        </svg>
    `)}`;
    avatarImg.style.display = 'block';
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showProfileMessage('Por favor, selecione uma imagem válida.', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showProfileMessage('A imagem deve ter no máximo 5MB.', 'error');
        return;
    }

    // Create preview and convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatarImg = document.getElementById('profile-avatar');
        const avatarUrlInput = document.getElementById('profile-avatar-url-input');
        if (avatarImg) {
            avatarImg.src = e.target.result;
            avatarImg.onerror = null; // Reset error handler
        }
        // Store data URL - será salvo quando o usuário salvar o perfil
        if (avatarUrlInput) {
            avatarUrlInput.value = e.target.result;
        }
        showProfileMessage('Imagem carregada! Clique em "Salvar Alterações" para confirmar.', 'success');
    };
    reader.onerror = () => {
        showProfileMessage('Erro ao carregar a imagem. Tente novamente.', 'error');
    };
    reader.readAsDataURL(file);
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    const nameInput = document.getElementById('profile-name-input');
    const phoneInput = document.getElementById('profile-phone-input');
    const avatarUrlInput = document.getElementById('profile-avatar-url-input');
    const whatsappInput = currentUser && currentUser.role === 'admin' 
        ? document.getElementById('profile-whatsapp-input')
        : null;

    if (!nameInput) {
        showProfileMessage('Erro ao carregar formulário. Por favor, recarregue a página.', 'error');
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const avatarUrl = avatarUrlInput ? avatarUrlInput.value.trim() : '';
    const whatsapp = whatsappInput ? whatsappInput.value.trim() : null;

    if (!name) {
        showProfileMessage('O nome é obrigatório.', 'error');
        return;
    }

    try {
        const requestData = {
            name,
            phone: phone || null,
            avatar_url: avatarUrl || null,
        };

        if (currentUser && currentUser.role === 'admin') {
            requestData.whatsapp = whatsapp || null;
        }

        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (response.ok) {
            // Update local storage
            currentUser = data.data;
            localStorage.setItem('current_user', JSON.stringify(currentUser));

            // Update UI
            const profileNameEl = document.getElementById('profile-name');
            if (profileNameEl) profileNameEl.textContent = currentUser.name;
            updateAvatar(currentUser.avatar_url);

            showProfileMessage(data.message || 'Perfil atualizado com sucesso.', 'success');

            // Reload profile data after a short delay
            setTimeout(() => {
                loadProfile();
            }, 1500);
        } else {
            const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Não foi possível atualizar o perfil.');
            showProfileMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showProfileMessage('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', 'error');
    }
}

