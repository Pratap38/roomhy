lucide.createIcons();
        let currentTenantRecord = null;

        function getTenantUser() {
            try {
                return JSON.parse(localStorage.getItem('tenant_user') || localStorage.getItem('user') || 'null');
            } catch (_) {
                return null;
            }
        }

        function getUserId() {
            const user = getTenantUser();
            return user ? (user.tenantId || user.loginId || '') : '';
        }

        function getLocalTenantRecord(loginId) {
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            return tenants.find(t => (t.loginId || '').toUpperCase() === String(loginId || '').toUpperCase()) || null;
        }

        function upsertLocalTenantRecord(record) {
            if (!record || !record.loginId) return;
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const loginId = String(record.loginId).toUpperCase();
            const idx = tenants.findIndex(t => (t.loginId || '').toUpperCase() === loginId);
            if (idx >= 0) tenants[idx] = { ...tenants[idx], ...record };
            else tenants.push(record);
            localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
        }

        async function fetchTenantRecordFromApi(loginId) {
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

        function getPropertyName(tenantRecord) {
            if (!tenantRecord) return 'Roomhy Property';
            if (typeof tenantRecord.property === 'string') return tenantRecord.property || tenantRecord.propertyTitle || 'Roomhy Property';
            if (tenantRecord.property && typeof tenantRecord.property === 'object') {
                return tenantRecord.property.title || tenantRecord.property.name || tenantRecord.propertyTitle || 'Roomhy Property';
            }
            return tenantRecord.propertyTitle || 'Roomhy Property';
        }

        function getRoomInfo(tenantRecord) {
            if (!tenantRecord) return 'Room -';
            const roomNo = tenantRecord.roomNo || (tenantRecord.room && tenantRecord.room.number) || '-';
            const bedNo = tenantRecord.bedNo || '-';
            return `Room ${roomNo} (${bedNo})`;
        }

        function renderTenantSummary(user, tenantRecord) {
            const safeName = (user && user.name) ? user.name : 'Tenant';
            document.getElementById('welcome-name').innerText = safeName.split(' ')[0];
            document.getElementById('headerAvatar').innerText = safeName.charAt(0).toUpperCase();
            document.getElementById('userMenuName').innerText = safeName;

            if (!tenantRecord) {
                document.getElementById('login-id').innerText = user.loginId || getUserId();
                document.getElementById('login-id-detail').innerText = user.loginId || getUserId();
                return;
            }

            const rent = Number(tenantRecord.agreedRent || 0);
            const propName = getPropertyName(tenantRecord);
            const roomInfo = getRoomInfo(tenantRecord);

            document.getElementById('rent-amount').innerText = `\u20B9 ${rent.toLocaleString()}`;
            document.getElementById('modal-amount').innerText = `\u20B9 ${rent.toLocaleString()}`;

            document.getElementById('prop-name').innerText = propName;
            document.getElementById('prop-name-detail').innerText = propName;
            document.getElementById('room-info').innerText = roomInfo;
            document.getElementById('room-info-detail').innerText = roomInfo;
            document.getElementById('login-id').innerText = tenantRecord.loginId || user.loginId || getUserId();
            document.getElementById('login-id-detail').innerText = tenantRecord.loginId || user.loginId || getUserId();
            document.getElementById('move-in-date-detail').innerText = tenantRecord.moveInDate ? new Date(tenantRecord.moveInDate).toLocaleDateString('en-IN') : '-';
        }

        function showUserMenu() {
            document.getElementById('userMenu').classList.add('show');
        }

        function hideUserMenu() {
            document.getElementById('userMenu').classList.remove('show');
        }

        document.addEventListener('DOMContentLoaded', async () => {
            const user = getTenantUser();
            if (!user || user.role !== 'tenant') {
                document.getElementById('sessionModal').classList.remove('hidden');
                document.getElementById('sessionModal').classList.add('flex');
                return;
            }

            const loginId = (user.loginId || '').toUpperCase();
            let tenantRecord = getLocalTenantRecord(loginId);
            if (!tenantRecord) {
                tenantRecord = await fetchTenantRecordFromApi(loginId);
                if (tenantRecord) upsertLocalTenantRecord(tenantRecord);
            }
            currentTenantRecord = tenantRecord || null;
            renderTenantSummary(user, tenantRecord);
        });

        document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        });

        function openModal(id) {
            document.getElementById(id).classList.remove('hidden');
            document.getElementById(id).classList.add('flex');
            if (id === 'payRentModal') {
                const panel = document.getElementById('cashPaymentPanel');
                const status = document.getElementById('cashPaymentStatus');
                const otpInput = document.getElementById('cashOtpInput');
                if (panel) panel.classList.add('hidden');
                if (status) status.textContent = '';
                if (otpInput) otpInput.value = '';
            }
        }

        function closeModal(id) {
            document.getElementById(id).classList.add('hidden');
            document.getElementById(id).classList.remove('flex');
        }

        function manageRentReminder() {
            const body = `
                <p class="text-sm text-slate-600 mb-4">You receive automatic reminders 3 days before the 1st of every month.</p>
                <div class="p-3 bg-blue-50 rounded-lg flex justify-between items-center mb-4 border border-blue-100">
                    <p class="font-medium text-sm text-blue-800">Status</p>
                    <span class="font-bold text-green-600 text-sm bg-white px-2 rounded">ACTIVE</span>
                </div>
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1 text-slate-700">Remind me before:</label>
                    <select class="w-full p-2 border rounded-lg text-sm bg-white">
                        <option value="3" selected>3 Days</option>
                        <option value="5">5 Days</option>
                        <option value="7">7 Days</option>
                    </select>
                </div>
            `;
            const footer = '<button class="bg-brand-blue text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-blue-700" onclick="closeModal(\'genericModal\')">Save Settings</button>';
            
            document.getElementById('genericModalTitle').innerText = "Manage Rent Reminders";
            document.getElementById('genericModalBody').innerHTML = body;
            document.getElementById('genericModalFooter').innerHTML = footer;
            openModal('genericModal');
        }

        function viewEmergency() {
            const body = `
                <div class="space-y-3">
                    <div class="p-3 bg-red-50 rounded-lg border border-red-100">
                        <p class="font-bold text-red-700 text-sm">Property Manager</p>
                        <p class="text-lg font-bold text-red-900 mt-1">+91 98765 43210</p>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p class="font-medium text-slate-700 text-sm">Local Police</p>
                        <p class="text-lg font-bold text-slate-900 mt-1">100</p>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p class="font-medium text-slate-700 text-sm">Ambulance</p>
                        <p class="text-lg font-bold text-slate-900 mt-1">108</p>
                    </div>
                </div>
            `;
            document.getElementById('genericModalTitle').innerText = "Emergency Contacts";
            document.getElementById('genericModalBody').innerHTML = body;
            document.getElementById('genericModalFooter').innerHTML = '<button class="text-slate-500 text-sm hover:underline" onclick="closeModal(\'genericModal\')">Close</button>';
            openModal('genericModal');
        }

        function scrollToTab(tabName) {
            const element = document.getElementById(tabName);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        function clearSession() {
            try {
                localStorage.removeItem('tenant_user');
            } catch(e) {}
            try {
                localStorage.removeItem('user');
            } catch(e) {}
            window.location.href = 'tenantlogin.html';
        }

        function getTenantPaymentContext() {
            const user = JSON.parse(localStorage.getItem('tenant_user') || localStorage.getItem('user') || 'null');
            if (!user) return null;

            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const tenantRecord = currentTenantRecord || tenants.find(t => (t.loginId || '').toUpperCase() === (user.loginId || '').toUpperCase());
            if (!tenantRecord) return null;

            const ownerLoginId = tenantRecord.ownerLoginId || tenantRecord.ownerId || (tenantRecord.owner && (tenantRecord.owner.loginId || tenantRecord.owner.ownerId)) || '';
            const rentAmount = Number(tenantRecord.agreedRent || 0);
            const propertyName = typeof tenantRecord.property === 'string'
                ? tenantRecord.property
                : (tenantRecord.property && (tenantRecord.property.title || tenantRecord.property.name)) || '';

            return { user, tenants, tenantRecord, ownerLoginId, rentAmount, propertyName };
        }

        async function initiateRazorpayPayment() {
            const ctx = getTenantPaymentContext();
            if (!ctx) return alert('Tenant data not found');
            const { user, rentAmount } = ctx;
            if (rentAmount <= 0) return alert('Invalid rent amount');

            try {
                const payload = {
                    amount: rentAmount,
                    tenantId: user.loginId,
                    description: 'Monthly Rent Payment'
                };
                console.log('?? Sending payment order request:', payload);
                
                const orderResponse = await fetch(`${API_URL}/api/rents/create-order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                console.log('?? Order response status:', orderResponse.status);
                const orderData = await orderResponse.json();
                console.log('?? Order response data:', orderData);

                if (!orderResponse.ok) {
                    throw new Error(orderData.error || 'Failed to create payment order');
                }

                const options = {
                    key: orderData.key,
                    amount: rentAmount * 100,
                    currency: 'INR',
                    name: 'RoomHy Rent Payment',
                    description: 'Monthly Rent Payment',
                    order_id: orderData.order.id,
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: user.phone
                    },
                    notes: {
                        tenantId: user.loginId,
                        rentMonth: new Date().toISOString().slice(0, 7)
                    },
                    handler: function(response) {
                        recordPaymentSuccess(response, rentAmount, user);
                    },
                    modal: {
                        ondismiss: function() {
                            alert('Payment cancelled');
                        }
                    }
                };

                const rzp = new Razorpay(options);
                rzp.open();
            } catch (error) {
                console.error('Payment initiation error:', error);
                alert('Failed to initiate payment: ' + error.message);
            }
        }

        async function recordPaymentSuccess(response, rentAmount, user) {
            try {
                const paymentRes = await fetch(`${API_URL}/api/rents/record-payment-by-tenant`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantId: user.loginId,
                        razorpayPaymentId: response.razorpay_payment_id,
                        paidAmount: rentAmount,
                        paymentMethod: 'razorpay'
                    })
                });

                console.log('?? Payment recording status:', paymentRes.status);
                const paymentData = await paymentRes.json();
                console.log('?? Payment response:', paymentData);

                if (paymentRes.ok && paymentData.success) {
                    const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                    const tenantIdx = tenants.findIndex(t => t.loginId === user.loginId);
                    if (tenantIdx >= 0) {
                        tenants[tenantIdx].paymentStatus = paymentData.paymentStatus || 'paid';
                        tenants[tenantIdx].rentInfo = {
                            ...tenants[tenantIdx].rentInfo,
                            paymentStatus: paymentData.paymentStatus || 'paid',
                            paidAmount: rentAmount,
                            totalDue: rentAmount
                        };
                        localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                    }

                    localStorage.setItem('roomhy_payment_updated', Date.now());
                    localStorage.removeItem('roomhy_payment_updated');

                    updatePaymentStatusUI();
                    showPaymentSuccess(paymentData);
                } else {
                    showPaymentSuccess({ error: paymentData.error || 'Payment recorded but update failed' });
                }
            } catch (err) {
                console.error('Error recording payment:', err);
                showPaymentSuccess({ error: err.message });
            }
        }

        async function requestCashPayment() {
            const ctx = getTenantPaymentContext();
            if (!ctx) return alert('Tenant data not found');
            const { user, tenantRecord, ownerLoginId, rentAmount, propertyName } = ctx;
            if (!ownerLoginId) return alert('Owner login ID missing for this tenant');
            if (rentAmount <= 0) return alert('Invalid rent amount');

            const statusEl = document.getElementById('cashPaymentStatus');
            const panelEl = document.getElementById('cashPaymentPanel');
            if (panelEl) panelEl.classList.remove('hidden');
            if (statusEl) statusEl.textContent = 'Sending cash request to owner...';

            try {
                const res = await fetch(`${API_URL}/api/rents/cash/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantLoginId: user.loginId,
                        ownerLoginId: ownerLoginId,
                        amount: rentAmount,
                        propertyName: propertyName || '',
                        roomNumber: tenantRecord.roomNo || '',
                        tenantName: user.name || '',
                        tenantEmail: user.email || tenantRecord.email || '',
                        tenantPhone: user.phone || tenantRecord.phone || ''
                    })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to request cash payment');
                }
                if (statusEl) statusEl.textContent = 'Cash request sent. Ask owner to click Received. OTP will come to your Gmail.';
            } catch (err) {
                if (statusEl) statusEl.textContent = `Cash request failed: ${err.message}`;
            }
        }

        async function verifyCashPaymentOtp() {
            const ctx = getTenantPaymentContext();
            if (!ctx) return alert('Tenant data not found');
            const { user, tenants } = ctx;

            const otpInput = document.getElementById('cashOtpInput');
            const statusEl = document.getElementById('cashPaymentStatus');
            const otp = (otpInput && otpInput.value || '').trim();
            if (!otp) return alert('Enter OTP');

            if (statusEl) statusEl.textContent = 'Verifying OTP...';

            try {
                const res = await fetch(`${API_URL}/api/rents/cash/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantLoginId: user.loginId,
                        otp
                    })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'OTP verification failed');
                }

                const idx = tenants.findIndex(t => t.loginId === user.loginId);
                if (idx >= 0) {
                    tenants[idx].paymentStatus = 'paid';
                    tenants[idx].rentInfo = {
                        ...(tenants[idx].rentInfo || {}),
                        paymentStatus: 'paid',
                        paidAmount: ctx.rentAmount,
                        totalDue: ctx.rentAmount,
                        paymentMethod: 'cash'
                    };
                    localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                }

                localStorage.setItem('roomhy_payment_updated', Date.now());
                localStorage.removeItem('roomhy_payment_updated');

                updatePaymentStatusUI();
                showPaymentSuccess({ message: 'Cash payment verified and marked as paid.' });
            } catch (err) {
                if (statusEl) statusEl.textContent = `OTP verification failed: ${err.message}`;
            }
        }

        function updatePaymentStatusUI() {
            const rentBanner = document.querySelector('.rent-banner');
            const statusBadge = rentBanner.querySelector('#paymentStatusBadge');
            if (statusBadge) {
                statusBadge.className = 'px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold flex items-center gap-1';
                statusBadge.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> Paid';
            }

            const rentAmountElement = document.getElementById('rent-amount');
            if (rentAmountElement) {
                rentAmountElement.textContent = '\u20B9 0';
            }
        }

        function showPaymentSuccess(data = {}) {
            closeModal('payRentModal');
            const successText = data.message || 'Your rent payment has been recorded and confirmed.';
            
            const body = `
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="check-circle" class="w-8 h-8 text-green-600"></i>
                    </div>
                    <h4 class="text-lg font-bold text-slate-900 mb-2">Payment Successful!</h4>
                    <p class="text-sm text-slate-600 mb-4">${successText}</p>
                    <div class="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-left">
                        <p class="text-green-900"><strong>? Payment recorded</strong></p>
                        <p class="text-green-800 text-xs mt-1">Check your email for receipt</p>
                    </div>
                </div>
            `;
            
            const footer = `<button class="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700" onclick="closeModal('genericModal')">Done</button>`;
            
            document.getElementById('genericModalTitle').innerText = "Payment Confirmation";
            document.getElementById('genericModalBody').innerHTML = body;
            document.getElementById('genericModalFooter').innerHTML = footer;
            openModal('genericModal');
            lucide.createIcons();
        }
