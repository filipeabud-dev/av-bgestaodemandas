// =====================================================
// AVB Gestão de Demandas — Core Logic
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    loadData();
    renderApp();
});

// State Management
let currentUser = JSON.parse(sessionStorage.getItem('avb_current_user')) || JSON.parse(localStorage.getItem('avb_current_user')) || null;
let currentView = 'demandas';
let isRegistering = false;
let demands = [];
let notebooks = [];
let users = [];
let history = [];
let activeFilters = { area: [], responsavel: [], status: [] };
let currentSort = { field: 'id', direction: 'desc' };
let searchDemandsQuery = '';
let selectedDemandId = null;
let dashboardDateFilter = { mode: 'days', start: '', end: '', month: '', year: '' };

const GRAN_LOGO_PATH = 'logo nova.png';

// Migração de Senha Admin (Força atualização do localStorage se estiver com a senha antiga)
if (localStorage.getItem('avb_users')) {
    try {
        let storedUsers = JSON.parse(localStorage.getItem('avb_users'));
        let admin = storedUsers.find(u => u.username === 'admin');
        if (admin && admin.password === 'avb@2026') {
            admin.password = 'av&b123';
            localStorage.setItem('avb_users', JSON.stringify(storedUsers));
            console.log('Senha do admin migrada com sucesso.');
        }
    } catch(e) { console.error('Erro na migração:', e); }
}

function loadData() {
    demands = JSON.parse(localStorage.getItem('avb_demandas')) || [];
    notebooks = JSON.parse(localStorage.getItem('avb_notebooks')) || [];
    users = JSON.parse(localStorage.getItem('avb_users')) || [];
    history = JSON.parse(localStorage.getItem('avb_history')) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function addHistory(action, entity, entityId, details) {
    const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.name : 'Sistema',
        action: action, 
        entity: entity,
        entityId: entityId,
        details: details
    };
    history.unshift(entry);
    saveData('avb_history', history);
}

// ── RENDER ENGINE ──────────────────────────────────

function renderApp() {
    const app = document.getElementById('app');
    
    // Check for reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');
    if (resetToken) {
        app.innerHTML = renderResetPassword(resetToken);
        setupResetListeners();
        return;
    }

    if (!currentUser) {
        if (isRegistering) {
            app.innerHTML = renderRegister();
            setupRegisterListeners();
        } else if (isForgotting) {
            app.innerHTML = renderForgotPassword();
            setupForgotListeners();
        } else {
            app.innerHTML = renderLogin();
            setupLoginListeners();
        }
        return;
    }
        app.innerHTML = `
            <div class="app-layout">
                ${renderSidebar()}
                <main class="main">
                    ${renderHeader()}
                    <div id="content" class="content">
                        ${renderView()}
                    </div>
                </main>
            </div>
        `;
        setupSidebarListeners();
        setupHeaderListeners();
        setupViewListeners();
}

// ── VIEWS ──────────────────────────────────────────

function renderView() {
    switch (currentView) {
        case 'dashboard': return renderDashboard();
        case 'demandas': return renderDemandas();
        case 'notebooks': return renderNotebooks();
        case 'usuarios': return renderUserManagement();
        case 'historico': return renderHistory();
        default: return renderDashboard();
    }
}

function switchView(view) {
    currentView = view;
    if (view === 'demandas') {
        activeFilters = { area: [], responsavel: [], status: [] };
        searchDemandsQuery = '';
        selectedDemandId = null;
    }
    if (view === 'dashboard') {
        dashboardDateFilter = { mode: 'days', start: '', end: '', month: '', year: '' };
    }
    renderApp();
}

function clearAllFilters() {
    activeFilters = { area: [], responsavel: [], status: [] };
    searchDemandsQuery = '';
    renderApp();
}

function renderAppKeepScroll() {
    const content = document.getElementById('content');
    const scrollTop = content ? content.scrollTop : 0;
    renderApp();
    if (scrollTop > 0) {
        const newContent = document.getElementById('content');
        if (newContent) newContent.scrollTop = scrollTop;
    }
}

function selectDemand(id) {
    selectedDemandId = id;
    document.querySelectorAll('#demands-body tr[data-demand-id]').forEach(tr => {
        const trId = parseInt(tr.dataset.demandId);
        tr.classList.toggle('tr-selected', trId === id);
    });
}

// ── LOGIN & REGISTER VIEWS ──────────────────────────

