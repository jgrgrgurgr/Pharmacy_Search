// Main JavaScript file for common functionality

class PharmacyApp {
    constructor() {
        this.apiBase = '/api/v1';
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    setupModal() {
        // Modal close functionality
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.close');

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeModal(button.closest('.modal'));
            });
        });

        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showLoginModal() {
        this.showModal('loginModal');
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${this.apiBase}/users/login`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.access_token;
                localStorage.setItem('authToken', this.token);
                this.closeModal(document.getElementById('loginModal'));
                this.updateAuthUI(true);
                this.showAlert('Login successful!', 'success');
            } else {
                const error = await response.json();
                this.showAlert(error.detail || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    checkAuthStatus() {
        if (this.token) {
            this.updateAuthUI(true);
        }
    }

    updateAuthUI(isLoggedIn) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            if (isLoggedIn) {
                loginBtn.textContent = 'Logout';
                loginBtn.onclick = () => this.logout();
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.onclick = () => this.showLoginModal();
            }
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        this.token = null;
        this.updateAuthUI(false);
        this.showAlert('Logged out successfully', 'info');
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Authentication required');
            }

            return response;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    createStarRating(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = i <= rating ? 'fas fa-star star' : 'far fa-star star empty';
            stars.push(star);
        }
        return stars;
    }

    getQualityScoreClass(score) {
        if (score >= 4.5) return 'score-excellent';
        if (score >= 3.5) return 'score-good';
        if (score >= 2.5) return 'score-average';
        return 'score-poor';
    }

    getQualityScoreText(score) {
        if (score >= 4.5) return 'Excellent';
        if (score >= 3.5) return 'Good';
        if (score >= 2.5) return 'Average';
        return 'Poor';
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                input.style.borderColor = '#e9ecef';
            }
        });

        return isValid;
    }

    resetForm(form) {
        form.reset();
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.borderColor = '#e9ecef';
        });
    }
}

// Initialize the app
const app = new PharmacyApp();

// Export for use in other files
window.PharmacyApp = app;