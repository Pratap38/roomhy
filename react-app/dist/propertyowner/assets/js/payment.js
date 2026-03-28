lucide.createIcons();
        
        // --- Auth Guard ---
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role !== 'owner') {
            window.location.href = '/propertyowner/ownerlogin';
        }
        
        const ownerId = user.ownerId || user.loginId;
        
        // --- Header Population ---
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('headerName')) {
                document.getElementById('headerName').innerText = user.name;
            }
            if (document.getElementById('headerAvatar')) {
                document.getElementById('headerAvatar').innerText = user.name.charAt(0).toUpperCase();
            }
            if (document.getElementById('headerAccountId')) {
                document.getElementById('headerAccountId').innerText = `Account: ${user.loginId || user.ownerId}`;
            }
            loadOwnerPayments();
        });
        
        // --- Logout Handler ---
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '/propertyowner/ownerlogin';
        });
        
        // Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const closeMobileMenuButton = document.getElementById('close-mobile-menu');

        if(mobileMenuButton) {
            const openMenu = () => mobileMenu.classList.remove('hidden');
            const closeMenu = () => mobileMenu.classList.add('hidden');
            mobileMenuButton.addEventListener('click', openMenu);
            closeMobileMenuButton.addEventListener('click', closeMenu);
            mobileMenuOverlay.addEventListener('click', closeMenu);
        }
        
        // Profile Dropdown
        const profileButton = document.getElementById('profile-button');
        const profileDropdown = document.getElementById('profile-dropdown');

        if(profileButton) {
             profileButton.addEventListener('click', (event) => {
                event.stopPropagation(); 
                const isHidden = profileDropdown.classList.contains('hidden');
                if(isHidden) {
                    profileDropdown.classList.remove('hidden', 'scale-95', 'opacity-0');
                    profileDropdown.classList.add('scale-100', 'opacity-100');
                } else {
                     profileDropdown.classList.add('scale-95', 'opacity-0');
                     setTimeout(() => profileDropdown.classList.add('hidden'), 200); 
                }
            });
            document.addEventListener('click', (event) => {
                if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
                     if(!profileDropdown.classList.contains('hidden')) {
                         profileDropdown.classList.add('scale-95', 'opacity-0');
                         setTimeout(() => profileDropdown.classList.add('hidden'), 200);
                     }
                }
            });
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function formatCurrency(amount) {
            const value = Number(amount || 0);
            return `INR ${value.toLocaleString('en-IN')}`;
        }

        function formatDate(input) {
            if (!input) return '-';
            const date = new Date(input);
            if (Number.isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('en-IN');
        }

        function normalizeStatus(rent) {
            if (rent.cashRequestStatus === 'requested' || rent.cashRequestStatus === 'otp_sent') return 'pending';
            if (rent.cashRequestStatus === 'paid' || rent.paymentStatus === 'paid' || rent.paymentStatus === 'completed') return 'received';
            if (rent.paymentStatus === 'overdue' || rent.paymentStatus === 'defaulted') return 'overdue';
            return 'pending';
        }

        function statusBadgeHtml(rent) {
            const state = normalizeStatus(rent);
            if (state === 'received') return '<span class="status-badge status-received">Received</span>';
            if (state === 'overdue') return '<span class="status-badge status-overdue">Overdue</span>';
            if (rent.cashRequestStatus === 'requested') return '<span class="status-badge status-pending">Cash Requested</span>';
            if (rent.cashRequestStatus === 'otp_sent') return '<span class="status-badge status-pending">OTP Sent</span>';
            return '<span class="status-badge status-pending">Pending</span>';
        }

        function actionHtml(rent) {
            const state = normalizeStatus(rent);
            const rentId = escapeHtml(rent._id || '');
            if (state === 'received') {
                return '<div class="flex justify-end"><span class="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">Paid</span></div>';
            }
            if (rent.cashRequestStatus === 'requested' || rent.cashRequestStatus === 'otp_sent') {
                return `<div class="flex justify-end"><button class="action-icon bg-green-50 hover:bg-green-100" onclick="ownerMarkCashReceived('${rentId}')" title="Mark Cash Received"><i data-lucide="check-circle" class="w-4 h-4 text-green-600"></i></button></div>`;
            }
            return '<div class="flex justify-end"><span class="text-xs text-gray-500">-</span></div>';
        }

        function renderPayments(rents) {
            const tbody = document.querySelector('.excel-table tbody');
            const summary = document.getElementById('paginationSummary');
            if (!tbody) return;

            if (!Array.isArray(rents) || rents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">No payments found.</td></tr>';
                if (summary) summary.textContent = 'Showing 0 entries';
                return;
            }

            tbody.innerHTML = rents.map(rent => {
                const name = escapeHtml(rent.tenantName || rent.tenantLoginId || 'Tenant');
                const property = escapeHtml(rent.propertyName || '-');
                const room = escapeHtml(rent.roomNumber || '-');
                const rentAmount = formatCurrency(rent.rentAmount || rent.totalDue || 0);
                const amount = formatCurrency((rent.totalDue || 0) - (rent.paidAmount || 0));
                const dueDate = formatDate(rent.paymentDate || rent.updatedAt || rent.createdAt);
                const state = normalizeStatus(rent);

                return `
                    <tr class="record-row" data-status="${state}">
                        <td>
                            <div class="flex items-center">
                                <div class="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3">${name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div class="font-medium text-gray-900">${name}</div>
                                    <div class="text-xs text-gray-500">${escapeHtml(rent.tenantLoginId || '')}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="font-medium">${property}</div>
                            <div class="text-xs text-gray-500">Room ${room}</div>
                        </td>
                        <td class="text-gray-600">${rentAmount}</td>
                        <td class="text-gray-500">${dueDate}</td>
                        <td class="font-bold text-gray-800">${amount}</td>
                        <td>${statusBadgeHtml(rent)}</td>
                        <td class="text-right">${actionHtml(rent)}</td>
                    </tr>
                `;
            }).join('');

            if (summary) summary.textContent = `Showing 1 to ${rents.length} of ${rents.length} entries`;
            lucide.createIcons();
        }

        async function loadOwnerPayments() {
            try {
                const res = await fetch(`${API_URL}/api/rents/owner/${encodeURIComponent(ownerId)}`);
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Failed to load payments');
                }
                renderPayments(data.rents || []);
                applyFilter(document.querySelector('.filter-tab.active')?.dataset.filter || 'all');
            } catch (err) {
                const tbody = document.querySelector('.excel-table tbody');
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 py-8">${escapeHtml(err.message)}</td></tr>`;
                }
            }
        }

        async function ownerMarkCashReceived(rentId) {
            try {
                const res = await fetch(`${API_URL}/api/rents/cash/owner-received`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rentId,
                        ownerLoginId: ownerId
                    })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to send OTP');
                }
                alert('OTP sent to tenant Gmail.');
                loadOwnerPayments();
            } catch (err) {
                alert(`Unable to mark received: ${err.message}`);
            }
        }

        function applyFilter(filterValue) {
            const rows = document.querySelectorAll('.record-row');
            rows.forEach(row => {
                if (filterValue === 'all' || row.dataset.status === filterValue) {
                    row.style.display = 'table-row';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // Filter Tabs Logic
        const filterTabs = document.querySelectorAll('.filter-tab');

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                applyFilter(tab.dataset.filter);
            });
        });