function renderLogin() {
    return `
        <div class="login-page">
            <div class="login-bg-decor">
                <div class="decor-item" style="top: 10%; left: 10%; width: 120px; animation-delay: 0s;">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" /></svg>
                </div>
                <div class="decor-item" style="top: 70%; left: 5%; width: 100px; animation-delay: -5s;">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>
                </div>
                <div class="decor-item" style="top: 20%; right: 10%; width: 140px; animation-delay: -10s;">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22,10V6H19.66L17.66,4H14L12,6H9.66L7.66,4H4L2,6V10H22M18,15H16V17H18V15M13,15H11V17H13V15M8,15H6V17H8V15M22,12H2V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V12Z" /></svg>
                </div>
                <div class="decor-item" style="bottom: 15%; right: 15%; width: 110px; animation-delay: -15s;">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 17,1 12,1Z" /></svg>
                </div>
            </div>
            <div class="login-card">
                <div class="login-logo-container" style="background: var(--bg-1); margin: -48px -40px 32px; padding: 40px 20px; border-radius: var(--radius-lg) var(--radius-lg) 0 0; border-bottom: 1px solid var(--border);">
                    <img src="${GRAN_LOGO_PATH}?t=${Date.now()}" alt="Gran Logo" style="width: 280px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
                <h1>Bem-vindo</h1>
                <p>Acesse o painel de controle operacional.</p>
                <div id="login-error" class="login-error">Credenciais inválidas.</div>
                
                <form id="login-form">
                    <div class="form-group">
                        <label>Usuário</label>
                        <input type="text" id="username" class="form-control" placeholder="ex: admin" value="${localStorage.getItem('avb_saved_username') || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Senha</label>
                        <div class="password-wrapper">
                            <input type="password" id="password" class="form-control" placeholder="••••••••" value="${localStorage.getItem('avb_saved_password') || ''}" required>
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('password', this)" title="Mostrar/Ocultar Senha">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; margin: 0;">
                            <input type="checkbox" id="remember-me" style="cursor: pointer; width: 16px; height: 16px;" ${localStorage.getItem('avb_remember') === 'true' ? 'checked' : ''}>
                            <span style="font-size: 0.85rem; color: var(--text-2);">Lembrar-me</span>
                        </label>
                        <a href="#" onclick="toggleForgotPassword(true)" style="font-size: 0.8rem; color: var(--text-3); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-3)'">Esqueci minha senha</a>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Entrar</button>
                </form>
                <div class="mt-24 text-sm">
                    Não tem uma conta? <a href="#" onclick="toggleRegister(true)" style="color:var(--accent); font-weight:600;">Solicitar Cadastro</a>
                </div>
            </div>
            <button class="btn btn-ghost btn-icon" onclick="toggleTheme()" style="position: fixed; top: 20px; right: 20px; z-index: 1000;" title="Mudar Tema">
                ${currentTheme === 'dark' ? 
                    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` : 
                    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
                }
            </button>
        </div>
    `;
}

function renderRegister() {
    return `
        <div class="login-page">
            <div class="login-bg-decor">
                <div class="decor-item" style="top: 10%; left: 10%; width: 120px;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" /></svg></div>
                <div class="decor-item" style="bottom: 10%; right: 10%; width: 140px;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22,10V6H19.66L17.66,4H14L12,6H9.66L7.66,4H4L2,6V10H22M18,15H16V17H18V15M13,15H11V17H13V15M8,15H6V17H8V15M22,12H2V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V12Z" /></svg></div>
            </div>
            <div class="login-card">
                <div class="login-logo-container" style="background: var(--bg-1); margin: -48px -40px 32px; padding: 40px 20px; border-radius: var(--radius-lg) var(--radius-lg) 0 0; border-bottom: 1px solid var(--border);">
                    <img src="${GRAN_LOGO_PATH}?t=${Date.now()}" alt="Gran Logo" style="width: 280px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
                <h1>Solicitar Cadastro</h1>
                <p>Seu acesso precisará ser aprovado pelo administrador.</p>
                <form id="register-form">
                    <div class="form-group">
                        <label>Nome Completo</label>
                        <input type="text" id="reg-name" class="form-control" placeholder="Seu nome completo" required>
                    </div>
                    <div class="form-group">
                        <label>Usuário Desejado</label>
                        <input type="text" id="reg-user" class="form-control" placeholder="ex: jsilva" required>
                    </div>
                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" id="reg-email" class="form-control" placeholder="ex: jose@email.com" required>
                    </div>
                    <div class="form-group">
                        <label>Senha</label>
                        <div class="password-wrapper">
                            <input type="password" id="reg-pass" class="form-control" placeholder="Crie uma senha" required>
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('reg-pass', this)" title="Mostrar/Ocultar Senha">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Foto de Perfil (Opcional)</label>
                        <input type="file" id="reg-photo" class="form-control" accept="image/*" onchange="previewAvatar(this, 'reg-preview')">
                        <div id="reg-preview" style="margin-top: 10px; display: none; text-align:center">
                            <img src="" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent); display:inline-block">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full mt-16">Enviar Solicitação</button>
                    <button type="button" class="btn btn-ghost btn-full mt-8" onclick="toggleRegister(false)">Voltar ao Login</button>
                </form>
            </div>
        </div>
    `;
}

function toggleRegister(val) {
    isRegistering = val;
    isForgotting = false;
    renderApp();
}

let isForgotting = false;
function toggleForgotPassword(val) {
    isForgotting = val;
    isRegistering = false;
    renderApp();
}

function renderForgotPassword() {
    return `
        <div class="login-page">
            <div class="login-bg-decor">
                <div class="decor-item" style="top: 10%; left: 10%; width: 120px;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" /></svg></div>
            </div>
            <div class="login-card">
                <div class="login-logo-container" style="background: var(--bg-1); margin: -48px -40px 32px; padding: 40px 20px; border-radius: var(--radius-lg) var(--radius-lg) 0 0; border-bottom: 1px solid var(--border);">
                    <img src="${GRAN_LOGO_PATH}?t=${Date.now()}" alt="Gran Logo" style="width: 280px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
                <h1>Recuperar Senha</h1>
                <p>Informe seu e-mail cadastrado para solicitar a redefinição de senha ao administrador.</p>
                <form id="forgot-form">
                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" id="forgot-email" class="form-control" placeholder="ex: jose@email.com" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full mt-16">Solicitar Redefinição</button>
                    <button type="button" class="btn btn-ghost btn-full mt-8" onclick="toggleForgotPassword(false)">Voltar ao Login</button>
                </form>
            </div>
        </div>
    `;
}

function renderResetPassword(token) {
    let userId;
    try {
        userId = parseInt(atob(token));
    } catch(e) {
        return `<div class="login-page"><h1>Link Inválido</h1><button onclick="window.location.search=''">Voltar</button></div>`;
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return `<div class="login-page"><h1>Usuário não encontrado</h1><button onclick="window.location.search=''">Voltar</button></div>`;

    return `
        <div class="login-page">
            <div class="login-card">
                <h1>Nova Senha</h1>
                <p>Olá ${user.name}, crie sua nova senha de acesso.</p>
                <form id="reset-form">
                    <input type="hidden" id="reset-user-id" value="${user.id}">
                    <div class="form-group">
                        <label>Nova Senha</label>
                        <div class="password-wrapper">
                            <input type="password" id="reset-pass" class="form-control" placeholder="Mínimo 6 caracteres" required>
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('reset-pass', this)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Confirmar Nova Senha</label>
                        <div class="password-wrapper">
                            <input type="password" id="reset-confirm" class="form-control" placeholder="Repita a senha" required>
                            <button type="button" class="password-toggle" onclick="togglePasswordVisibility('reset-confirm', this)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full mt-16">Redefinir Senha</button>
                </form>
            </div>
        </div>
    `;
}

function setupLoginListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userVal = document.getElementById('username').value.trim();
            const passVal = document.getElementById('password').value.trim();
            const errorEl = document.getElementById('login-error');

                const foundUser = users.find(u => u.username === userVal && u.password === passVal);
            if (foundUser) {
                if (foundUser.approved === false) {
                    showToast('Seu cadastro ainda aguarda aprovação do Admin.', 'warning');
                } else {
                    const remember = document.getElementById('remember-me').checked;
                    loginAs(foundUser, remember);
                }
            } else {
                errorEl.classList.add('show');
                setTimeout(() => errorEl.classList.remove('show'), 3000);
            }
        });
    }
}

function setupRegisterListeners() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const username = document.getElementById('reg-user').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-pass').value.trim();
            const photoInput = document.getElementById('reg-photo');

            if (users.find(u => u.username === username)) {
                showToast('Este usuário já existe.', 'error');
                return;
            }

            const saveReg = (avatar = '') => {
                const newUser = {
                    id: Date.now(),
                    name,
                    username,
                    email,
                    password,
                    role: 'viewer',
                    approved: false,
                    avatar,
                    requestDate: new Date().toISOString()
                };
                users.push(newUser);
                saveData('avb_users', users);
                addHistory('Solicitou', 'Cadastro', newUser.id, name);
                showToast('Solicitação enviada! Aguarde a aprovação.', 'success');
                toggleRegister(false);
            };

            if (photoInput && photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => saveReg(ev.target.result);
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                saveReg();
            }
        });
    }

}

function loginAs(user, remember = false) {
    currentUser = user;
    sessionStorage.setItem('avb_current_user', JSON.stringify(user));
    
    if (remember) {
        localStorage.setItem('avb_current_user', JSON.stringify(user));
        localStorage.setItem('avb_saved_username', document.getElementById('username').value);
        localStorage.setItem('avb_saved_password', document.getElementById('password').value);
        localStorage.setItem('avb_remember', 'true');
    } else {
        localStorage.removeItem('avb_saved_username');
        localStorage.removeItem('avb_saved_password');
        localStorage.setItem('avb_remember', 'false');
    }

    renderApp();
    showToast(`Bem-vindo, ${user.name}!`, 'success');
}

function setupForgotListeners() {
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const user = users.find(u => u.email === email);

            if (user) {
                user.resetRequested = true;
                user.resetDate = new Date().toISOString();
                saveData('avb_users', users);
                addHistory('Solicitou', 'Reset de Senha', user.id, user.name);
                
                showToast('Solicitação de redefinição enviada ao administrador!', 'success');
                setTimeout(() => toggleForgotPassword(false), 2000);
            }
        });
    }
}

function setupResetListeners() {
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = parseInt(document.getElementById('reset-user-id').value);
            const newPass = document.getElementById('reset-pass').value.trim();
            const confirmPass = document.getElementById('reset-confirm').value.trim();

            if (newPass.length < 6) {
                showToast('A senha deve ter no mínimo 6 caracteres.', 'warning');
                return;
            }

            if (newPass !== confirmPass) {
                showToast('As senhas não coincidem.', 'error');
                return;
            }

            const userIdx = users.findIndex(u => u.id === userId);
            if (userIdx !== -1) {
                users[userIdx].password = newPass;
                saveData('avb_users', users);
                addHistory('Redefiniu', 'Senha', userId, users[userIdx].name);
                showToast('Senha redefinida com sucesso!', 'success');
                setTimeout(() => {
                    window.location.search = ''; // Volta para o login
                }, 2000);
            }
        });
    }
}

// ── COMPONENTS ─────────────────────────────────────

function renderSidebar() {
    const isAdmin = currentUser.role === 'admin';
    return `
        <aside class="sidebar">
            <div class="sidebar-header" onclick="switchView('demandas')" style="padding: 24px 16px; text-align: center; background: var(--bg-1); border-bottom: 1px solid var(--border); cursor: pointer;" title="Ir para Demandas (Time)">
                <img src="${GRAN_LOGO_PATH}?t=${Date.now()}" alt="Logo" style="width: 100%; height: auto; max-width: 200px; display: block; margin: 0 auto;">
            </div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-label">Menu Principal</div>
            <nav>
                <div class="nav-item ${currentView === 'demandas' ? 'active' : ''}" data-view="demandas">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Demandas (Time)
                </div>
                <div class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Dashboard
                </div>
                ${isAdmin ? `
                    <div class="nav-item ${currentView === 'usuarios' ? 'active' : ''}" data-view="usuarios">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Gestão de Usuários
                    </div>
                ` : ''}
            </nav>
            <div class="sidebar-spacer"></div>
            <div class="sidebar-user" style="flex-direction: column; align-items: stretch; gap: 12px; padding: 20px 16px;">
                ${(() => {
                    let roleLabel = 'Visualizador';
                    if (currentUser.role === 'admin') roleLabel = 'Administrador';
                    if (currentUser.role === 'gestor') roleLabel = 'Gestor';
                    return `
                    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="openProfileModal()" title="Configurações de Perfil">
                        ${currentUser.avatar ? `<img src="${currentUser.avatar}" class="avatar-img">` : `<div class="user-avatar">${currentUser.name.charAt(0)}</div>`}
                        <div class="user-info">
                            <div class="user-name">${currentUser.name}</div>
                            <div class="user-role">Perfil - ${roleLabel}</div>
                        </div>
                    </div>
                    `;
                })()}
                <button class="btn btn-danger btn-sm btn-full" onclick="logout()" style="justify-content: center; font-size: 0.8rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; margin-right:6px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Sair da Conta
                </button>
            </div>
        </aside>
    `;
}

function renderHeader() {
    let title = "Dashboard";
    let subtitle = "Visão geral das operações";
    if (currentView === 'demandas') { title = "Demandas (Time)"; subtitle = "Gestão de atividades e prazos"; }
    if (currentView === 'notebooks') { title = "Troca Notebooks"; subtitle = "Controle de hardware home office"; }
    if (currentView === 'usuarios') { title = "Gestão de Usuários"; subtitle = "Aprovação e cadastro de acessos"; }
    if (currentView === 'historico') { title = "Histórico"; subtitle = "Audit log do sistema"; }

    let headerFilters = '';
    if (currentView === 'dashboard') {
        headerFilters = `
            <div class="dashboard-date-filter">
                <div class="filter-mode-toggle">
                    <button class="mode-btn ${dashboardDateFilter.mode === 'month' ? 'active' : ''}" onclick="setDashboardFilterMode('month')">Mês</button>
                    <button class="mode-btn ${dashboardDateFilter.mode === 'days' ? 'active' : ''}" onclick="setDashboardFilterMode('days')">Dias</button>
                </div>
                
                ${dashboardDateFilter.mode === 'month' ? `
                    <select id="dash-filter-month" onchange="handleDashMonthChange(this.value)">
                        ${getMonthOptionsHTML()}
                    </select>
                    <select id="dash-filter-year" onchange="handleDashYearChange(this.value)">
                        ${getYearOptionsHTML()}
                    </select>
                ` : `
                    <div class="date-range-inputs">
                        <input type="date" id="dash-filter-start" value="${dashboardDateFilter.start || ''}" onchange="handleDashDaysChange()">
                        <span class="range-separator">até</span>
                        <input type="date" id="dash-filter-end" value="${dashboardDateFilter.end || ''}" onchange="handleDashDaysChange()">
                    </div>
                `}
            </div>
        `;
    }

    return `
        <header class="header">
            <h1 class="header-title">${title} <span>/ ${subtitle}</span></h1>
            ${headerFilters}
            <div class="header-actions">
                <button class="btn btn-ghost btn-icon" onclick="toggleTheme()" title="Mudar Tema">
                    ${currentTheme === 'dark' ? 
                        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` : 
                        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
                    }
                </button>
                <div class="sidebar-divider" style="height: 20px; width: 1px; margin: 0 10px;"></div>
                <button class="btn btn-secondary btn-sm" onclick="showToast('Sistema v1.3.0', 'info')">
                    v1.3.0
                </button>
            </div>
        </header>
    `;
}

