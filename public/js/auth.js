// Authentication Controller
class AuthController {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        document.getElementById('signup-form')?.addEventListener('submit', (e) => {
            this.handleSignup(e);
        });

        // Form switching
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    showSignupForm() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('signup-page').classList.remove('hidden');
        document.getElementById('signup-page').classList.add('fade-in');
    }

    showLoginForm() {
        document.getElementById('signup-page').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('login-page').classList.add('fade-in');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validation
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        // Disable submit button
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('chatapp_token', data.token);
                localStorage.setItem('chatapp_user', JSON.stringify(data.user));

                showToast('Login successful!', 'success');

                // Initialize socket and show home page
                if (window.chatApp) {
                    window.chatApp.currentUser = data.user;
                    window.chatApp.initializeSocket();
                    window.chatApp.showHomePage();
                }

                // Clear form
                e.target.reset();
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validation
        if (!username || !email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (username.length < 3) {
            showToast('Username must be at least 3 characters long', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (!this.isValidUsername(username)) {
            showToast('Username can only contain letters, numbers, and underscores', 'error');
            return;
        }

        // Disable submit button
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('chatapp_token', data.token);
                localStorage.setItem('chatapp_user', JSON.stringify(data.user));

                showToast('Account created successfully!', 'success');

                // Initialize socket and show home page
                if (window.chatApp) {
                    window.chatApp.currentUser = data.user;
                    window.chatApp.initializeSocket();
                    window.chatApp.showHomePage();
                }

                // Clear form
                e.target.reset();
            } else {
                showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        return usernameRegex.test(username);
    }
}

// Initialize auth controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authController = new AuthController();
});