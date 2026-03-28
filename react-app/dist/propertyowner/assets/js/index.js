lucide.createIcons();
        function resolveTenantLoginUrl() {
            const host = window.location.hostname;
            // admin domain often serves SPA fallback for unknown paths.
            // Use api domain static route which is guaranteed to expose /tenant pages.
            if (host === 'admin.roomhy.com') return 'https://api.roomhy.com/tenant/tenantlogin';
            if (host === 'www.admin.roomhy.com') return 'https://api.roomhy.com/tenant/tenantlogin';
            return '/tenant/tenantlogin';
        }

        function goToTenantLogin() {
            window.location.assign(resolveTenantLoginUrl());
        }
        window.goToTenantLogin = goToTenantLogin;
        // Role selector behavior: Tenant -> tenant login page, Owner -> keep owner form
        try {
            const btnTenant = document.getElementById('btn-tenant');
            const btnOwner = document.getElementById('btn-owner');
            const tenantLoginPath = resolveTenantLoginUrl();
            if (btnTenant) btnTenant.addEventListener('click', () => {
                window.location.assign(tenantLoginPath);
            });
            if (btnOwner) btnOwner.addEventListener('click', () => {
                // visually emphasize owner button
                btnOwner.classList.add('bg-blue-600', 'text-white');
                btnTenant.classList.remove('bg-blue-600', 'text-white');
                // show owner form (already default)
                document.getElementById('step-1')?.classList.remove('hidden');
                document.getElementById('step-2')?.classList.add('hidden');
            });
        } catch (e) { console.warn('Role selector init failed', e); }
        let currentUserPayload = null;
        let currentTempPassword = '';
        let forgotLoginId = '';
        let forgotResetToken = '';
        let ownerMemoryStore = {};

        function getJsonStorage(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (e) {
                if (Object.prototype.hasOwnProperty.call(ownerMemoryStore, key)) return ownerMemoryStore[key];
                return fallback;
            }
        }

        function setJsonStorage(key, value) {
            ownerMemoryStore[key] = value;
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
        }

        function removeStorageKey(key) {
            try { localStorage.removeItem(key); } catch (e) {}
            try { sessionStorage.removeItem(key); } catch (e) {}
            delete ownerMemoryStore[key];
        }

        function setSessionKey(key, value) {
            try { sessionStorage.setItem(key, value); } catch (e) {}
        }

        async function buildOwnerSessionFromBackend(loginId, fallback = {}) {
            const normalizedLoginId = String(loginId || '').trim().toUpperCase();
            const base = {
                loginId: normalizedLoginId,
                ownerId: normalizedLoginId,
                role: 'owner',
                name: fallback.name || 'Owner',
                email: fallback.email || '',
                phone: fallback.phone || '',
                address: fallback.address || '',
                locationCode: fallback.locationCode || '',
                area: fallback.area || '',
                propertyName: fallback.propertyName || '',
                propertyLocation: fallback.propertyLocation || ''
            };
            if (!normalizedLoginId) return base;
            try {
                const res = await fetch(`${API_URL}/api/owners/${encodeURIComponent(normalizedLoginId)}`);
                if (!res.ok) return base;
                const owner = await res.json();
                return {
                    ...base,
                    name: owner?.name || owner?.profile?.name || base.name,
                    email: owner?.email || owner?.profile?.email || base.email,
                    phone: owner?.phone || owner?.profile?.phone || base.phone,
                    address: owner?.address || owner?.profile?.address || base.address,
                    locationCode: owner?.locationCode || owner?.profile?.locationCode || base.locationCode,
                    area: owner?.checkinArea || owner?.area || base.area,
                    kycStatus: owner?.kyc?.status || owner?.kycStatus || 'pending'
                    // Note: propertyName & propertyLocation are kept from base (fallback)
                };
            } catch (_) {
                return base;
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
            if (step === 1) subtitle.textContent = 'Enter your Owner Login ID';
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

        async function requestOwnerOtp() {
            const loginId = (document.getElementById('forgot-login-id')?.value || '').trim().toUpperCase();
            if (!loginId) return alert('Please enter Owner Login ID');
            try {
                const res = await fetch(`${API_URL}/api/auth/owner/forgot-password/request-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return alert(data.message || 'Unable to send OTP');
                forgotLoginId = loginId;
                setForgotStep(2);
                if (data.demo_otp) console.log('[DEV] Owner OTP:', data.demo_otp);
                alert(data.message || 'OTP sent successfully');
            } catch (e) {
                alert('Network error while sending OTP');
            }
        }

        async function verifyOwnerOtp() {
            const otp = (document.getElementById('forgot-otp')?.value || '').trim();
            if (!forgotLoginId) return alert('Please request OTP first');
            if (!otp || otp.length < 6) return alert('Enter valid 6-digit OTP');
            try {
                const res = await fetch(`${API_URL}/api/auth/owner/forgot-password/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId: forgotLoginId, otp })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return alert(data.message || 'Invalid OTP');
                forgotResetToken = data.token || '';
                setForgotStep(3);
            } catch (e) {
                alert('Network error while verifying OTP');
            }
        }

        async function resetOwnerPassword() {
            const newPassword = (document.getElementById('forgot-new-password')?.value || '').trim();
            const confirmPassword = (document.getElementById('forgot-confirm-password')?.value || '').trim();
            if (!forgotLoginId || !forgotResetToken) return alert('Please verify OTP first');
            if (newPassword.length < 6) return alert('Password must be at least 6 characters');
            if (newPassword !== confirmPassword) return alert('Passwords do not match');

            try {
                const res = await fetch(`${API_URL}/api/auth/owner/forgot-password/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId: forgotLoginId, token: forgotResetToken, newPassword })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return alert(data.message || 'Failed to reset password');

                const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                if (!db[forgotLoginId]) db[forgotLoginId] = {};
                db[forgotLoginId].credentials = db[forgotLoginId].credentials || {};
                db[forgotLoginId].credentials.password = newPassword;
                db[forgotLoginId].credentials.firstTime = false;
                db[forgotLoginId].passwordSet = true;
                localStorage.setItem('roomhy_owners_db', JSON.stringify(db));

                document.getElementById('login-id').value = forgotLoginId;
                document.getElementById('password').value = newPassword;
                closeForgotModal();
                alert('Password reset successful. Please login.');
            } catch (e) {
                alert('Network error while resetting password');
            }
        }

        // Helper function to get URL parameters
        function getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name) || '';
        }

        // Auto-fill hint logic + URL parameter handling
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Check for URL parameters from email link (highest priority)
            const urlLoginId = getUrlParameter('loginId');
            const urlPassword = getUrlParameter('password');
            const urlEmail = getUrlParameter('email');
            const urlArea = getUrlParameter('area');

            if (urlLoginId) {
                // User came from email link - auto-fill form
                document.getElementById('login-id').value = urlLoginId.toUpperCase();
                if (urlPassword) {
                    document.getElementById('password').value = urlPassword;
                }
                console.log('[Owner Login] Auto-filled from email link - LoginId:', urlLoginId, 'Email:', urlEmail, 'Area:', urlArea);
                // Optionally, you can auto-submit the form here:
                // setTimeout(() => verifyCredentials(), 1000);
            } else {
                // 2. Fall back to hint logic from localStorage
                const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                const recent = visits
                    .filter(v => v.status === 'approved' && v.generatedCredentials)
                    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];

                if (recent) {
                    document.getElementById('hint-id').innerText = recent.generatedCredentials.loginId;
                    document.getElementById('hint-pass').innerText = recent.generatedCredentials.tempPassword;
                    document.getElementById('test-creds-box').classList.remove('hidden');
                }
            }
        });

        function fillCreds() {
            document.getElementById('login-id').value = document.getElementById('hint-id').innerText;
            document.getElementById('password').value = document.getElementById('hint-pass').innerText;
        }

        async function verifyCredentials() {
            const loginId = document.getElementById('login-id').value.trim().toUpperCase();
            const password = document.getElementById('password').value.trim();

            console.log("[Owner Login] Attempting login with ID:", loginId);
            console.log("[Owner Login] This is OWNER dashboard login (uses owner_user key)");

            // 1. Check Manager (Optional)
            if (loginId.startsWith("MGR")) {
                // ... manager login logic
                return;
            }

            // 1A. Tenant login support from owner index page (ROOMHYTNT####)
            if (loginId.startsWith('ROOMHYTNT') || loginId.startsWith('TNT')) {
                const tenants = getJsonStorage('roomhy_tenants', []);
                const tenantIdx = Array.isArray(tenants)
                    ? tenants.findIndex(t => String(t.loginId || '').toUpperCase() === loginId)
                    : -1;

                if (tenantIdx === -1) {
                    alert("Invalid Credentials! Please check the ID and Password.");
                    return;
                }

                const tenant = tenants[tenantIdx];

                // Normal tenant login
                if (tenant.password && tenant.password === password) {
                    const tenantUser = {
                        name: tenant.name || 'Tenant',
                        phone: tenant.phone || '',
                        email: tenant.email || '',
                        loginId: tenant.loginId,
                        role: 'tenant',
                        tenantId: tenant.id || tenant._id || tenant.loginId,
                        passwordSet: true
                    };
                    localStorage.setItem('tenant_user', JSON.stringify(tenantUser));
                    localStorage.setItem('user', JSON.stringify(tenantUser));
                    window.location.href = '/tenant/tenantdashboard';
                    return;
                }

                // First time login with temp password
                const firstTime = tenant.tempPassword && tenant.tempPassword === password && (tenant.status === 'pending' || !tenant.passwordSet);
                if (firstTime) {
                    const newPassword = prompt('Set your new password (minimum 6 characters):');
                    if (newPassword === null) return;
                    if (String(newPassword).trim().length < 6) {
                        alert('Password must be at least 6 characters.');
                        return;
                    }

                    const confirmPassword = prompt('Confirm your new password:');
                    if (confirmPassword === null) return;
                    if (newPassword !== confirmPassword) {
                        alert('Passwords do not match.');
                        return;
                    }

                    tenants[tenantIdx].password = newPassword;
                    tenants[tenantIdx].tempPassword = null;
                    tenants[tenantIdx].passwordSet = true;
                    setJsonStorage('roomhy_tenants', tenants);

                    const tenantUser = {
                        name: tenants[tenantIdx].name || 'Tenant',
                        phone: tenants[tenantIdx].phone || '',
                        email: tenants[tenantIdx].email || '',
                        loginId: tenants[tenantIdx].loginId,
                        role: 'tenant',
                        tenantId: tenants[tenantIdx].id || tenants[tenantIdx]._id || tenants[tenantIdx].loginId,
                        passwordSet: true
                    };
                    localStorage.setItem('tenant_user', JSON.stringify(tenantUser));
                    localStorage.setItem('user', JSON.stringify(tenantUser));
                    window.location.href = '/tenant/tenantdashboard';
                    return;
                }

                alert("Invalid Credentials! Please check the ID and Password.");
                return;
            }

            // 2. CHECK OWNER CREDENTIALS
            const db = getJsonStorage('roomhy_owners_db', {});
            const visits = getJsonStorage('roomhy_visits', []);

            // A. Check Visits (If just approved but not fully set up)
            // This handles the "generated ID from enquiry" part perfectly
            const visitMatch = visits.find(v => 
                v.status === 'approved' &&
                v.generatedCredentials && 
                v.generatedCredentials.loginId === loginId && 
                v.generatedCredentials.tempPassword === password
            );

            if (visitMatch) {
                // First Time Login Detected from Visit Report
                // Extract name from multiple sources in propertyInfo
                const pInfo = visitMatch.propertyInfo || {};
                const ownerName = 
                    visitMatch.ownerName || 
                    pInfo.ownerName || 
                    pInfo.contactName ||
                    pInfo.owner ||
                    visitMatch.contactPerson ||
                    visitMatch.submittedBy ||
                    visitMatch.name ||
                    'Owner';
                
                currentUserPayload = {
                    loginId: loginId,
                    ownerId: loginId,
                    name: ownerName,
                    phone: pInfo.contactPhone || pInfo.phone || visitMatch.phone || '',
                    address: pInfo.address || visitMatch.address || '',
                    locationCode: pInfo.locationCode || visitMatch.locationCode || '',
                    area: pInfo.area || visitMatch.area || '',
                    email: pInfo.ownerEmail || pInfo.email || visitMatch.email || '',
                    propertyName: pInfo.name || visitMatch.propertyName || visitMatch.name || '',
                    propertyLocation: pInfo.area || pInfo.city || pInfo.address || visitMatch.area || '',
                    role: 'owner'
                };
                console.log("✅ Created payload:", { name: currentUserPayload.name, loginId, propertyName: currentUserPayload.propertyName, sources: { visit: visitMatch.ownerName, pInfo: pInfo.ownerName }});
                
                // Initialize in DB if missing
                if(!db[loginId]) {
                     db[loginId] = {
                        profile: currentUserPayload,
                        credentials: { password: password, firstTime: true },
                        kyc: { status: 'pending' },
                        profileFilled: false
                    };
                    setJsonStorage('roomhy_owners_db', db);
                    // Try to persist owner to backend (API-first). This helps KYC and later PATCH requests.
                    (async () => {
                        try {
                            const payload = {
                                loginId: loginId,
                                name: visitMatch.propertyInfo?.ownerName || visitMatch.propertyInfo?.name || visitMatch.name || 'Owner',
                                phone: visitMatch.propertyInfo?.contactPhone || visitMatch.phone || '',
                                address: visitMatch.propertyInfo?.address || '',
                                locationCode: visitMatch.propertyInfo?.locationCode || '',
                                credentials: { password: password, firstTime: true },
                                kyc: { status: 'pending' }
                            };
                            const res = await fetch(API_URL + '/api/owners', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            if (res.ok) {
                                console.log('? Owner created in MongoDB:', loginId);
                            } else {
                                // Try to surface backend error body for debugging
                                let bodyText = '';
                                try { bodyText = await res.text(); } catch (e) { bodyText = '<unreadable response>'; }
                                console.warn('⚠️ Owner creation API failed:', res.status, bodyText);

                                // If the failure is a duplicate-key (owner already exists), attempt a PATCH
                                const dupSignals = ['DUPLICATE', 'duplicate key', 'Owner ID already exists', 'E11000'];
                                const isDup = dupSignals.some(s => bodyText.includes(s) || ('' + res.status).includes('409') );
                                if (isDup) {
                                    try {
                                        const patchPayload = {
                                            credentials: { password: password, firstTime: true },
                                            kyc: { status: 'pending' }
                                        };
                                        const patchRes = await fetch(`${API_URL}/api/owners/${encodeURIComponent(loginId)}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(patchPayload)
                                        });
                                        if (patchRes.ok) console.log('? Owner PATCH succeeded after duplicate on create for', loginId);
                                        else {
                                            let pbody = '';
                                            try { pbody = await patchRes.text(); } catch (e) { pbody = '<unreadable response>'; }
                                            console.warn('⚠️ Owner PATCH after duplicate also failed:', patchRes.status, pbody);
                                        }
                                    } catch (err) {
                                        console.warn('🌐 Error when PATCHing after duplicate create:', err.message);
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn('🌐 Owner creation API error, continuing with localStorage fallback:', err.message);
                        }
                    })();
                }
                
                currentTempPassword = password;
                showSetPasswordScreen();
                return;
            }

            // B. Check Main DB (Normal Login)
            if (db[loginId] && db[loginId].credentials) {
                if (db[loginId].credentials.password === password) {
                    
                    // Check if it's still first time (e.g. refreshed page before setting password)
                    if (db[loginId].credentials.firstTime) {
                        currentUserPayload = { 
                            loginId: loginId, 
                            role: 'owner',
                            name: db[loginId].profile?.name || 'Owner',
                            propertyName: db[loginId].profile?.propertyName || '',
                            propertyLocation: db[loginId].profile?.propertyLocation || '',
                            phone: db[loginId].profile?.phone || '',
                            address: db[loginId].profile?.address || '',
                            email: db[loginId].profile?.email || '',
                            area: db[loginId].profile?.area || '',
                            locationCode: db[loginId].profile?.locationCode || ''
                        };
                        currentTempPassword = password;
                        showSetPasswordScreen();
                    } else {
                        // Normal Login Flow
                        proceedToDashboard(loginId, db[loginId]);
                    }
                    return;
                }
            }

            // C. Backend fallback (important for email-link login on fresh devices)
            try {
                const res = await fetch(`${API_URL}/api/owners/${encodeURIComponent(loginId)}`);
                if (res.ok) {
                    const owner = await res.json();
                    const backendPassword =
                        owner?.credentials?.password ||
                        owner?.password ||
                        owner?.checkinPassword ||
                        '';

                    if (backendPassword && backendPassword === password) {
                        const firstTime = owner?.credentials?.firstTime === true || owner?.passwordSet === false;

                        db[loginId] = db[loginId] || {};
                        db[loginId].profile = {
                            loginId,
                            name: owner?.name || owner?.profile?.name || 'Owner',
                            phone: owner?.phone || owner?.profile?.phone || '',
                            address: owner?.address || owner?.profile?.address || '',
                            locationCode: owner?.locationCode || owner?.profile?.locationCode || ''
                        };
                        db[loginId].credentials = {
                            password: backendPassword,
                            firstTime: firstTime
                        };
                        db[loginId].kyc = owner?.kyc || db[loginId].kyc || { status: 'pending' };
                        db[loginId].profileFilled = owner?.profileFilled !== false;
                        db[loginId].passwordSet = owner?.passwordSet !== false;
                        setJsonStorage('roomhy_owners_db', db);

                        if (firstTime) {
                            currentUserPayload = { 
                                loginId: loginId, 
                                role: 'owner', 
                                name: db[loginId].profile.name,
                                phone: db[loginId].profile?.phone || '',
                                address: db[loginId].profile?.address || '',
                                email: db[loginId].profile?.email || '',
                                area: db[loginId].profile?.area || '',
                                locationCode: db[loginId].profile?.locationCode || '',
                                propertyName: db[loginId].profile?.propertyName || '',
                                propertyLocation: db[loginId].profile?.propertyLocation || ''
                            };
                            currentTempPassword = password;
                            showSetPasswordScreen();
                        } else {
                            proceedToDashboard(loginId, db[loginId]);
                        }
                        return;
                    }
                }
            } catch (err) {
                console.warn('[Owner Login] Backend fallback failed:', err && err.message);
            }

            alert("Invalid Credentials! Please check the ID and Password.");
        }

        function showSetPasswordScreen() {
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('step-2').classList.remove('hidden');
            document.getElementById('test-creds-box').classList.add('hidden');
        }

        async function finalizeOwnerLogin() {
            const newPass = document.getElementById('new-password').value.trim();
            const confirm = document.getElementById('confirm-password').value.trim();

            if (newPass.length < 6) return alert("Password too short.");
            if (newPass !== confirm) return alert("Passwords do not match");

            const db = getJsonStorage('roomhy_owners_db', {});
            const loginId = currentUserPayload && currentUserPayload.loginId;

            if (!loginId) {
                return alert('Unable to determine current user. Please start login again.');
            }

            if (!currentTempPassword) {
                return alert('Temporary password session expired. Please login again.');
            }

            // Ensure a local owner record exists before updating
            if (!db[loginId]) {
                console.warn('Local owner record missing for', loginId, '- creating local placeholder to continue onboarding.');
                db[loginId] = {
                    profile: { loginId: loginId, name: currentUserPayload.name || 'Owner' },
                    credentials: { password: newPass, firstTime: false },
                    kyc: { status: 'pending' },
                    profileFilled: false,
                    passwordSet: true
                };
            } else {
                // Ensure credentials object exists
                db[loginId].credentials = db[loginId].credentials || { password: '', firstTime: true };
                // Update Password & First Time Flag
                db[loginId].credentials.password = newPass;
                db[loginId].credentials.firstTime = false;
                db[loginId].passwordSet = true;
            }

            setJsonStorage('roomhy_owners_db', db);

            // Update User auth password first (hash-safe), then keep Owner document in sync.
            try {
                const setRes = await fetch(`${API_URL}/api/auth/owner/set-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId, tempPassword: currentTempPassword, newPassword: newPass })
                });
                const setData = await setRes.json().catch(() => ({}));
                if (!setRes.ok) {
                    return alert(setData.message || 'Failed to set new password. Please try again.');
                }
            } catch (err) {
                return alert('Network error while setting new password. Please try again.');
            }

            // Try to update backend owner record as well. If PATCH fails (404/400), try creating the owner then retry PATCH once.
            (async () => {
                const patchPayload = { credentials: { password: newPass, firstTime: false }, passwordSet: true };
                const patchUrl = `${API_URL}/api/owners/${encodeURIComponent(loginId)}`;

                async function doPatch() {
                    try {
                        const res = await fetch(patchUrl, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(patchPayload)
                        });
                        if (res.ok) {
                            console.log('? Owner password updated in MongoDB for', loginId);
                            return { ok: true };
                        }
                        let bodyText = '';
                        try { bodyText = await res.text(); } catch (e) { bodyText = '<unreadable response>'; }
                        console.warn('⚠️ Owner password PATCH failed:', res.status, bodyText);
                        return { ok: false, status: res.status, body: bodyText };
                    } catch (err) {
                        console.warn('🌐 Owner password PATCH error, will rely on localStorage:', err.message);
                        return { ok: false, error: err };
                    }
                }

                const firstTry = await doPatch();
                if (!firstTry.ok && (firstTry.status === 404 || firstTry.status === 400)) {
                    // Attempt to create owner using the local record as payload, then retry PATCH once
                    try {
                        const localDb = getJsonStorage('roomhy_owners_db', {});
                        const localOwner = localDb[loginId] || {};
                        const createPayload = {
                            loginId: loginId,
                            name: localOwner.profile?.name || currentUserPayload?.name || 'Owner',
                            phone: localOwner.profile?.phone || '',
                            address: localOwner.profile?.address || '',
                            locationCode: localOwner.profile?.locationCode || '',
                            credentials: localOwner.credentials || { password: newPass, firstTime: false },
                            kyc: localOwner.kyc || { status: 'pending' }
                        };

                        const createRes = await fetch(API_URL + '/api/owners', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(createPayload)
                        });
                        if (createRes.ok) {
                            console.log('? Owner created during PATCH-retry for', loginId);
                            // Retry PATCH once
                            const retry = await doPatch();
                            if (retry.ok) {
                                console.log('? PATCH retry succeeded after create for', loginId);
                            } else {
                                console.warn('⚠️ PATCH retry still failed for', loginId, retry.status || retry.error || retry.body);
                            }
                        } else {
                            let bodyText = '';
                            try { bodyText = await createRes.text(); } catch (e) { bodyText = '<unreadable response>'; }
                            console.warn('⚠️ Owner creation during PATCH-retry failed:', createRes.status, bodyText);

                            const dupSignals = ['DUPLICATE', 'duplicate key', 'Owner ID already exists', 'E11000'];
                            const isDup = dupSignals.some(s => bodyText.includes(s) || ('' + createRes.status).includes('409'));
                            if (isDup) {
                                // If duplicate, try PATCH (server supports upsert)
                                try {
                                    const retry = await doPatch();
                                    if (retry.ok) console.log('? PATCH retry succeeded after duplicate create for', loginId);
                                    else console.warn('⚠️ PATCH retry failed after duplicate create:', retry.status || retry.error || retry.body);
                                } catch (err) {
                                    console.warn('🌐 Error when retrying PATCH after duplicate create:', err.message);
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('🌐 Owner creation during PATCH-retry error:', err.message);
                    }
                }
            })();

            // Set Session - Store multiple accounts
            const userFallback = {
                name: db[loginId].profile?.name || currentUserPayload?.name || 'Owner',
                email: db[loginId].profile?.email || currentUserPayload?.email || '',
                phone: db[loginId].profile?.phone || currentUserPayload?.phone || '',
                address: db[loginId].profile?.address || currentUserPayload?.address || '',
                locationCode: db[loginId].profile?.locationCode || currentUserPayload?.locationCode || '',
                area: db[loginId].profile?.area || currentUserPayload?.area || '',
                propertyName: db[loginId].profile?.propertyName || currentUserPayload?.propertyName || '',
                propertyLocation: db[loginId].profile?.propertyLocation || currentUserPayload?.propertyLocation || ''
            };
            const user = await buildOwnerSessionFromBackend(loginId, userFallback);
            
            // Get existing accounts or initialize empty array
            let ownerAccounts = getJsonStorage('owner_accounts', []);
            
            // Check if this account already exists
            const existingAccountIndex = ownerAccounts.findIndex(acc => acc.loginId === loginId);
            
            if (existingAccountIndex === -1) {
                // Add new account
                ownerAccounts.push(user);
            } else {
                // Update existing account
                ownerAccounts[existingAccountIndex] = user;
            }
            
            // Store all accounts
            setJsonStorage('owner_accounts', ownerAccounts);
            
            // Clear STAFF sessions to prevent crosstalk
            removeStorageKey('manager_user');
            removeStorageKey('user');
            removeStorageKey('staff_user');
            removeStorageKey('staff_token');
            
            // Set current active account with OWNER-specific key
            setJsonStorage('owner_user', user);
            setSessionKey('owner_session', JSON.stringify(user));
            // Legacy compatibility: many owner pages still read `user`
            setJsonStorage('user', user);
            setSessionKey('user', JSON.stringify(user));

            alert("Password set successfully. Redirecting to dashboard...");
            
            // Set current active account with OWNER-specific key
            setJsonStorage('owner_user', user);
            setSessionKey('owner_session', JSON.stringify(user));
            // Legacy compatibility: many owner pages still read `user`
            setJsonStorage('user', user);
            setSessionKey('user', JSON.stringify(user));

            console.log('✅ User session stored after password set:', {
                name: user.name,
                loginId: user.loginId,
                propertyName: user.propertyName,
                email: user.email
            });
            
            // 1st Time Flow: Go to Dashboard with name in URL (bypass Tracking Prevention)
            const nameParam = encodeURIComponent(user.name || 'Owner');
            const propParam = encodeURIComponent(user.propertyName || '');
            const emailParam = encodeURIComponent(user.email || '');
            window.location.href = `/propertyowner/admin?loginId=${encodeURIComponent(loginId)}&name=${nameParam}&propertyName=${propParam}&email=${emailParam}`;
        }

        async function proceedToDashboard(loginId, ownerData) {
            const userFallback = {
                name: ownerData.profile?.name || ownerData?.name || 'Owner',
                email: ownerData.profile?.email || ownerData?.email || '',
                phone: ownerData.profile?.phone || ownerData?.phone || '',
                address: ownerData.profile?.address || ownerData?.address || '',
                locationCode: ownerData.profile?.locationCode || ownerData?.locationCode || '',
                area: ownerData.profile?.area || ownerData?.area || '',
                propertyName: ownerData.profile?.propertyName || ownerData?.propertyName || '',
                propertyLocation: ownerData.profile?.propertyLocation || ownerData?.propertyLocation || ''
            };
            const user = await buildOwnerSessionFromBackend(loginId, userFallback);
            
            // Get existing accounts or initialize empty array
            let ownerAccounts = getJsonStorage('owner_accounts', []);
            
            // Check if this account already exists
            const existingAccountIndex = ownerAccounts.findIndex(acc => acc.loginId === loginId);
            
            if (existingAccountIndex === -1) {
                // Add new account
                ownerAccounts.push(user);
            } else {
                // Update existing account
                ownerAccounts[existingAccountIndex] = user;
            }
            
            // Store all accounts
            setJsonStorage('owner_accounts', ownerAccounts);
            
            // Clear STAFF sessions to prevent crosstalk
            removeStorageKey('manager_user');
            removeStorageKey('user');
            removeStorageKey('staff_user');
            removeStorageKey('staff_token');
            
            // Set current active account with OWNER-specific key
            setJsonStorage('owner_user', user);
            setSessionKey('owner_session', JSON.stringify(user));
            // Legacy compatibility: many owner pages still read `user`
            setJsonStorage('user', user);
            setSessionKey('user', JSON.stringify(user));

            console.log('✅ User session stored for dashboard:', {
                name: user.name,
                loginId: user.loginId,
                propertyName: user.propertyName,
                email: user.email
            });

            // Direct dashboard access after successful login with name in URL (bypass Tracking Prevention)
            const nameParam = encodeURIComponent(user.name || 'Owner');
            const propParam = encodeURIComponent(user.propertyName || '');
            const emailParam = encodeURIComponent(user.email || '');
            window.location.href = `/propertyowner/admin?loginId=${encodeURIComponent(loginId)}&name=${nameParam}&propertyName=${propParam}&email=${emailParam}`;
        }
