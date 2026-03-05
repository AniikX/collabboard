const isVercel = window.location.hostname.includes('vercel.app');
const API_BASE = isVercel 
    ? window.location.origin + '/api/auth/real-'
    : window.location.origin + '/api/auth/';

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            this.setupPasswordValidation();
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    setupPasswordValidation() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const errorElement = document.getElementById('confirmPasswordError');

        if (password.value !== confirmPassword.value) {
            errorElement.textContent = 'Пароли не совпадают';
            return false;
        } else {
            errorElement.textContent = '';
            return true;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        console.log('🔄 Начало регистрации...');
        
        if (!this.validatePasswordMatch()) {
            console.log('❌ Пароли не совпадают');
            return;
        }

        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        console.log('📤 Отправка данных:', userData);

        try {
            this.setLoading(true);
            
            // Умное определение URL
            const isVercel = window.location.hostname.includes('vercel.app');
            const API_BASE = isVercel 
                ? window.location.origin + '/api/auth/real-'
                : window.location.origin + '/api/auth/';
            
            const url = isVercel ? `${API_BASE}register` : `${API_BASE}register`;
            console.log('🌐 Отправка на:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            console.log('📥 Ответ получен, статус:', response.status);
            const data = await response.json();
            console.log('📄 Данные ответа:', data);

            if (data.success) {
                console.log('🎉 Регистрация успешна!');
                this.showMessage('Регистрация успешна! Перенаправление...', 'success');
                localStorage.setItem('token', data.token);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                console.log('❌ Ошибка регистрации:', data.message);
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('💥 Ошибка соединения:', error);
            this.showMessage('Ошибка соединения с сервером', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            this.setLoading(true);
            
            const response = await fetch(`${API_BASE}real-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('Вход выполнен успешно!', 'success');
                localStorage.setItem('token', data.token);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Ошибка соединения с сервером', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async checkAuthentication() {
        const token = localStorage.getItem('token');
        
        if (token && (window.location.pathname.includes('login.html') || 
                      window.location.pathname.includes('register.html'))) {
            try {
                const response = await fetch(`${API_BASE}me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    }

    setLoading(loading) {
        const forms = document.querySelectorAll('form');
        const buttons = document.querySelectorAll('.auth-btn');
        
        forms.forEach(form => form.classList.toggle('loading', loading));
        buttons.forEach(button => {
            button.disabled = loading;
            if (loading) {
                button.dataset.originalText = button.textContent;
                button.textContent = 'Загрузка...';
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        });
    }

    showMessage(message, type) {
        const existingMessages = document.querySelectorAll('.success-message, .error-message-global');
        existingMessages.forEach(msg => msg.remove());

        const messageElement = document.createElement('div');
        messageElement.className = type === 'success' ? 'success-message' : 'error-message-global';
        messageElement.textContent = message;

        const form = document.querySelector('form') || document.querySelector('.auth-card');
        form.parentNode.insertBefore(messageElement, form);
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});