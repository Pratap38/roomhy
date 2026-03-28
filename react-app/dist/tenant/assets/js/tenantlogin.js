lucide.createIcons();
        let tenantPayload = null;
        let forgotLoginId = '';
        let forgotResetToken = '';

        async function fetchTenantByLoginId(loginId) {
            try {
                const res = await fetch(`${API_URL}/api/tenants`);
                if (!res.ok) return null;
                const tenants = await res.json();
                if (!Array.isArray(tenants)) return null;
                return tenants.find(t => (t.loginId || '').toUpperCase() === String(loginId || '').toUpperCase()) || null;
            } catch (_) {
                return null;
            }
        }

        function togglePasswordVisibility(inputId, btn) {
            const input = document.getElementById(inputId);
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = btn && btn.querySelector ? btn.querySelector('i') : null;
            if (icon) {
                icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
                lucide.createIcons();
            }
        }

        function setForgotStep(step) {
            document.getElementById('forgot-step-1')?.classList.toggle('hidden', step !== 1);
            document.getElementById('forgot-step-2')?.classList.toggle('hidden', step !== 2);
            document.getElementById('forgot-step-3')?.classList.toggle('hidden', step !== 3);
            const subtitle = document.getElementById('forgot-subtitle');
            if (!subtitle) return;
            if (step === 1) subtitle.textContent = 'Enter your Tenant Login ID';
            if (step === 2) subtitle.textContent = `OTP sent for ${forgotLoginId}`;
            if (step === 3) subtitle.textContent = 'Set your new password';
        }

        function openForgotModal() {
            const modal = document.getElementById('forgot-modal');
            if (!modal) return;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            const currentLogin = (document.getElementById('login-id')?.value || '').trim().toUpperCase();
            document.getElementById('forgot-login-id').value = currentLogin;
            forgotLoginId = '';
            forgotResetToken = '';
            setForgotStep(1);
            lucide.createIcons();
        }

        function closeForgotModal() {
            const modal = document.getElementById('forgot-modal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            forgotLoginId = '';
            forgotResetToken = '';
        }

        async function requestTenantOtp() {
            const loginId = (document.getElementById('forgot-login-id')?.value || '').trim().toUpperCase();
            if (!loginId) return showError('Please enter Tenant Login ID');
            try {
                const res = await fetch(`${API_URL}/api/auth/tenant/forgot-password/request-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return showError(data.message || 'Unable to send OTP');
                forgotLoginId = loginId;
                setForgotStep(2);
                if (data.demo_otp) console.log('[DEV] Tenant OTP:', data.demo_otp);
                alert(data.message || 'OTP sent successfully');
            } catch (e) {
                showError('Network error while sending OTP');
            }
        }

        async function verifyTenantOtp() {
            const otp = (document.getElementById('forgot-otp')?.value || '').trim();
            if (!forgotLoginId) return showError('Please request OTP first');
            if (!otp || otp.length < 6) return showError('Enter valid 6-digit OTP');
            try {
                const res = await fetch(`${API_URL}/api/auth/tenant/forgot-password/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId: forgotLoginId, otp })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return showError(data.message || 'Invalid OTP');
                forgotResetToken = data.token || '';
                setForgotStep(3);
            } catch (e) {
                showError('Network error while verifying OTP');
            }
        }

        async function resetTenantPassword() {
            const newPassword = (document.getElementById('forgot-new-password')?.value || '').trim();
            const confirmPassword = (document.getElementById('forgot-confirm-password')?.value || '').trim();
            if (!forgotLoginId || !forgotResetToken) return showError('Please verify OTP first');
            if (newPassword.length < 6) return showError('Password must be at least 6 characters');
            if (newPassword !== confirmPassword) return showError('Passwords do not match');

            try {
                const res = await fetch(`${API_URL}/api/auth/tenant/forgot-password/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId: forgotLoginId, token: forgotResetToken, newPassword })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return showError(data.message || 'Failed to reset password');

                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                const idx = tenants.findIndex(t => (t.loginId || '').toUpperCase() === forgotLoginId);
                if (idx > -1) {
                    tenants[idx].password = newPassword;
                    tenants[idx].tempPassword = null;
                    tenants[idx].passwordSet = true;
                    localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                }

                document.getElementById('login-id').value = forgotLoginId;
                document.getElementById('temp-password').value = newPassword;
                closeForgotModal();
                alert('Password reset successful. Please login.');
            } catch (e) {
                showError('Network error while resetting password');
            }
        }

        // Keep tenant login page stable: do not auto-redirect on page load
        // even if an older tenant session exists in localStorage.

        // 2. Verify Credentials
        async function verifyTenantTemp() {
            const loginId = document.getElementById('login-id').value.trim().toUpperCase();
            const tempPassword = document.getElementById('temp-password').value.trim();

            // Fallback: Check localStorage (Demo Mode)
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');

            // First-time/temp-password flow should always take precedence.
            const firstTimeTenant = tenants.find(t =>
                t.loginId && t.loginId.toUpperCase() === loginId &&
                t.tempPassword === tempPassword
            );

            if (firstTimeTenant) {
                tenantPayload = { ...firstTimeTenant, tempPassword };
                showStep2();
                return;
            }

            // Backend first-time verification (for fresh devices with no localStorage)
            try {
                const verifyRes = await fetch(`${API_URL}/api/auth/tenant/verify-temp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId, tempPassword })
                });
                if (verifyRes.ok) {
                    const verifyData = await verifyRes.json().catch(() => ({}));
                    tenantPayload = { ...(verifyData.tenant || {}), loginId, tempPassword };
                    showStep2();
                    return;
                }
            } catch (_) {}

            // Normal backend login after password is already set
            try {
                const loginRes = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: loginId, password: tempPassword })
                });
                const loginData = await loginRes.json().catch(() => ({}));
                if (loginRes.ok && loginData && loginData.user && loginData.user.role === 'tenant') {
                    const tenantRecord = await fetchTenantByLoginId(loginId);
                    createSession(tenantRecord || {
                        id: loginData.user.id,
                        name: loginData.user.name || 'Tenant',
                        email: '',
                        phone: '',
                        loginId,
                        status: 'active',
                        kycStatus: 'verified',
                        profileFilled: true,
                        agreementSigned: true
                    });
                    return;
                }
            } catch (_) {}

            // Active tenant login with already-set password
            const activeTenant = tenants.find(t => (t.loginId && t.loginId.toUpperCase() === loginId) && (t.password === tempPassword));
            if(activeTenant) {
                createSession(activeTenant);
            } else {
                showError('Invalid Tenant ID or Password.');
            }
        }

        // 3. Set New Password
        async function setTenantPassword() {
            const newPassword = document.getElementById('new-password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();

            if (newPassword.length < 6) return showError('Password must be at least 6 characters.');
            if (newPassword !== confirmPassword) return showError('Passwords do not match.');

            if (!tenantPayload || !tenantPayload.loginId || !tenantPayload.tempPassword) {
                return showError('Session expired. Please login again with temporary password.');
            }

            try {
                const res = await fetch(`${API_URL}/api/auth/tenant/set-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        loginId: tenantPayload.loginId,
                        tempPassword: tenantPayload.tempPassword,
                        newPassword
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return showError(data.message || 'Failed to set new password');
            } catch (_) {
                return showError('Network error while setting new password.');
            }

            // Keep local mirror updated when present
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const idx = tenants.findIndex(t => t.loginId && t.loginId.toUpperCase() === (tenantPayload.loginId || '').toUpperCase());
            if (idx > -1) {
                tenants[idx].password = newPassword;
                tenants[idx].tempPassword = null;
                tenants[idx].passwordSet = true;
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
            }

            const tenantRecord = await fetchTenantByLoginId(tenantPayload.loginId);
            const sessionTenant = tenantRecord || {
                id: tenantPayload.id || tenantPayload._id || tenantPayload.loginId,
                name: tenantPayload.name || 'Tenant',
                email: tenantPayload.email || '',
                phone: tenantPayload.phone || '',
                loginId: tenantPayload.loginId,
                status: 'active',
                kycStatus: 'verified',
                profileFilled: true,
                agreementSigned: true
            };

            const user = {
                name: sessionTenant.name || 'Tenant',
                phone: sessionTenant.phone || '',
                email: sessionTenant.email || '',
                loginId: sessionTenant.loginId || tenantPayload.loginId,
                role: 'tenant',
                tenantId: sessionTenant.id || sessionTenant._id || sessionTenant.loginId || tenantPayload.loginId,
                passwordSet: true
            };
            localStorage.setItem('tenant_user', JSON.stringify(user));

            alert("Password Set! Redirecting to Dashboard.");
            window.location.href = '/tenant/tenantdashboard';
        }
        
        function createSession(tenant) {
            const user = {
                name: tenant.name,
                phone: tenant.phone,
                email: tenant.email,
                loginId: tenant.loginId,
                role: 'tenant',
                tenantId: tenant.id,
                passwordSet: true
            };
            localStorage.setItem('tenant_user', JSON.stringify(user));
            
            // Redirect to where they left off
            const checkinBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:5001'
                : 'https://admin.roomhy.com';
            if(!tenant.profileFilled) window.location.href = `${checkinBase}/digital-checkin/tenantprofile?loginId=${encodeURIComponent(tenant.loginId || '')}`;
            else if(tenant.kycStatus === 'pending') window.location.href = `${checkinBase}/digital-checkin/tenantkyc?loginId=${encodeURIComponent(tenant.loginId || '')}`;
            else if(!tenant.agreementSigned) window.location.href = `${checkinBase}/digital-checkin/tenantagreement?loginId=${encodeURIComponent(tenant.loginId || '')}`;
            else window.location.href = '/tenant/tenantdashboard';
        }

        function showStep2() {
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('step-2').classList.remove('hidden');
        }

        function showError(message) {
            document.getElementById('error-message').innerText = message;
            document.getElementById('error-modal').classList.remove('hidden');
        }
        function closeErrorModal() {
            document.getElementById('error-modal').classList.add('hidden');
        }
