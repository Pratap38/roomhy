lucide.createIcons();

        // Mobile Menu Logic
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const drawer = document.getElementById('mobile-menu-drawer');
        const overlay = document.getElementById('mobile-menu-overlay');

        function toggleMenu(isOpen) {
            if (isOpen) {
                overlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                setTimeout(() => overlay.classList.add('opacity-100'), 10);
                drawer.classList.remove('translate-x-full');
            } else {
                overlay.classList.remove('opacity-100');
                document.body.style.overflow = '';
                drawer.classList.add('translate-x-full');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        }

        menuToggle.onclick = () => toggleMenu(true);
        menuClose.onclick = () => toggleMenu(false);
        overlay.onclick = () => toggleMenu(false);

        // Hero Slideshow
        const heroImages = document.querySelectorAll('#hero-image-wrapper img');
        let currentIdx = 0;
        setInterval(() => {
            heroImages[currentIdx].classList.replace('opacity-100', 'opacity-0');
            currentIdx = (currentIdx + 1) % heroImages.length;
            heroImages[currentIdx].classList.replace('opacity-0', 'opacity-100');
        }, 5000);

        // Auth Logic
        const container = document.getElementById('auth-container');
        document.getElementById('show-signup-btn').onclick = () => {
            container.classList.add('signup-active');
            if(window.innerWidth <= 768) container.scrollIntoView({ behavior: 'smooth' });
        };
        document.getElementById('show-login-btn').onclick = () => {
            container.classList.remove('signup-active');
            if(window.innerWidth <= 768) container.scrollIntoView({ behavior: 'smooth' });
        };

        // Toast notification (re-use from login if needed)
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

        // ========== LOGIN FORM HANDLER ==========
        // Checks login details against KYC verification table
        const loginForm = document.querySelector('#login-form-content form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const loginId = loginForm.querySelector('input[type="text"]').value.trim().toLowerCase();
                const password = loginForm.querySelector('input[type="password"]').value;

                if (!loginId || !password) {
                    showToast('Please enter email/phone and password', 'error');
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: loginId, password })
                    });

                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data.token || !data.user) {
                        showToast(data.message || 'Invalid login credentials', 'error');
                        return;
                    }

                    if (typeof AuthUtils !== 'undefined' && AuthUtils.setWebsiteSession) {
                        AuthUtils.setWebsiteSession(data.user, data.token);
                    }

                    showToast('Login successful! Redirecting...', 'success');
                    setTimeout(() => { window.location.href = 'index'; }, 800);
                } catch (err) {
                    console.error('Login failed:', err);
                    showToast('Unable to login right now. Please try again.', 'error');
                }
            });
        }
        // Signup with email verification code
        const signupForm = document.getElementById('signup-form');
        const createAccountBtn = document.getElementById('createAccountBtn');
        const verifyAccountBtn = document.getElementById('verifyAccountBtn');
        const verificationBlock = document.getElementById('verificationBlock');
        const verificationCodeInput = document.getElementById('verificationCode');
        let pendingSignupPayload = null;

        function setSignupButtonsLoading(isLoading, action) {
            if (action === 'create') {
                createAccountBtn.disabled = isLoading;
                createAccountBtn.textContent = isLoading ? 'Sending Code...' : (pendingSignupPayload ? 'Resend Code' : 'Create Account');
            }
            if (action === 'verify') {
                verifyAccountBtn.disabled = isLoading;
                verifyAccountBtn.textContent = isLoading ? 'Verifying...' : 'Verify & Create Account';
            }
        }

        async function requestSignupOtp(payload) {
            const res = await fetch(`${API_URL}/api/kyc/signup/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Unable to send verification code');
            }
            return data;
        }

        async function verifyAndCreateSignup(payload, otp) {
            const res = await fetch(`${API_URL}/api/kyc/signup/verify-and-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, otp })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Unable to verify code');
            }
            return data;
        }

        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const email = document.getElementById('email').value.trim().toLowerCase();
                const phone = document.getElementById('phone').value.trim();
                const password = document.getElementById('password').value;

                if (!firstName || !email || !phone || !password) {
                    showToast('Please fill required fields', 'error');
                    return;
                }
                if (!/^\d{10}$/.test(phone)) {
                    showToast('Enter a valid 10-digit phone number', 'error');
                    return;
                }

                const payload = { firstName, lastName, email, phone, password };

                try {
                    setSignupButtonsLoading(true, 'create');
                    await requestSignupOtp(payload);
                    pendingSignupPayload = payload;
                    verificationBlock.classList.remove('hidden');
                    showToast('Verification code sent to your Gmail. Enter the code to continue.', 'success');
                } catch (err) {
                    console.warn('Signup OTP request failed:', err.message);
                    showToast(err.message || 'Unable to send verification code', 'error');
                } finally {
                    setSignupButtonsLoading(false, 'create');
                }
            });
        }

        if (verifyAccountBtn) {
            verifyAccountBtn.addEventListener('click', async () => {
                const otp = (verificationCodeInput.value || '').trim();
                if (!pendingSignupPayload) {
                    showToast('Please click Create Account first', 'error');
                    return;
                }
                if (!/^\d{6}$/.test(otp)) {
                    showToast('Enter a valid 6-digit verification code', 'error');
                    return;
                }

                try {
                    setSignupButtonsLoading(true, 'verify');
                    const data = await verifyAndCreateSignup(pendingSignupPayload, otp);
                    const userData = data.user || null;
                    const token = data.token || '';

                    if (userData && token && typeof AuthUtils !== 'undefined' && AuthUtils.setWebsiteSession) {
                        AuthUtils.setWebsiteSession(userData, token);
                    }

                    showToast(data.message || 'Account created successfully', 'success');
                    setTimeout(() => { location.href = 'index'; }, 900);
                } catch (err) {
                    console.warn('Signup OTP verify failed:', err.message);
                    showToast(err.message || 'Unable to verify code', 'error');
                } finally {
                    setSignupButtonsLoading(false, 'verify');
                }
            });
        }