function setDashboardFilterMode(mode) {
    dashboardDateFilter.mode = mode;
    if (mode === 'month') {
        dashboardDateFilter.start = '';
        dashboardDateFilter.end = '';
        dashboardDateFilter.month = String(new Date().getMonth() + 1).padStart(2, '0');
        dashboardDateFilter.year = String(new Date().getFullYear());
    } else {
        dashboardDateFilter.month = '';
        dashboardDateFilter.year = '';
    }
    renderApp();
}

function handleDashMonthChange(value) {
    dashboardDateFilter.month = value;
    renderApp();
}

function handleDashYearChange(value) {
    dashboardDateFilter.year = value;
    renderApp();
}

function handleDashDaysChange() {
    dashboardDateFilter.start = document.getElementById('dash-filter-start').value;
    dashboardDateFilter.end = document.getElementById('dash-filter-end').value;
    renderApp();
}
function formatDateToBR(dStr) {
    if (!dStr) return '-';
    if (dStr.includes('/')) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
}
function parseDateString(dStr) {
    if (!dStr) return new Date(0);
    const parts = dStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10) + 2000;
        return new Date(year, month, day);
    }
    return new Date(dStr);
}

function getMonthOptionsHTML() {
    const monthsMap = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    return Object.entries(monthsMap).map(([num, name]) => `
        <option value="${num}" ${dashboardDateFilter.month === num ? 'selected' : ''}>${name}</option>
    `).join('');
}

function getYearOptionsHTML() {
    const yearsSet = new Set();
    demands.forEach(d => {
        if (!d.dataPrevista) return;
        const parts = d.dataPrevista.split('/');
        if (parts.length === 3) {
            let yy = parts[2];
            if (yy.length === 2) yy = '20' + yy;
            yearsSet.add(yy);
        }
    });
    const currentYear = String(new Date().getFullYear());
    yearsSet.add(currentYear);
    const years = [...yearsSet].sort();
    return years.map(y => `
        <option value="${y}" ${dashboardDateFilter.year === y ? 'selected' : ''}>${y}</option>
    `).join('');
}

function getDashboardFilteredDemands() {
    // Sempre excluir demandas com status "Excluído" do dashboard
    let base = demands.filter(d => d.status !== 'Excluído');
    
    if (dashboardDateFilter.mode === 'month' && dashboardDateFilter.month && dashboardDateFilter.year) {
        return base.filter(d => {
            if (!d.dataPrevista) return true; // Sempre incluir se sem data!
            
            const parts = d.dataPrevista.split('/');
            if (parts.length === 3) {
                const mm = parts[1];
                let yy = parts[2];
                if (yy.length === 2) yy = '20' + yy;
                return mm === dashboardDateFilter.month && yy === dashboardDateFilter.year;
            }
            
            const ymdParts = d.dataPrevista.split('-');
            if (ymdParts.length === 3) {
                const yy = ymdParts[0];
                const mm = ymdParts[1];
                return mm === dashboardDateFilter.month && yy === dashboardDateFilter.year;
            }
            
            return false;
        });
    }
    
    if (dashboardDateFilter.mode === 'days' && (dashboardDateFilter.start || dashboardDateFilter.end)) {
        return base.filter(d => {
            if (!d.dataPrevista) return true; // Sempre incluir se sem data!
            
            const dateObj = parseDateString(d.dataPrevista);
            if (!dateObj || isNaN(dateObj.getTime())) return true;
            
            if (dashboardDateFilter.start) {
                const startDate = new Date(dashboardDateFilter.start + 'T00:00:00');
                if (dateObj < startDate) return false;
            }
            if (dashboardDateFilter.end) {
                const endDate = new Date(dashboardDateFilter.end + 'T23:59:59');
                if (dateObj > endDate) return false;
            }
            return true;
        });
    }
    
    return base;
}

