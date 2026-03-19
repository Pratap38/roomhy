lucide.createIcons();

        /* Mobile Side Menu JS */
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');

        if (menuToggle && mobileMenu && menuClose && menuOverlay) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.remove('translate-x-full');
                menuOverlay.classList.remove('hidden');
            });
            const closeMenu = () => {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
            };
            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                     // Close menu only for internal links
                     if (link.getAttribute('href').startsWith('#') || link.getAttribute('href').endsWith('')) {
                        closeMenu();
                    }
                });
             });
        }

        // Toast notification
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 9999;
                max-width: 300px;
                word-wrap: break-word;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        // Redirect user based on role
        function redirectAfterLogin(user) {
            try {
                if (user.role === 'superadmin') {
                    window.location.href = '/superadmin/superadmin';
                } else if (user.role === 'areamanager' || user.role === 'manager' || user.role === 'employee') {
                    window.location.href = '/employee/areaadmin';
                } else if (user.role === 'owner') {
                    window.location.href = '/propertyowner/index';
                } else {
                    // Default to website index for tenants and others
                    window.location.href = 'index';
                }
            } catch (e) {
                showToast('Redirect failed', 'error');
            }
        }

        // Login Form Handler
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();

                if (!email || !password) {
                    showToast('Please fill all fields', 'error');
                    return;
                }

                try {
                    const response = await fetch(API_URL + '/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: email, password })
                    });

                    console.log('[Login] Response status:', response.status);
                    const data = await response.json().catch((err) => {
                        console.error('[Login] Failed to parse response JSON:', err);
                        return {};
                    });
                    
                    console.log('[Login] Response data keys:', Object.keys(data));
                    console.log('[Login] Has token:', !!data.token);
                    console.log('[Login] Has user:', !!data.user);

                    if (response.ok && data.token && data.user) {
                        showToast('Login successful!', 'success');
                        if (typeof AuthUtils !== 'undefined' && AuthUtils.setWebsiteSession) {
                            AuthUtils.setWebsiteSession(data.user, data.token);
                        } else {
                            localStorage.setItem('user', JSON.stringify(data.user));
                            localStorage.setItem('token', data.token);
                            sessionStorage.setItem('token', data.token);
                        }
                        setTimeout(() => redirectAfterLogin(data.user), 300);
                        return;
                    }
                    
                    if (!response.ok) {
                        console.error('[Login] Response not ok:', response.status, data);
                        showToast('Login failed: ' + (data.message || 'Invalid credentials'), 'error');
                        return;
                    }

                    showToast('Login failed: incorrect credentials', 'error');
                } catch (err) {
                    console.error('[Login] Fetch error:', err);
                    showToast('Network error: ' + err.message, 'error');
                }
            });
        }

        // Forgot password handler (falls back to localStorage reset if backend not available)
        const forgotBtn = document.getElementById('forgotBtn');
        if (forgotBtn) {
            forgotBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = prompt('Enter your registered email for password reset:');
                if (!email) return;

                // Try backend reset endpoints first (best-effort)
                try {
                    const res = await fetch(API_URL + '/tenant/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                    if (res.ok) {
                        showToast('If an account exists, you will receive reset instructions.', 'info');
                        return;
                    }
                } catch (err) {
                    // ignore, fallback to localStorage below
                }

                // Local fallback: allow immediate password set if email exists in roomhy_tenants
                const tenantsKey = 'roomhy_tenants';
                const tenants = JSON.parse(localStorage.getItem(tenantsKey) || '[]');
                const idx = tenants.findIndex(t => (t.email || '').toLowerCase() === (email || '').toLowerCase());
                if (idx === -1) {
                    alert('No account found for that email (offline).');
                    return;
                }

                const newPass = prompt('Enter your new password:');
                if (!newPass) return alert('Password not changed');
                const confirmPass = prompt('Confirm new password:');
                if (newPass !== confirmPass) return alert('Passwords do not match');

                tenants[idx].password = newPass;
                tenants[idx].status = 'active';
                localStorage.setItem(tenantsKey, JSON.stringify(tenants));
                alert('Password updated locally. You can now login.');
            });
        }
