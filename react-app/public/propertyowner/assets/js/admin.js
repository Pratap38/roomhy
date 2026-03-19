lucide.createIcons();

        // 1. Load User Profile & Data (with onboarding enforcement)
        document.addEventListener('DOMContentLoaded', async () => {
            const user = window.__ownerContext
                || safeReadJson((() => { try { return sessionStorage.getItem('owner_session'); } catch(e) { return null; } })())
                || safeReadJson((() => { try { return localStorage.getItem('owner_user'); } catch(e) { return null; } })())
                || null;

            if (!user || user.role !== 'owner') {
                // Should have been caught by the script in head, but as a fallback:
                console.log("Demo Mode: No owner logged in or role mismatch");
                return;
            }

            // Try to fetch owner record from backend first to use MongoDB Atlas as source-of-truth
            let ownerRecord = null;
            try {
                const res = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}`);
                if (res.ok) {
                    ownerRecord = await res.json();
                } else {
                    console.warn('Owner fetch returned', res.status);
                }
            } catch (err) {
                console.warn('Owner fetch failed, will fallback to localStorage', err);
            }

            // If backend didn't return owner data, fallback to localStorage
            if (!ownerRecord) {
                const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                ownerRecord = db[user.loginId] || {};
            }

            // Polling fallback: if KYC incomplete, periodically refresh owner data
            let __dashboardPoll = null;
            function startDashboardPolling(intervalMs = 10000) {
                if (!user || !user.loginId) return;
                if (__dashboardPoll) return;
                __dashboardPoll = setInterval(async () => {
                    try {
                        const res = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}`);
                        if (res.ok) {
                            const fresh = await res.json();
                            const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                            db[user.loginId] = db[user.loginId] || {};
                            db[user.loginId].kyc = fresh.kyc || db[user.loginId].kyc;
                            db[user.loginId].profileFilled = db[user.loginId].profileFilled || !!fresh.profileFilled;
                            localStorage.setItem('roomhy_owners_db', JSON.stringify(db));
                            if (fresh.kyc && (fresh.kyc.status === 'submitted' || fresh.kyc.status === 'verified')) {
                                try { localStorage.setItem('owner_kyc_updated', JSON.stringify({ loginId: user.loginId, ts: Date.now() })); } catch (e) {}
                                clearInterval(__dashboardPoll); __dashboardPoll = null;
                            }
                        }
                    } catch (e) { /* ignore */ }
                }, intervalMs);
            }

            // If KYC incomplete, start polling to pick up admin verification
            const curKyc = ownerRecord.kyc?.status || 'pending';
            if (!(curKyc === 'submitted' || curKyc === 'verified')) startDashboardPolling();

            // Listen for external KYC updates (from superadmin) and refresh owner record
            window.addEventListener('storage', async (ev) => {
                if (ev.key === 'owner_kyc_updated') {
                    try {
                        const payload = JSON.parse(ev.newValue || '{}');
                        if (payload && payload.loginId === user.loginId) {
                            console.log('Detected KYC update for current owner, refreshing owner data...');
                            try {
                                const fres = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}`);
                                if (fres.ok) {
                                    const freshOwner = await fres.json();
                                    // Update local view and storage
                                    const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                                    db[user.loginId] = db[user.loginId] || {};
                                    db[user.loginId].kyc = freshOwner.kyc || db[user.loginId].kyc;
                                    db[user.loginId].profileFilled = db[user.loginId].profileFilled || !!freshOwner.profileFilled;
                                    localStorage.setItem('roomhy_owners_db', JSON.stringify(db));

                                    // If KYC now allows access, do nothing; if not, existing checks will handle it.
                                    console.log('Owner data refreshed after KYC update.');
                                }
                            } catch (e) { console.warn('Failed to refresh owner after storage event', e && e.message); }
                        }
                    } catch (e) { /* ignore parse errors */ }
                }
            });

            const profile = ownerRecord.profile || {};
            const kycStatus = ownerRecord.kyc ? ownerRecord.kyc.status : 'pending';

            // Respect canonical localStorage flags (set by KYC flow) to avoid brief backend/local races
            const localKycDone = localStorage.getItem('kycCompleted') === 'true';
            const localProfileDone = localStorage.getItem('ownerProfileCompleted') === 'true';

            // Check profile completion (consider backend OR local flag)
            const hasProfileFlag = ownerRecord.profileFilled === true || localProfileDone === true;
            const hasProfileFields = profile.name && profile.email && profile.address;
            const profileIncomplete = !hasProfileFlag && !hasProfileFields;

            if (profileIncomplete) {
                console.warn('Profile incomplete, staying on dashboard (profile setup page not present in propertyowner module)');
            }

            // KYC: allow dashboard if backend says submitted/verified OR local flag is set
            const kycDone = (kycStatus === 'submitted' || kycStatus === 'verified') || localKycDone;
            if (!kycDone) {
                console.warn('KYC incomplete, staying on dashboard (KYC page not present in propertyowner module)');
            }

            // Show name (prefer backend owner record; fallback to approved visits if owner profile is sparse)
            let displayName = (profile.name) || ownerRecord.name || ownerRecord.ownerName || user.name || 'Owner';
            if (!displayName || displayName === 'Owner') {
                try {
                    const vr = await fetch(`${API_BASE}/api/visits/approved`);
                    if (vr.ok) {
                        const vd = await vr.json();
                        const visits = vd.visits || [];
                        const match = visits.find(v => {
                            const gid = (v.generatedCredentials && v.generatedCredentials.loginId) || '';
                            return String(gid).toUpperCase() === String(user.loginId || '').toUpperCase();
                        });
                        if (match) {
                            displayName = match.ownerName
                                || (match.propertyInfo && match.propertyInfo.ownerName)
                                || (match.propertyInfo && match.propertyInfo.name)
                                || displayName;
                        }
                    }
                } catch (_) {}
            }
            applyOwnerHeader({ ...user, name: displayName });

            // Fetch properties from backend (new endpoint). If unavailable, fallback to localStorage.
            let myProperties = [];
            try {
                const propRes = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}/properties`);
                if (propRes.ok) {
                    const payload = await propRes.json();
                    myProperties = payload.properties || [];
                } else {
                    console.warn('Properties fetch returned', propRes.status);
                }
            } catch (err) {
                console.warn('Properties fetch failed, falling back to localStorage', err);
            }
            if (!myProperties || myProperties.length === 0) {
                try {
                    const allProps = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                    const ownerId = user.ownerId || user.loginId;
                    myProperties = allProps.filter(p => p.ownerId === ownerId);
                } catch (e) {
                    myProperties = [];
                }
            }

            // Fetch rent collected (sum of paidAmount from all accepted/approved enquiries or from /api/owners/:id/rent)
            let rentCollected = 0;
            try {
                const rentRes = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}/rent`);
                if (rentRes.ok) {
                    const rentData = await rentRes.json();
                    rentCollected = rentData.totalRent || 0;
                }
            } catch (e) {
                // fallback: sum paidAmount from accepted/approved enquiries
                try {
                    const enqRes = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}/enquiries`);
                    if (enqRes.ok) {
                        const enqList = await enqRes.json();
                        rentCollected = enqList.filter(e => (e.status === 'accepted' || e.status === 'approved') && e.paidAmount)
                            .reduce((sum, e) => sum + (e.paidAmount || 0), 0);
                    }
                } catch (e) {}
            }
            document.getElementById('statRent').innerText = `\u20B9${rentCollected.toLocaleString()}`;

            // Fetch rooms from backend (new endpoint). If unavailable, fallback to localStorage.
            let myRooms = [];
            try {
                const roomsRes = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(user.loginId)}/rooms`);
                if (roomsRes.ok) {
                    const payload = await roomsRes.json();
                    myRooms = payload.rooms || [];
                } else {
                    console.warn('Rooms fetch returned', roomsRes.status);
                }
            } catch (err) {
                console.warn('Rooms fetch failed, falling back to localStorage', err);
            }
            if (!myRooms || myRooms.length === 0) {
                try {
                    const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
                    const ownerId = user.ownerId || user.loginId;
                    myRooms = allRooms.filter(r => r.ownerId === ownerId);
                } catch (e) {
                    myRooms = [];
                }
            }
            document.getElementById('statRooms').innerText = myRooms.length;

            // tenant count: backend rooms use numeric 'beds' field; localStorage used arrays.
            let tenantCount = 0;
            myRooms.forEach(r => {
                if (Array.isArray(r.beds)) {
                    tenantCount += r.beds.filter(b => b.tenant).length;
                } else if (typeof r.beds === 'number') {
                    tenantCount += r.beds;
                }
            });
            document.getElementById('statTenants').innerText = tenantCount;

            // ===== LOAD COMMISSION DATA =====
            await loadCommissionData();
        });

        // Load and display commission data
        async function loadCommissionData() {
            try {
                console.log('📡 Loading commission data...');
                
                // Determine API URL based on environment
                const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:5001'
                    : 'https://api.roomhy.com';

                const response = await fetch(`${apiUrl}/api/rents`);
                if (!response.ok) {
                    console.warn('⚠️ Commission API returned:', response.status);
                    // Use fallback values
                    displayCommissionCards(0, 10, 0);
                    return;
                }

                const responseData = await response.json();
                const paidData = responseData.rents || responseData;
                console.log('✅ Commission data received:', paidData.length);

                // Filter only completed/paid payments
                const paidPayments = paidData.filter(p => 
                    p.paymentStatus === 'completed' || 
                    p.paymentStatus === 'paid' || 
                    p.paidAmount > 0
                );

                console.log('✅ Paid payments:', paidPayments.length);

                // Calculate commissions
                const commissionStats = calculatePlatformCommissions(paidPayments);
                console.log('✅ Commission stats:', commissionStats);

                // Display the data
                displayCommissionCards(
                    commissionStats.totalPlatformRevenue,
                    10, // Standard commission rate is always 10%
                    commissionStats.pendingPayouts
                );
            } catch (err) {
                console.warn('⚠️ Failed to load commission data:', err);
                // Use fallback values
                displayCommissionCards(0, 10, 0);
            }
        }

        // Render commission cards safely (some templates don't include dedicated ids)
        function displayCommissionCards(totalRevenue, commissionRate, pendingPayouts) {
            try {
                // Keep statRent as owner's rent collection value.
                // If a dedicated platform revenue element exists, update that instead.
                const platformRevenueEl = document.getElementById('statPlatformRevenue');
                if (platformRevenueEl) {
                    platformRevenueEl.innerText = `\u20B9${Number(totalRevenue || 0).toLocaleString()}`;
                }
            } catch (e) {
                console.warn('displayCommissionCards render warning:', e && e.message);
            }
        }

        // Calculate commission statistics
        function calculatePlatformCommissions(paidData) {
            // Sort payments by owner and creation date to properly identify first payments
            const ownerPayments = {};
            
            paidData.forEach(payment => {
                const ownerLoginId = payment.ownerLoginId || payment.owner_id;
                if (!ownerPayments[ownerLoginId]) {
                    ownerPayments[ownerLoginId] = [];
                }
                ownerPayments[ownerLoginId].push({
                    rentAmount: payment.rentAmount || 0,
                    createdAt: new Date(payment.createdAt || Date.now())
                });
            });

            // Sort payments by date for each owner
            Object.keys(ownerPayments).forEach(ownerId => {
                ownerPayments[ownerId].sort((a, b) => a.createdAt - b.createdAt);
            });

            // Calculate commissions
            const commissions = {};
            Object.entries(ownerPayments).forEach(([ownerLoginId, payments]) => {
                commissions[ownerLoginId] = {
                    totalRent: 0,
                    totalCommission: 0,
                    serviceFee: 0,
                    payout: 0
                };

                payments.forEach((payment, paymentIndex) => {
                    const rentAmount = payment.rentAmount;
                    
                    // First payment (index 0) gets 10% commission
                    const monthlyCommission = paymentIndex === 0 ? (rentAmount * 0.10) : 0;
                    const serviceFee = 50; // Always INR 50 per payment

                    commissions[ownerLoginId].totalRent += rentAmount;
                    commissions[ownerLoginId].totalCommission += monthlyCommission;
                    commissions[ownerLoginId].serviceFee += serviceFee;
                    commissions[ownerLoginId].payout = commissions[ownerLoginId].totalRent 
                        - commissions[ownerLoginId].totalCommission 
                        - commissions[ownerLoginId].serviceFee;
                });
            });

            // Calculate totals
            const stats = Object.values(commissions).reduce((acc, owner) => {
                acc.totalRent += owner.totalRent;
                acc.totalCommission += owner.totalCommission;
                acc.totalServiceFees += owner.serviceFee;
                acc.totalPayouts += owner.payout;
                return acc;
            }, {
                totalRent: 0,
                totalCommission: 0,
                totalServiceFees: 0,
                totalPayouts: 0
            });

            console.log('Commission Breakdown:');
            console.log('  Total Rent: INR ' + stats.totalRent);
            console.log('  Total Commission (10%): INR ' + stats.totalCommission);
            console.log('  Total Service Fees: INR ' + stats.totalServiceFees);
            console.log('  Platform Revenue: INR ' + (stats.totalCommission + stats.totalServiceFees));
            console.log('  Total Payouts: INR ' + stats.totalPayouts);

            return {
                totalPlatformRevenue: stats.totalCommission + stats.totalServiceFees,
                pendingPayouts: stats.totalPayouts,
                totalRent: stats.totalRent
            };
        }

        // Refresh statistics periodically
        setInterval(loadCommissionData, 30000); // Refresh every 30 seconds


        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '..//propertyowner/index';
        });

        // Owner Enquiries: Load from localStorage key 'owner_enquiries_<ownerId>'
        async function loadOwnerEnquiries() {
            try {
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                if (!user || !user.loginId) return;
                const ownerId = user.loginId;
                const res = await fetch(`${API_BASE}/api/owners/${encodeURIComponent(ownerId)}/enquiries`);
                const list = res.ok ? await res.json() : [];
                const container = document.getElementById('owner-enquiries-list');
                if (!container) return;
                // Update enquiry count
                const countSpan = document.getElementById('enquiry-count');
                if (countSpan) countSpan.textContent = `(${list.length})`;
                if (!list.length) { container.innerHTML = '<p class="text-sm text-gray-500">No enquiries yet.</p>'; return; }
                container.innerHTML = list.map(e => {
                    // Status badge
                    let statusColor = 'bg-gray-200 text-gray-700';
                    if (e.status === 'pending') statusColor = 'bg-yellow-100 text-yellow-800';
                    if (e.status === 'accepted') statusColor = 'bg-green-100 text-green-800';
                    if (e.status === 'rejected') statusColor = 'bg-red-100 text-red-700';
                    if (e.status === 'approved') statusColor = 'bg-blue-100 text-blue-800';
                    if (e.status === 'request to connect') statusColor = 'bg-purple-100 text-purple-800';
                    const statusBadge = `<span class='inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor}'>${e.status.charAt(0).toUpperCase() + e.status.slice(1)}</span>`;
                    return `<tr>
                        <td class='px-2 py-1'>${e.propertyName || e.propertyId}</td>
                        <td class='px-2 py-1'>${e.studentName || e.studentId}</td>
                        <td class='px-2 py-1'>${statusBadge}</td>
                        <td class='px-2 py-1'>${new Date(e.ts).toLocaleString()}</td>
                        <td class='px-2 py-1'>
                            <button data-enqid="${e._id}" class="accept-enq mb-2 bg-green-600 text-white px-2 py-1 rounded text-xs">Accept</button>
                            <button data-enqid="${e._id}" class="reject-enq ml-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Reject</button>
                        </td>
                    </tr>`;
                }).join('');

                // attach handlers
                setTimeout(() => {
                    document.querySelectorAll('.accept-enq').forEach(b => b.addEventListener('click', (ev) => {
                        const enqId = ev.target.getAttribute('data-enqid'); ownerAction(enqId, 'accept');
                    }));
                    document.querySelectorAll('.reject-enq').forEach(b => b.addEventListener('click', (ev) => {
                        const enqId = ev.target.getAttribute('data-enqid'); ownerAction(enqId, 'reject');
                    }));
                }, 50);
            } catch (e) { console.warn('loadOwnerEnquiries error', e); }
        }

        function ownerAction(enquiryId, action) {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (!user || !user.loginId) return alert('Owner session missing');
            fetch(`${API_BASE}/api/owners/enquiries/${enquiryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    action === 'accept'
                        ? { status: 'accepted', chatOpen: true, visitAllowed: true }
                        : { status: 'rejected', chatOpen: false, visitAllowed: false }
                )
            })
            .then(res => res.json())
            .then(() => {
                loadOwnerEnquiries();
                alert('Enquiry ' + action + 'ed');
            })
            .catch(() => alert('Failed to update enquiry'));
        }

        document.getElementById('refresh-enquiries')?.addEventListener('click', loadOwnerEnquiries);

        // load on start
        loadOwnerEnquiries();
        // Auto-refresh enquiry list every 30 seconds
        setInterval(loadOwnerEnquiries, 30000);

        // Mobile Menu Functionality
        document.getElementById('mobile-menu-open').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.remove('hidden');
        });

        document.getElementById('close-mobile-menu').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('mobile-menu-overlay').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        // Optionally, you can use polling or websockets for real-time updates

        // Add Account functionality
        function addNewAccount() {
            // Clear current session and redirect to login
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            window.location.href = '/propertyowner/index';
        }

        // Load and display accounts in sidebar
        function loadAccounts() {
            const accountsList = document.getElementById('accounts-list');
            const mobileAccountsList = document.getElementById('mobile-accounts-list');
            const ownerAccounts = JSON.parse(localStorage.getItem('owner_accounts') || '[]');
            const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
            
            if (ownerAccounts.length === 0) {
                const noAccountsHtml = '<div class="text-xs text-gray-500 text-center py-2">No accounts</div>';
                if (accountsList) accountsList.innerHTML = noAccountsHtml;
                if (mobileAccountsList) mobileAccountsList.innerHTML = noAccountsHtml;
                return;
            }
            
            const accountsHtml = ownerAccounts.map(account => {
                const isActive = currentUser && currentUser.loginId === account.loginId;
                return `
                    <div class="account-item ${isActive ? 'bg-blue-700' : 'bg-gray-700'} rounded-lg p-2 cursor-pointer hover:bg-opacity-80 transition-colors" onclick="switchAccount('${account.loginId}')">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-medium text-white truncate">${account.name || 'Owner'}</div>
                                <div class="text-xs text-gray-300 truncate">${account.loginId}</div>
                            </div>
                            ${isActive ? '<div class="w-2 h-2 bg-green-400 rounded-full ml-2"></div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            if (accountsList) accountsList.innerHTML = accountsHtml;
            if (mobileAccountsList) mobileAccountsList.innerHTML = accountsHtml;
        }

        // Switch between accounts
        function switchAccount(loginId) {
            const ownerAccounts = JSON.parse(localStorage.getItem('owner_accounts') || '[]');
            const account = ownerAccounts.find(acc => acc.loginId === loginId);
            
            if (account) {
                // Set as active account
                localStorage.setItem('user', JSON.stringify(account));
                sessionStorage.setItem('owner_session', JSON.stringify(account));
                
                // Reload the page to reflect the account change
                window.location.reload();
            }
        }

        // Initialize accounts on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadAccounts();
            
            // Initialize notifications
            if (typeof PropertyOwnerNotifications !== 'undefined') {
                window.ownerNotifications = new PropertyOwnerNotifications();
            }
        });