function toggleSort(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Sincronizar o dropdown sort-demands se ele estiver presente na tela
    const sortSelect = document.getElementById('sort-demands');
    if (sortSelect) {
        if (field === 'id' && currentSort.direction === 'desc') {
            sortSelect.value = 'id-desc';
        } else if (field === 'area' && currentSort.direction === 'asc') {
            sortSelect.value = 'area-asc';
        } else if (field === 'assunto' && currentSort.direction === 'asc') {
            sortSelect.value = 'assunto-asc';
        } else if (field === 'responsavel' && currentSort.direction === 'asc') {
            sortSelect.value = 'resp-asc';
        } else if (field === 'dataPrevista' && currentSort.direction === 'asc') {
            sortSelect.value = 'data-asc';
        } else {
            sortSelect.value = '';
        }
    }
    
    renderApp();
}

function getSortIcon(field) {
    if (currentSort.field !== field) {
        return `<span class="sort-icon" style="opacity: 0.3; margin-left: 4px;">↕</span>`;
    }
    return currentSort.direction === 'asc'
        ? `<span class="sort-icon sorted" style="color: var(--accent); opacity: 1; margin-left: 4px;">↑</span>`
        : `<span class="sort-icon sorted" style="color: var(--accent); opacity: 1; margin-left: 4px;">↓</span>`;
}



function logout() {
    currentUser = null;
    sessionStorage.removeItem('avb_current_user');
    localStorage.removeItem('avb_current_user');
    renderApp();
    showToast('Sessão encerrada.', 'info');
}

// ── USER MANAGEMENT VIEW (ADMIN ONLY) ─────────────

