lucide.createIcons();

                let commissionData = [];

        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                chevron.style.transform = 'rotate(180deg)';
            }
        }

        function toggleMobileMenu() {
            const mobileSidebar = document.getElementById('mobile-sidebar');
            const mobileOverlay = document.getElementById('mobile-overlay');
            const isClosed = mobileSidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                mobileSidebar.classList.remove('-translate-x-full');
                mobileOverlay.classList.remove('hidden');
            } else {
                mobileSidebar.classList.add('-translate-x-full');
                mobileOverlay.classList.add('hidden');
            }
        }
        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);

        function toggleModal(modalID) {
            const modal = document.getElementById(modalID);
            if (modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function monthKey(dateLike) {
            const d = new Date(dateLike || Date.now());
            if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 7);
            return d.toISOString().slice(0, 7);
        }

        function calcToBePaid(rentAmount, isFirstMonth) {
            const rent = Number(rentAmount || 0);
            const commission = isFirstMonth ? (rent * 0.10) : 0;
            const serviceFee = 50;
            const toBePaid = Math.max(rent - commission - serviceFee, 0);
            return { rent, commission, serviceFee, toBePaid };
        }

        async function fetchJson(path) {
            const res = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
            return res.json();
        }

        function buildOwnerMap(owners) {
            const map = {};
            owners.forEach(o => {
                const key = String(o.loginId || o.ownerLoginId || o._id || '').trim().toUpperCase();
                if (key) map[key] = o;
            });
            return map;
        }

        function getTenantPropertyName(tenant, rent) {
            const fromRent = rent && rent.propertyName ? String(rent.propertyName).trim() : '';
            if (fromRent && fromRent.toLowerCase() !== 'new property' && fromRent.toLowerCase() !== 'new') return fromRent;
            if (tenant && typeof tenant.property === 'object' && tenant.property) {
                return tenant.property.title || tenant.property.name || 'Unknown Property';
            }
            const p = String((tenant && tenant.property) || '').trim();
            if (p && p.toLowerCase() !== 'new property' && p.toLowerCase() !== 'new') return p;
            return 'Unknown Property';
        }

        async function loadCommissionRows() {
            try {
                const [tenantRes, ownerRes, rentRes] = await Promise.all([
                    fetchJson('/api/tenants').catch(() => ({ tenants: [] })),
                    fetchJson('/api/owners').catch(() => ({ owners: [] })),
                    fetchJson('/api/rents').catch(() => ({ rents: [] }))
                ]);

                const tenants = Array.isArray(tenantRes) ? tenantRes : (tenantRes.tenants || []);
                const owners = Array.isArray(ownerRes) ? ownerRes : (ownerRes.owners || ownerRes.data || []);
                const rents = Array.isArray(rentRes) ? rentRes : (rentRes.rents || []);

                const ownerMap = buildOwnerMap(owners);
                const currentMonth = new Date().toISOString().slice(0, 7);

                commissionData = tenants.map((tenant) => {
                    const tenantLoginId = String(tenant.loginId || '').trim().toUpperCase();
                    const rent = rents.find(r => String(r.tenantLoginId || '').trim().toUpperCase() === tenantLoginId) || null;
                    const ownerId = String(
                        tenant.ownerLoginId || tenant.ownerId || tenant.owner_id ||
                        (tenant.property && tenant.property.ownerLoginId) ||
                        (rent && rent.ownerLoginId) || ''
                    ).trim().toUpperCase();

                    const owner = ownerMap[ownerId] || {};
                    const ownerName = owner.name || owner.ownerName || (owner.profile && owner.profile.name) || ownerId || 'Unknown Owner';
                    const propertyName = getTenantPropertyName(tenant, rent);
                    const tenantName = tenant.name || 'Tenant';
                    const tenantId = tenant.loginId || '-';

                    const moveInMonth = monthKey(tenant.moveInDate || tenant.createdAt || Date.now());
                    const isFirstMonth = moveInMonth === currentMonth;

                    const rentAmount = Number(
                        (rent && (rent.rentAmount || rent.totalDue)) || tenant.agreedRent || 0
                    );
                    const calc = calcToBePaid(rentAmount, isFirstMonth);

                    return {
                        ownerName,
                        ownerId,
                        propertyName,
                        tenantName,
                        tenantId,
                        firstMonth: isFirstMonth,
                        rent: calc.rent,
                        commission: calc.commission,
                        serviceFee: calc.serviceFee,
                        toBePaid: calc.toBePaid,
                        status: calc.toBePaid > 0 ? 'pending' : 'settled'
                    };
                }).filter(row => row.rent > 0);

                renderTable();
                updateDashboard();
            } catch (err) {
                console.error('Failed loading commission rows:', err);
                const tbody = document.getElementById('commissionTableBody');
                if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-red-500">${err.message}</td></tr>`;
            }
        }

        function renderTable() {
            const tbody = document.getElementById('commissionTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (!commissionData.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-gray-500">No commission data available</td></tr>';
                return;
            }

            commissionData.forEach(item => {
                const statusClass = item.status === 'settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                const statusLabel = item.status === 'settled' ? 'Settled' : 'Pending';
                const row = `
                    <tr data-status="${item.status}">
                        <td>
                            <p class="text-sm font-medium text-gray-900">${item.ownerName}</p>
                            <p class="text-xs text-gray-500">${item.ownerId}</p>
                        </td>
                        <td class="text-sm text-gray-700">${item.propertyName}</td>
                        <td>
                            <p class="text-sm text-gray-800">${item.tenantName}</p>
                            <p class="text-xs text-gray-500">${item.tenantId}</p>
                        </td>
                        <td class="text-sm font-semibold text-gray-800">INR ${item.rent.toLocaleString('en-IN')}</td>
                        <td class="text-sm text-purple-700 font-semibold">INR ${item.commission.toLocaleString('en-IN')}</td>
                        <td class="text-sm text-blue-700 font-semibold">INR ${item.serviceFee.toLocaleString('en-IN')}</td>
                        <td class="text-sm text-green-700 font-bold">INR ${item.toBePaid.toLocaleString('en-IN')}</td>
                        <td>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">${statusLabel}</span>
                            <p class="text-[11px] text-gray-500 mt-1">${item.firstMonth ? 'First month: 10% + 50' : 'Next month: 50 only'}</p>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }

        function updateDashboard() {
            const totalRevenue = commissionData.reduce((sum, item) => sum + item.commission + item.serviceFee, 0);
            const totalPendingPayout = commissionData.reduce((sum, item) => sum + item.toBePaid, 0);
            const revenueCards = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div h3');
            if (revenueCards[0]) revenueCards[0].textContent = `INR ${totalRevenue.toLocaleString('en-IN')}`;
            if (revenueCards[2]) revenueCards[2].textContent = `INR ${totalPendingPayout.toLocaleString('en-IN')}`;
        }

        window.addEventListener('load', () => {
            lucide.createIcons();
            loadCommissionRows();
        });

        document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const searchText = e.target.value.toLowerCase();
                    document.querySelectorAll('#commissionTableBody tr').forEach(row => {
                        row.style.display = row.textContent.toLowerCase().includes(searchText) ? '' : 'none';
                    });
                });
            }

            const statusFilter = document.querySelector('select');
            if (statusFilter) {
                statusFilter.addEventListener('change', (e) => {
                    const status = e.target.value;
                    document.querySelectorAll('#commissionTableBody tr').forEach(row => {
                        if (!status || row.dataset.status === status) row.style.display = '';
                        else row.style.display = 'none';
                    });
                });
            }
        });