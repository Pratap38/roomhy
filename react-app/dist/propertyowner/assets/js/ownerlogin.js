lucide.createIcons();
        let currentUserPayload = null;

        // --- 1. LOAD TEST CREDENTIALS FROM ENQUIRY/DB ---
        document.addEventListener('DOMContentLoaded', () => {
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            
            // Find the MOST RECENT approved visit with generated credentials
            const recent = visits
                .filter(v => v.status === 'approved' && v.generatedCredentials)
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];

            if (recent) {
                document.getElementById('hint-id').innerText = recent.generatedCredentials.loginId;
                document.getElementById('hint-pass').innerText = recent.generatedCredentials.tempPassword;
                document.getElementById('test-creds-box').classList.remove('hidden');
            } else {
                // Fallback: Seed a test user if nothing exists (for pure testing)
                seedTestUser();
            }
        });

        function seedTestUser() {
             // If no real enquiry data exists, show the static test user
             document.getElementById('hint-id').innerText = 'TEST01';
             document.getElementById('hint-pass').innerText = 'temp123';
             document.getElementById('test-creds-box').classList.remove('hidden');

             // Ensure TEST01 exists in DB so it works
             const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
             if (!db['TEST01']) {
                 db['TEST01'] = {
                     profile: { name: 'Test Owner', email: 'test@roomhy.com' },
                     credentials: { password: 'temp123', firstTime: true },
                     kyc: { status: 'pending' }
                 };
                 localStorage.setItem('roomhy_owners_db', JSON.stringify(db));
             }
        }

        function fillCreds() {
            document.getElementById('login-id').value = document.getElementById('hint-id').innerText;
            document.getElementById('password').value = document.getElementById('hint-pass').innerText;
        }

        async function verifyCredentials() {
            const loginId = document.getElementById('login-id').value.trim().toUpperCase();
            const password = document.getElementById('password').value.trim();

            console.log("Login attempt:", { loginId, password });

            // 1. MANAGER LOGIN
            if (loginId.startsWith("MGR")) {
                const managers = JSON.parse(localStorage.getItem('roomhy_areamanagers_db') || '[]');
                const manager = managers.find(m => m.loginId === loginId && m.password === password);
                if (manager) {
                    localStorage.setItem('manager_user', JSON.stringify(manager));
                    window.location.href = '../superadmin/area/propertyowner/admin'; 
                    return;
                }
            }

            // 2. OWNER LOGIN CHECK
            const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');

            // PRIORITY 1: Check Visits (For newly approved enquiries via Enquiry.html)
            const visitMatch = visits.find(v => 
                v.status === 'approved' &&
                v.generatedCredentials && 
                v.generatedCredentials.loginId === loginId && 
                v.generatedCredentials.tempPassword === password
            );

            if (visitMatch) {
                console.log("✅ Match found in Visits DB (First Time Login)");
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
                    role: 'owner'
                };
                console.log("✅ Created payload:", { name: currentUserPayload.name, loginId, sources: { visit: visitMatch.ownerName, pInfo: pInfo.ownerName }});
                
                // Ensure entry exists in Owners DB for future use
                if(!db[loginId]) {
                     db[loginId] = {
                        profile: currentUserPayload,
                        credentials: { password: password, firstTime: true },
                        kyc: { status: 'pending' }
                    };
                    localStorage.setItem('roomhy_owners_db', JSON.stringify(db));
                }

                showSetPasswordScreen();
                return;
            }

            // PRIORITY 2: Check Main Owner DB
            if (db[loginId] && db[loginId].credentials) {
                const storedPass = db[loginId].credentials.password;
                const isFirstTime = db[loginId].credentials.firstTime;

                if (storedPass === password) {
                    if (isFirstTime) {
                        // First time login from DB record
                        currentUserPayload = { loginId: loginId, ...db[loginId].profile, role: 'owner' };
                        showSetPasswordScreen();
                    } else {
                        // Normal Login (Password already set)
                        proceedToDashboard(loginId, db[loginId]);
                    }
                    return;
                }
            }

            alert("Invalid Credentials! Please check the ID and Password.");
        }

        function showSetPasswordScreen() {
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('step-2').classList.remove('hidden');
            document.getElementById('test-creds-box').classList.add('hidden'); // Hide hint box
        }

        async function buildOwnerSessionFromBackend(loginId, fallback = {}) {
            const normalizedLoginId = String(loginId || '').trim().toUpperCase();
            const base = {
                loginId: normalizedLoginId,
                ownerId: normalizedLoginId,
                role: 'owner',
                name: fallback.name || 'Owner'
            };
            if (!normalizedLoginId) return base;
            try {
                const res = await fetch(`${API_URL}/api/owners/${encodeURIComponent(normalizedLoginId)}`);
                if (!res.ok) return base;
                const owner = await res.json();
                return {
                    ...base,
                    name: owner?.name || owner?.profile?.name || base.name,
                    email: owner?.email || owner?.profile?.email || '',
                    phone: owner?.phone || owner?.profile?.phone || '',
                    locationCode: owner?.locationCode || owner?.profile?.locationCode || '',
                    area: owner?.checkinArea || owner?.area || ''
                };
            } catch (_) {
                return base;
            }
        }

        async function proceedToDashboard(loginId, ownerData) {
            const user = await buildOwnerSessionFromBackend(loginId, ownerData.profile || {});
            
            // Set Session - store in both keys to avoid conflicts with staff/admin logins
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('ownerUser', JSON.stringify(user));
            localStorage.setItem('owner_user', JSON.stringify(user));
            sessionStorage.setItem('owner_session', JSON.stringify(user));
            sessionStorage.setItem('user', JSON.stringify(user));

            // Check Onboarding Status
            const hasProfile = ownerData.profileFilled;
            const kycStatus = ownerData.kyc ? ownerData.kyc.status : 'pending';

            if (!hasProfile) {
                window.location.href = '/propertyowner/ownerprofile';
            } else if (kycStatus === 'pending') {
                window.location.href = '/digital-checkin/ownerkyc';
            } else {
                window.location.href = '/propertyowner/admin';
            }
        }

        // Finalize: Set Password -> Go to Profile
        async function finalizeOwnerLogin() {
            const newPass = document.getElementById('new-password').value.trim();
            const confirm = document.getElementById('confirm-password').value.trim();

            if (newPass.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }
            if (newPass !== confirm) {
                alert("Passwords do not match");
                return;
            }

            const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
            const loginId = currentUserPayload.loginId;
            
            // Update DB
            if (!db[loginId]) db[loginId] = { profile: currentUserPayload, credentials: {}, kyc: { status: 'pending' } };
            
            db[loginId].credentials.password = newPass;
            db[loginId].credentials.firstTime = false;
            db[loginId].passwordSet = true;
            
            localStorage.setItem('roomhy_owners_db', JSON.stringify(db));

            // Set Session & Redirect
            const user = await buildOwnerSessionFromBackend(loginId, currentUserPayload || {});
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('ownerUser', JSON.stringify(user));
            localStorage.setItem('owner_user', JSON.stringify(user));
            sessionStorage.setItem('owner_session', JSON.stringify(user));
            sessionStorage.setItem('user', JSON.stringify(user));

            alert("🎉 Password Set Successfully! Proceeding to Profile Setup...");
            window.location.href = '/propertyowner/ownerprofile';
        }