function renderUserManagement() {
    const pending = users.filter(u => u.approved === false);
    const approved = users.filter(u => u.approved === true);

    return `
        <div class="fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Gestão de Usuários</h1>
                    <p class="page-subtitle">Aprovação de cadastros e criação de novos acessos.</p>
                </div>
                <button class="btn btn-primary" onclick="openUserModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                    Novo Usuário
                </button>
            </div>

            ${(() => {
                const resetRequests = users.filter(u => u.resetRequested === true);
                if (resetRequests.length === 0) return '';
                return `
                <div class="card mb-24" style="border-color: var(--danger);">
                    <div class="card-header">
                        <h2 class="card-title" style="color: var(--danger);">Solicitações de Redefinição de Senha</h2>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Usuário</th>
                                    <th>Data Solicitação</th>
                                    <th style="width:150px">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resetRequests.map(u => `
                                    <tr>
                                        <td class="font-600">${u.name}</td>
                                        <td>${u.username}</td>
                                        <td>${new Date(u.resetDate).toLocaleDateString()}</td>
                                        <td>
                                            <div class="td-actions">
                                                <button class="btn btn-warning btn-sm" onclick="resetUserPassword(${u.id})">Resetar p/ Padrão</button>
                                                <button class="btn btn-ghost btn-sm" onclick="cancelResetRequest(${u.id})">Ignorar</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                `;
            })()}

            ${pending.length > 0 ? `
                <div class="card mb-24" style="border-color: var(--warning);">
                    <div class="card-header">
                        <h2 class="card-title">Solicitações Pendentes</h2>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Usuário</th>
                                    <th>Data Solicitação</th>
                                    <th style="width:150px">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pending.map(u => `
                                    <tr>
                                        <td class="font-600">${u.name}</td>
                                        <td>${u.username}</td>
                                        <td>${new Date(u.requestDate).toLocaleDateString()}</td>
                                        <td>
                                            <div class="td-actions">
                                                <button class="btn btn-success btn-sm" onclick="approveUser(${u.id})">Aprovar</button>
                                                <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Recusar</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Usuários Ativos</h2>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>Perfil de Acesso</th>
                                <th style="width:80px">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${approved.map(u => {
                                let roleLabel = 'Visualizador';
                                if (u.role === 'admin') roleLabel = 'Administrador';
                                if (u.role === 'gestor') roleLabel = 'Gestor';
                                
                                return `
                                 <tr>
                                    <td class="font-600">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            ${u.avatar ? `<img src="${u.avatar}" class="avatar-img" style="width:32px; height:32px" onclick="triggerAvatarUpload(${u.id})" title="Alterar Foto">` : `<div class="user-avatar" style="width:32px; height:32px; font-size:0.7rem" onclick="triggerAvatarUpload(${u.id})" title="Alterar Foto">${u.name.charAt(0)}</div>`}
                                            ${u.name}
                                        </div>
                                    </td>
                                    <td>${u.username}</td>
                                    <td><span class="badge ${u.role === 'admin' ? 'badge-accent' : 'badge-info'}">${roleLabel}</span></td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-icon btn-ghost btn-sm" onclick="openEditUserModal(${u.id})" title="Editar Usuário">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; color:var(--accent)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                                            </button>
                                            <button class="btn btn-icon btn-ghost btn-sm" onclick="resetUserPassword(${u.id})" title="Resetar Senha">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; color:var(--warning)"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            </button>
                                            <button class="btn btn-icon btn-ghost btn-sm" onclick="deleteUser(${u.id})" ${u.username === 'admin' ? 'disabled' : ''}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; color:var(--danger)"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function approveUser(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        user.approved = true;
        saveData('avb_users', users);
        addHistory('Aprovou', 'Usuário', id, user.name);
        showToast(`Usuário ${user.username} aprovado!`, 'success');
        switchView('usuarios');
    }
}

function deleteUser(id) {
    if (confirm('Deseja remover este usuário/solicitação?')) {
        const user = users.find(u => u.id === id);
        users = users.filter(u => u.id !== id);
        saveData('avb_users', users);
        addHistory('Removeu', 'Usuário', id, user.name);
        showToast('Usuário removido.', 'error');
        switchView('usuarios');
    }
}

function resetUserPassword(id) {
    if (confirm('Deseja resetar a senha deste usuário para o padrão "av&b123"?')) {
        const user = users.find(u => u.id === id);
        if (user) {
            user.password = 'av&b123';
            user.resetRequested = false;
            saveData('avb_users', users);
            addHistory('Resetou Senha', 'Usuário', id, user.name);
            showToast(`Senha de ${user.username} resetada para av&b123`, 'success');
            if (currentView === 'usuarios') switchView('usuarios');
        }
    }
}

function cancelResetRequest(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        user.resetRequested = false;
        saveData('avb_users', users);
        showToast('Solicitação ignorada.', 'info');
        switchView('usuarios');
    }
}

function openEditUserModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Editar Acesso do Usuário</h2>
                    <button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
                        <div style="position: relative; display: inline-block;">
                            ${user.avatar ? `<img src="${user.avatar}" id="edit-avatar-preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent);">` : `<div id="edit-avatar-placeholder" class="user-avatar" style="width: 80px; height: 80px; font-size: 1.5rem;">${user.name.charAt(0)}</div>`}
                            <button class="btn btn-icon btn-primary" onclick="triggerAvatarUpload(${user.id}, true)" style="position: absolute; bottom: 0; right: 0; border-radius: 50%; width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="Mudar Foto">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; display: block;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            </button>
                        </div>
                        <h3 style="margin-top: 12px; color: var(--text-1); font-size: 1.1rem;">${user.name}</h3>
                    </div>

                    <form id="edit-user-form">
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="edit-adm-name" class="form-control" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label>E-mail</label>
                            <input type="email" id="edit-adm-email" class="form-control" value="${user.email || ''}" required placeholder="ex: email@exemplo.com">
                        </div>
                        <div class="form-group">
                            <label>Usuário</label>
                            <input type="text" id="edit-adm-user" class="form-control" value="${user.username}" required ${user.username === 'admin' ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Redefinir Senha</label>
                            <div class="password-wrapper">
                                <input type="password" id="edit-adm-pass" class="form-control" placeholder="Digite para alterar a senha">
                                <button type="button" class="password-toggle" onclick="togglePasswordVisibility('edit-adm-pass', this)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                            </div>
                            <button type="button" class="btn btn-ghost btn-sm" onclick="resetUserPassword(${user.id}); closeModal(); openEditUserModal(${user.id});" style="font-size: 0.7rem; color: var(--warning); padding: 4px 0; margin-top: 4px;">
                                Resetar para senha padrão (av&b123)
                            </button>
                        </div>
                        <div class="form-group">
                            <label>Perfil de Acesso</label>
                            <select id="edit-adm-role" class="form-control" ${user.username === 'admin' ? 'disabled' : ''}>
                                <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Visualizador (Somente Leitura)</option>
                                <option value="gestor" ${user.role === 'gestor' ? 'selected' : ''}>Gestor (Edita Demandas)</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador (Acesso Total)</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="updateAdminUser(${user.id})">Salvar Alterações</button>
                </div>
            </div>
        </div>
    `;
}

function updateAdminUser(id) {
    const name = document.getElementById('edit-adm-name').value;
    const email = document.getElementById('edit-adm-email').value;
    const username = document.getElementById('edit-adm-user').value;
    const role = document.getElementById('edit-adm-role').value;
    const newPass = document.getElementById('edit-adm-pass').value;

    const userIdx = users.findIndex(u => u.id === id);
    if (userIdx !== -1) {
        if (users.find(u => u.username === username && u.id !== id)) {
            showToast('Este nome de usuário já está em uso.', 'error');
            return;
        }

        users[userIdx].name = name;
        users[userIdx].email = email;
        users[userIdx].username = username;
        users[userIdx].role = role;
        
        if (newPass) {
            users[userIdx].password = newPass;
        }
        
        saveData('avb_users', users);
        addHistory('Editou', 'Usuário', id, name);
        showToast('Dados do usuário atualizados!', 'success');
        closeModal();
        switchView('usuarios');
    }
}

function openUserModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Registrar Novo Usuário</h2>
                    <button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <form id="admin-user-form">
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="adm-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Usuário</label>
                            <input type="text" id="adm-user" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>E-mail</label>
                            <input type="email" id="adm-email" class="form-control" placeholder="ex: email@exemplo.com" required>
                        </div>
                        <div class="form-group">
                            <label>Senha</label>
                            <div class="password-wrapper">
                                <input type="password" id="adm-pass" class="form-control" value="av&b123" required>
                                <button type="button" class="password-toggle" onclick="togglePasswordVisibility('adm-pass', this)" title="Mostrar/Ocultar Senha">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Perfil de Acesso</label>
                            <select id="adm-role" class="form-control">
                                <option value="viewer">Visualizador (Somente Leitura)</option>
                                <option value="gestor">Gestor (Edita Demandas)</option>
                                <option value="admin">Administrador (Acesso Total)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Foto do Usuário (Avatar)</label>
                            <input type="file" id="adm-photo" class="form-control" accept="image/*" onchange="previewAvatar(this)">
                            <div id="avatar-preview" style="margin-top: 10px; display: none;">
                                <img id="preview-img" src="" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent);">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="saveAdminUser()">Registrar e Aprovar</button>
                </div>
            </div>
        </div>
    `;
}

function saveAdminUser() {
    const name = document.getElementById('adm-name').value;
    const username = document.getElementById('adm-user').value;
    const email = document.getElementById('adm-email').value;
    const password = document.getElementById('adm-pass').value;
    const role = document.getElementById('adm-role').value;

    if (users.find(u => u.username === username)) {
        showToast('Este usuário já existe.', 'error');
        return;
    }

    const photoInput = document.getElementById('adm-photo');

    const save = (avatar = '') => {
        const newUser = { id: Date.now(), name, username, email, password, role, approved: true, avatar };
        users.push(newUser);
        saveData('avb_users', users);
        addHistory('Registrou', 'Usuário', newUser.id, name);
        showToast('Novo usuário registrado!', 'success');
        closeModal();
        switchView('usuarios');
    };

    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => save(e.target.result);
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        save();
    }
}

function openProfileModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Configurações de Perfil</h2>
                    <button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
                        <div style="position: relative; display: inline-block;">
                            ${currentUser.avatar ? `<img src="${currentUser.avatar}" id="p-avatar-preview" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent);">` : `<div id="p-avatar-placeholder" class="user-avatar" style="width: 100px; height: 100px; font-size: 2rem;">${currentUser.name.charAt(0)}</div>`}
                            <button class="btn btn-icon btn-primary" onclick="triggerAvatarUpload(${currentUser.id})" style="position: absolute; bottom: 0; right: 0; border-radius: 50%; width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="Mudar Foto">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; display: block;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            </button>
                        </div>
                        <h3 style="margin-top: 12px; color: var(--text-1);">${currentUser.name}</h3>
                        <p style="color: var(--text-3); font-size: 0.85rem;">${(() => {
                            if (currentUser.role === 'admin') return 'Administrador';
                            if (currentUser.role === 'gestor') return 'Gestor';
                            return 'Visualizador';
                        })()}</p>
                    </div>

                    <form id="profile-form">
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="p-name" class="form-control" value="${currentUser.name}" required>
                        </div>
                        <div class="form-group">
                            <label>E-mail</label>
                            <input type="email" id="p-email" class="form-control" value="${currentUser.email || ''}" placeholder="Seu e-mail">
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
                            <p style="font-size: 0.75rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600;">Segurança</p>
                            
                            <div class="form-group">
                                <label>Senha Atual (necessária para salvar)</label>
                                <div class="password-wrapper">
                                    <input type="password" id="p-current-pass" class="form-control" placeholder="Sua senha atual" required>
                                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('p-current-pass', this)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Nova Senha (opcional)</label>
                                <div class="password-wrapper">
                                    <input type="password" id="p-new-pass" class="form-control" placeholder="Deixe em branco para manter a atual">
                                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('p-new-pass', this)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Confirmar Nova Senha</label>
                                <div class="password-wrapper">
                                    <input type="password" id="p-confirm-pass" class="form-control" placeholder="Confirme a nova senha">
                                    <button type="button" class="password-toggle" onclick="togglePasswordVisibility('p-confirm-pass', this)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="updateUserProfile()">Salvar Alterações</button>
                </div>
            </div>
        </div>
    `;
}

function updateUserProfile() {
    const currentPass = document.getElementById('p-current-pass').value;
    const name = document.getElementById('p-name').value.trim();
    const email = document.getElementById('p-email').value.trim();
    const newPass = document.getElementById('p-new-pass').value;
    const confirmPass = document.getElementById('p-confirm-pass').value;

    if (!currentPass) {
        showToast('Por favor, informe sua senha atual para salvar.', 'warning');
        return;
    }

    if (currentPass !== currentUser.password) {
        showToast('Senha atual incorreta.', 'error');
        return;
    }

    if (newPass && newPass !== confirmPass) {
        showToast('As novas senhas não coincidem.', 'error');
        return;
    }

    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
        users[idx].name = name;
        users[idx].email = email;
        if (newPass) {
            users[idx].password = newPass;
        }
        
        saveData('avb_users', users);
        currentUser = { ...users[idx] };
        
        // Atualizar sessões
        if (localStorage.getItem('avb_remember') === 'true') {
            localStorage.setItem('avb_current_user', JSON.stringify(currentUser));
            if (newPass) localStorage.setItem('avb_saved_password', newPass);
        }
        sessionStorage.setItem('avb_current_user', JSON.stringify(currentUser));
        
        addHistory('Atualizou', 'Perfil Próprio', currentUser.id, name);
        showToast('Perfil atualizado com sucesso!', 'success');
        closeModal();
        renderApp();
    }
}

function previewAvatar(input, previewId = 'avatar-preview') {
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function triggerAvatarUpload(userId, isEditing = false) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const avatar = ev.target.result;
                const idx = users.findIndex(u => u.id === userId);
                if (idx !== -1) {
                    users[idx].avatar = avatar;
                    saveData('avb_users', users);
                    
                    if (currentUser.id === userId) {
                        currentUser.avatar = avatar;
                        sessionStorage.setItem('avb_current_user', JSON.stringify(currentUser));
                    }
                    
                    showToast('Avatar atualizado!', 'success');
                    
                    if (isEditing) {
                        const previewImg = document.getElementById('edit-avatar-preview');
                        const placeholder = document.getElementById('edit-avatar-placeholder');
                        if (previewImg) {
                            previewImg.src = avatar;
                        } else if (placeholder) {
                            // Se não tinha foto, substituir o placeholder pela imagem
                            placeholder.outerHTML = `<img src="${avatar}" id="edit-avatar-preview" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent);">`;
                        }
                    } else {
                        renderApp();
                    }
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    input.click();
}

// ── OTHER VIEWS (DASHBOARD, DEMANDAS, ETC) ──────────

function renderDashboard() {
    const filteredDemands = getDashboardFilteredDemands();
    const totalD = filteredDemands.length;
    const completedD = filteredDemands.filter(d => d.status === 'Concluído').length;
    const progressD = filteredDemands.filter(d => d.status === 'Em andamento').length;
    const pendingD = totalD - completedD - progressD;

    let chartData = '#334155 0deg 360deg';
    if (totalD > 0) {
        const cEnd = (completedD / totalD) * 360;
        const pEnd = cEnd + (progressD / totalD) * 360;
        chartData = `
            #10b981 0deg ${cEnd}deg,
            #f59e0b ${cEnd}deg ${pEnd}deg,
            #6366f1 ${pEnd}deg 360deg
        `;
    }

    return `
        <div class="fade-in">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon accent">📋</div>
                    <div class="stat-info">
                        <div class="stat-value">${totalD}</div>
                        <div class="stat-label">Total Demandas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">✅</div>
                    <div class="stat-info">
                        <div class="stat-value">${completedD}</div>
                        <div class="stat-label">Concluídas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">⏳</div>
                    <div class="stat-info">
                        <div class="stat-value">${progressD}</div>
                        <div class="stat-label">Em Andamento</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">🔵</div>
                    <div class="stat-info">
                        <div class="stat-value">${pendingD}</div>
                        <div class="stat-label">Pendente</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Status das Demandas</h2>
                    </div>
                    <div class="chart-container">
                        <div class="pie-chart" style="--chart-data: ${chartData}"></div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background: #10b981"></div>
                                <span>Concluído (${completedD})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: #f59e0b"></div>
                                <span>Em andamento (${progressD})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background: #6366f1"></div>
                                <span>Pendente (${pendingD})</span>
                            </div>
                            <div class="legend-item" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-muted); font-weight: 700;">
                                <div class="legend-color" style="background: var(--text-3)"></div>
                                <span>Total (${totalD})</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Atividade Recente</h2>
                    </div>
                    <div class="bar-list" style="gap: 8px;">
                        ${history.slice(0, 5).map(h => `
                            <div class="user-item" style="padding: 10px; font-size: 0.8rem; background: var(--bg-1);">
                                <div><strong>${h.user}</strong> ${h.action.toLowerCase()} ${h.entity}: ${h.details}</div>
                                <div style="color: var(--text-3); font-size: 0.7rem; margin-top:4px;">${new Date(h.timestamp).toLocaleString()}</div>
                            </div>
                        `).join('') || '<p class="text-muted">Nenhuma atividade.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStatusBar(label, value, total, color) {
    const pct = total > 0 ? (value / total * 100).toFixed(0) : 0;
    return `
        <div class="bar-item">
            <div class="bar-item-label">
                <span>${label}</span>
                <span>${value} (${pct}%)</span>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%; background: ${color}"></div>
            </div>
        </div>
    `;
}

function renderDemandas() {
    const areas = [...new Set(demands.filter(d => d.area).map(d => d.area))].sort();
    const responsaveis = [...new Set(demands.filter(d => d.responsavel).map(d => d.responsavel))].sort();
    const statuses = ['Pendente', 'Em andamento', 'Concluído', 'Excluído'];

    return `
        <div class="fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Gestão de Demandas</h1>
                    <p class="page-subtitle">Visualização e edição da planilha "Time".</p>
                </div>
                <button class="btn btn-primary" onclick="openDemandModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nova Demanda
                </button>
            </div>

            <div class="filter-bar" style="gap: 12px; margin-bottom: 24px;">
                <div class="search-wrap" style="flex: 2;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" id="search-demands" class="form-control search-input" placeholder="Buscar por assunto ou atividade..." oninput="handleSearchDemands(this.value)" value="${searchDemandsQuery || ''}">
                </div>
                
                <div class="multi-select-dropdown" id="multi-area-container" style="flex: 1;">
                    <button class="multi-select-btn" onclick="toggleMultiSelectMenu('multi-area-container', event)">
                        <span class="multi-select-label">Todas as Áreas</span>
                        <svg class="multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="multi-select-menu">
                        ${areas.map(a => `
                            <label class="multi-select-option">
                                <input type="checkbox" value="${a}" onchange="handleMultiSelectChange('area', '${a}', this.checked)" ${activeFilters.area.includes(a) ? 'checked' : ''}>
                                <span>${a}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="multi-select-dropdown" id="multi-responsavel-container" style="flex: 1;">
                    <button class="multi-select-btn" onclick="toggleMultiSelectMenu('multi-responsavel-container', event)">
                        <span class="multi-select-label">Responsável</span>
                        <svg class="multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="multi-select-menu">
                        ${responsaveis.map(r => `
                            <label class="multi-select-option">
                                <input type="checkbox" value="${r}" onchange="handleMultiSelectChange('responsavel', '${r}', this.checked)" ${activeFilters.responsavel.includes(r) ? 'checked' : ''}>
                                <span>${r}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="multi-select-dropdown" id="multi-status-container" style="flex: 1;">
                    <button class="multi-select-btn" onclick="toggleMultiSelectMenu('multi-status-container', event)">
                        <span class="multi-select-label">Status</span>
                        <svg class="multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="multi-select-menu">
                        ${statuses.map(s => `
                            <label class="multi-select-option">
                                <input type="checkbox" value="${s}" onchange="handleMultiSelectChange('status', '${s}', this.checked)" ${activeFilters.status.includes(s) ? 'checked' : ''}>
                                <span>${s}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <select id="sort-demands" class="filter-select" onchange="handleSortDemandsChange(this.value)" style="flex: 1; border-color: var(--accent);">
                    <option value="id-desc" ${currentSort.field === 'id' && currentSort.direction === 'desc' ? 'selected' : ''}>Mais Recentes</option>
                    <option value="area-asc" ${currentSort.field === 'area' && currentSort.direction === 'asc' ? 'selected' : ''}>Área (A-Z)</option>
                    <option value="assunto-asc" ${currentSort.field === 'assunto' && currentSort.direction === 'asc' ? 'selected' : ''}>Assunto (A-Z)</option>
                    <option value="resp-asc" ${currentSort.field === 'responsavel' && currentSort.direction === 'asc' ? 'selected' : ''}>Responsável (A-Z)</option>
                    <option value="data-asc" ${currentSort.field === 'dataPrevista' && currentSort.direction === 'asc' ? 'selected' : ''}>Data Prevista (Cresc.)</option>
                </select>

                ${(activeFilters.area.length > 0 || activeFilters.responsavel.length > 0 || activeFilters.status.length > 0 || searchDemandsQuery) ? `
                <button class="btn btn-ghost btn-sm clear-filters-btn" onclick="clearAllFilters()" title="Limpar todos os filtros" style="flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 38px; border: 1px solid var(--danger); color: var(--danger); border-radius: var(--radius); font-size: 0.8rem; font-weight: 600; white-space: nowrap; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.12)'" onmouseout="this.style.background='transparent'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px; flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Limpar Filtros
                </button>` : ''}
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th onclick="toggleSort('area')">Área ${getSortIcon('area')}</th>
                            <th onclick="toggleSort('assunto')">Assunto ${getSortIcon('assunto')}</th>
                            <th onclick="toggleSort('atividades')">Atividade ${getSortIcon('atividades')}</th>
                            <th onclick="toggleSort('dataPrevista')">Previsão ${getSortIcon('dataPrevista')}</th>
                            <th onclick="toggleSort('responsavel')">Resp. ${getSortIcon('responsavel')}</th>
                            <th onclick="toggleSort('status')">Status ${getSortIcon('status')}</th>
                            <th style="width:120px; cursor: default;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="demands-body">
                        ${renderDemandsTableRows(getFilteredDemands())}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderDemandsTableRows(data) {
    if (data.length === 0) return `<tr><td colspan="7" class="empty-state">Nenhuma demanda encontrada.</td></tr>`;
    return data.map(d => `
        <tr data-demand-id="${d.id}" class="${selectedDemandId === d.id ? 'tr-selected' : ''}" onclick="selectDemand(${d.id}); viewDemanda(${d.id});" style="cursor: pointer;">
            <td class="font-600">${d.area}</td>
            <td class="truncate" style="max-width:120px">${d.assunto}</td>
            <td class="notes-cell" title="${d.atividades}">${d.atividades}</td>
            <td>${formatDateToBR(d.dataPrevista)}</td>
            <td class="font-600">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${(() => {
                        const respUser = users.find(u => u.name === d.responsavel && u.approved);
                        if (respUser && respUser.avatar) {
                            return `<img src="${respUser.avatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent);">`;
                        } else {
                            return `<div class="user-avatar" style="width: 24px; height: 24px; font-size: 0.6rem; border-width: 1px;">${(d.responsavel || '?').charAt(0)}</div>`;
                        }
                    })()}
                    ${d.responsavel}
                </div>
            </td>
            <td><span class="badge ${getStatusBadgeClass(d.status)}">${d.status || 'Pendente'}</span></td>
            <td>
                <div class="td-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-icon btn-ghost btn-sm" onclick="viewDemandHistory(${d.id})" title="Histórico de Modificações">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    <button class="btn btn-icon btn-ghost btn-sm" onclick="editDemanda(${d.id})" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn btn-icon btn-ghost btn-sm" onclick="deleteDemanda(${d.id})" title="Excluir Demanda" ${d.status === 'Excluído' ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewDemanda(id) {
    const item = demands.find(d => d.id === id);
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" style="max-width: 650px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Detalhes da Demanda #${id}</h2>
                    <button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                        <div>
                            <label class="text-muted" style="display:block; margin-bottom:4px;">ÁREA</label>
                            <div class="font-600" style="font-size: 1.1rem; color: var(--accent);">${item.area}</div>
                        </div>
                        <div>
                            <label class="text-muted" style="display:block; margin-bottom:4px;">STATUS</label>
                            <div><span class="badge ${getStatusBadgeClass(item.status)}" style="font-size: 0.9rem; padding: 6px 12px;">${item.status || 'Pendente'}</span></div>
                        </div>
                        <div>
                            <label class="text-muted" style="display:block; margin-bottom:4px;">RESPONSÁVEL</label>
                            <div class="font-600">${item.responsavel}</div>
                        </div>
                        <div>
                            <label class="text-muted" style="display:block; margin-bottom:4px;">PREVISÃO</label>
                            <div class="font-600">${formatDateToBR(item.dataPrevista)}</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label class="text-muted" style="display:block; margin-bottom:4px;">ASSUNTO</label>
                        <div style="font-size: 1.2rem; font-weight: 700; background: var(--bg-3); padding: 12px; border-radius: 8px;">${item.assunto}</div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label class="text-muted" style="display:block; margin-bottom:4px;">ATIVIDADES / DETALHES</label>
                        <div style="white-space: pre-wrap; background: var(--bg-3); padding: 16px; border-radius: 8px; font-size: 0.95rem; border: 1px solid var(--border-muted); line-height: 1.6;">${item.atividades}</div>
                    </div>
                </div>
                <div class="modal-footer" style="border-top: 1px solid var(--border-muted); padding-top: 20px;">
                    <button class="btn btn-secondary" onclick="viewDemandHistory(${id})">Ver Histórico</button>
                    <button class="btn btn-primary" onclick="editDemanda(${id})">Editar Demanda</button>
                    <button class="btn btn-ghost" onclick="closeModal()">Fechar</button>
                </div>
            </div>
        </div>
    `;
}

function viewDemandHistory(id) {
    const item = demands.find(d => d.id === id);
    const itemHistory = history.filter(h => h.entity === 'Demanda' && h.entityId === id);
    
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Histórico: ${item.assunto}</h2>
                    <button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="bar-list" style="gap: 12px;">
                        ${itemHistory.map(h => `
                            <div class="user-item" style="padding: 12px; background: var(--bg-1); border: 1px solid var(--border-muted);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span class="badge badge-info">${h.action}</span>
                                    <span style="font-size: 0.7rem; color: var(--text-3);">${new Date(h.timestamp).toLocaleString()}</span>
                                </div>
                                <div style="font-size: 0.85rem;"><strong>${h.user}</strong> ${h.action.toLowerCase()} esta demanda.</div>
                                <div style="font-size: 0.75rem; color: var(--text-2); margin-top: 4px;">Detalhes: ${h.details}</div>
                            </div>
                        `).join('') || '<p class="empty-state">Nenhum histórico para este item.</p>'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
                </div>
            </div>
        </div>
    `;
}

function deleteDemanda(id) {
    if (confirm('Tem certeza que deseja excluir esta demanda?')) {
        const idx = demands.findIndex(d => d.id === id);
        if (idx !== -1) {
            demands[idx].status = 'Excluído';
            saveData('avb_demandas', demands);
            addHistory('Excluiu', 'Demanda', id, demands[idx].assunto);
            showToast('Demanda excluída.', 'warning');
            closeModal();
            renderAppKeepScroll();
        }
    }
}

function renderNotebooks() {
    return `
        <div class="fade-in">
            <div class="page-header">
                <h1 class="page-title">Troca de Notebooks</h1>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Situação</th>
                            <th>Professor</th>
                            <th>Localidade</th>
                            <th>Modelo</th>
                            <th>Hardware</th>
                        </tr>
                    </thead>
                    <tbody id="notebooks-body">
                        ${notebooks.map(n => `
                            <tr>
                                <td><span class="badge ${getSituacaoBadgeClass(n.situacao)}">${n.situacao}</span></td>
                                <td class="font-600">${n.professor}</td>
                                <td>${n.localidade}</td>
                                <td>${n.modeloAntigo}</td>
                                <td><span class="badge ${n.checkHardware === 'OK' ? 'badge-success' : 'badge-warning'}">${n.checkHardware}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderHistory() {
    return `
        <div class="fade-in">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Usuário</th>
                            <th>Ação</th>
                            <th>Entidade</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td>${new Date(h.timestamp).toLocaleString()}</td>
                                <td class="font-600">${h.user}</td>
                                <td><span class="badge badge-info">${h.action}</span></td>
                                <td>${h.entity}</td>
                                <td>${h.details}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ── UTILITIES ──────────────────────────────────────

function setupSidebarListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
}

function setupHeaderListeners() {}

function setupViewListeners() {}

function updateActiveNavItem() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === currentView);
    });
}

function getStatusBadgeClass(status) {
    if (!status) return 'badge-muted';
    switch (status.toLowerCase()) {
        case 'concluído': return 'badge-success';
        case 'em andamento': return 'badge-warning';
        case 'excluído': return 'badge-danger';
        default: return 'badge-accent';
    }
}

function getSituacaoBadgeClass(situacao) {
    if (!situacao) return 'badge-muted';
    switch (situacao.toLowerCase()) {
        case 'recebido': return 'badge-success';
        case 'enviado': return 'badge-info';
        case 'retornou': return 'badge-danger';
        default: return 'badge-warning';
    }
}

function getFilteredDemands() {
    const q = searchDemandsQuery ? searchDemandsQuery.toLowerCase() : '';

    let filtered = demands.filter(d => {
        const matchesQuery = !q || (d.assunto.toLowerCase().includes(q) || (d.atividades && d.atividades.toLowerCase().includes(q)));
        
        const matchesArea = activeFilters.area.length > 0
            ? (d.area && activeFilters.area.includes(d.area))
            : true;
            
        const matchesResp = activeFilters.responsavel.length > 0
            ? (d.responsavel && activeFilters.responsavel.includes(d.responsavel))
            : true;
            
        const matchesStatus = activeFilters.status.length > 0
            ? (d.status && activeFilters.status.includes(d.status))
            : (d.status && d.status !== 'Excluído' && d.status !== 'Concluído');
        
        return matchesQuery && matchesArea && matchesResp && matchesStatus;
    });

    // Ordenação dinâmica robusta
    filtered.sort((a, b) => {
        let valA, valB;
        if (currentSort.field === 'dataPrevista') {
            valA = parseDateString(a.dataPrevista);
            valB = parseDateString(b.dataPrevista);
            return currentSort.direction === 'asc'
                ? valA.getTime() - valB.getTime()
                : valB.getTime() - valA.getTime();
        } else if (currentSort.field === 'id') {
            valA = a.id || 0;
            valB = b.id || 0;
            return currentSort.direction === 'asc' ? valA - valB : valB - valA;
        } else {
            valA = (a[currentSort.field] || '').toString().toLowerCase();
            valB = (b[currentSort.field] || '').toString().toLowerCase();
            return currentSort.direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }
    });

    return filtered;
}

function filterDemands() {
    const body = document.getElementById('demands-body');
    if (body) {
        body.innerHTML = renderDemandsTableRows(getFilteredDemands());
    }
}

function handleSearchDemands(val) {
    searchDemandsQuery = val;
    filterDemands();
}

function handleSortDemandsChange(val) {
    if (val === 'id-desc') {
        currentSort = { field: 'id', direction: 'desc' };
    } else if (val === 'area-asc') {
        currentSort = { field: 'area', direction: 'asc' };
    } else if (val === 'assunto-asc') {
        currentSort = { field: 'assunto', direction: 'asc' };
    } else if (val === 'resp-asc') {
        currentSort = { field: 'responsavel', direction: 'asc' };
    } else if (val === 'data-asc') {
        currentSort = { field: 'dataPrevista', direction: 'asc' };
    }
    renderApp();
}

function toggleMultiSelectMenu(containerId, event) {
    event.stopPropagation();
    const el = document.getElementById(containerId);
    if (!el) return;
    const isOpen = el.classList.contains('open');
    
    // Fecha todos os outros dropdowns
    document.querySelectorAll('.multi-select-dropdown').forEach(d => {
        if (d.id !== containerId) d.classList.remove('open');
    });
    
    el.classList.toggle('open', !isOpen);
}

function handleMultiSelectChange(type, value, checked) {
    if (checked) {
        if (!activeFilters[type].includes(value)) {
            activeFilters[type].push(value);
        }
    } else {
        activeFilters[type] = activeFilters[type].filter(v => v !== value);
    }
    
    updateMultiSelectButtonText(type);
    filterDemands();
}

function updateMultiSelectButtonText(type) {
    const containerId = type === 'responsavel' ? 'multi-responsavel-container' : `multi-${type}-container`;
    const btnLabel = document.querySelector(`#${containerId} .multi-select-label`);
    if (!btnLabel) return;
    
    const selected = activeFilters[type];
    let defaultText = '';
    if (type === 'area') defaultText = 'Todas as Áreas';
    if (type === 'responsavel') defaultText = 'Responsável';
    if (type === 'status') defaultText = 'Status';
    
    if (selected.length === 0) {
        btnLabel.innerText = defaultText;
        btnLabel.classList.remove('has-selection');
    } else if (selected.length === 1) {
        btnLabel.innerText = selected[0];
        btnLabel.classList.add('has-selection');
    } else {
        btnLabel.innerText = `${defaultText} (${selected.length})`;
        btnLabel.classList.add('has-selection');
    }
}

// Fechar dropdowns ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.multi-select-dropdown')) {
        document.querySelectorAll('.multi-select-dropdown').forEach(el => el.classList.remove('open'));
    }
});

function openDemandModal(id = null) {
    const modalContainer = document.getElementById('modal-container');
    const isEdit = id !== null;
    const item = isEdit ? demands.find(d => d.id === id) : { area: '', assunto: '', atividades: '', dataPrevista: '', responsavel: '', status: 'Pendente' };

    // Buscar nomes de usuários aprovados para sugestão
    const userNames = [...new Set(users.filter(u => u.approved).map(u => u.name))].sort();

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header"><h2>${isEdit ? 'Editar' : 'Nova'} Demanda</h2><button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button></div>
                <div class="modal-body">
                    <form id="demand-form">
                        <div class="form-row">
                            <div class="form-group"><label>Área</label><input type="text" id="m-area" class="form-control" value="${item.area}"></div>
                            <div class="form-group">
                                <label>Responsável</label>
                                <input type="text" id="m-resp" class="form-control" value="${item.responsavel}" list="user-names-list" placeholder="Digite ou selecione...">
                                <datalist id="user-names-list">
                                    ${userNames.map(name => `<option value="${name}">`).join('')}
                                </datalist>
                            </div>
                        </div>
                        <div class="form-group"><label>Assunto</label><input type="text" id="m-assunto" class="form-control" value="${item.assunto}"></div>
                        <div class="form-group"><label>Atividades</label><textarea id="m-ativ" class="form-control">${item.atividades}</textarea></div>
                        <div class="form-row">
                            <div class="form-group"><label>Previsão</label><input type="date" id="m-data" class="form-control" value="${item.dataPrevista}"></div>
                            <div class="form-group"><label>Status</label>
                                <select id="m-status" class="form-control">
                                    <option value="Pendente" ${item.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="Em andamento" ${item.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
                                    <option value="Concluído" ${item.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                                    <option value="Excluído" ${item.status === 'Excluído' ? 'selected' : ''}>Excluído</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveDemanda(${id})">Salvar</button></div>
            </div>
        </div>
    `;
}

function saveDemanda(id) {
    const data = {
        area: document.getElementById('m-area').value,
        responsavel: document.getElementById('m-resp').value,
        assunto: document.getElementById('m-assunto').value,
        atividades: document.getElementById('m-ativ').value,
        dataPrevista: document.getElementById('m-data').value,
        status: document.getElementById('m-status').value
    };
    if (id === null) {
        data.id = Date.now();
        demands.unshift(data);
        addHistory('Criou', 'Demanda', data.id, data.assunto);
    } else {
        const idx = demands.findIndex(d => d.id === id);
        const original = demands[idx];
        
        const changes = [];
        const fields = [
            { key: 'area', label: 'Área' },
            { key: 'responsavel', label: 'Responsável' },
            { key: 'assunto', label: 'Assunto' },
            { key: 'atividades', label: 'Atividades' },
            { key: 'dataPrevista', label: 'Previsão', isDate: true },
            { key: 'status', label: 'Status' }
        ];
        
        fields.forEach(field => {
            let origVal = original[field.key] || '';
            let newVal = data[field.key] || '';
            
            if (origVal !== newVal) {
                if (field.isDate) {
                    origVal = formatDateToBR(origVal);
                    newVal = formatDateToBR(newVal);
                }
                if (field.key === 'atividades') {
                    changes.push(`• <strong>${field.label}</strong>: alteradas`);
                } else {
                    changes.push(`• <strong>${field.label}</strong>: de "${origVal}" para "${newVal}"`);
                }
            }
        });
        
        const detailsText = changes.length > 0 ? `${original.assunto}<br>${changes.join('<br>')}` : `${original.assunto}<br>Nenhuma alteração de valores`;
        
        demands[idx] = { ...demands[idx], ...data };
        addHistory('Editou', 'Demanda', id, detailsText);
    }
    saveData('avb_demandas', demands);
    closeModal();
    renderAppKeepScroll();
    showToast('Salvo com sucesso!');
}

function editDemanda(id) {
    selectDemand(id);
    openDemandModal(id);
}

function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── THEME TOGGLE ───────────────────────────────────

let currentTheme = localStorage.getItem('avb_theme') || 'dark';
document.body.classList.toggle('light-mode', currentTheme === 'light');

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-mode', currentTheme === 'light');
    localStorage.setItem('avb_theme', currentTheme);
    renderApp();
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
        input.type = 'password';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
}
