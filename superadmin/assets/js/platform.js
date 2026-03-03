lucide.createIcons();

const API_BASE_URL = (typeof window !== 'undefined' && window.API_URL)
    ? window.API_URL
    : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5001'
        : 'https://api.roomhy.com');

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
    const mobileOverlay = document.getElementById('mobile-sidebar-overlay') || document.getElementById('mobile-overlay');
    if (!mobileSidebar || !mobileOverlay) return;
    const isClosed = mobileSidebar.classList.contains('-translate-x-full');
    if (isClosed) {
        mobileSidebar.classList.remove('-translate-x-full');
        mobileSidebar.classList.add('translate-x-0');
        mobileOverlay.classList.remove('hidden');
    } else {
        mobileSidebar.classList.add('-translate-x-full');
        mobileSidebar.classList.remove('translate-x-0');
        mobileOverlay.classList.add('hidden');
    }
}

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

async function fetchJson(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status} for ${path}`);
    return data;
}

function buildOwnerMap(owners) {
    const map = {};
    owners.forEach((o) => {
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

function getPayoutStatusFromRent(rent) {
    const status = String(rent?.ownerPayoutStatus || '').toLowerCase();
    if (status === 'paid') return 'paid';
    if (status === 'processing') return 'processing';
    if (status === 'failed') return 'failed';
    return 'pending';
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
            const rent = rents.find((r) => String(r.tenantLoginId || '').trim().toUpperCase() === tenantLoginId) || null;
            const ownerId = String(
                tenant.ownerLoginId || tenant.ownerId || tenant.owner_id ||
                (tenant.property && tenant.property.ownerLoginId) ||
                (rent && rent.ownerLoginId) || ''
            ).trim().toUpperCase();

            if (!rent || !ownerId) return null;

            const owner = ownerMap[ownerId] || {};
            const ownerName = owner.name || owner.ownerName || (owner.profile && owner.profile.name) || ownerId || 'Unknown Owner';
            const propertyName = getTenantPropertyName(tenant, rent);
            const tenantName = tenant.name || 'Tenant';
            const tenantId = tenant.loginId || '-';

            const moveInMonth = monthKey(tenant.moveInDate || tenant.createdAt || Date.now());
            const isFirstMonth = moveInMonth === currentMonth;
            const rentAmount = Number((rent && (rent.rentAmount || rent.totalDue)) || tenant.agreedRent || 0);
            const calc = calcToBePaid(rentAmount, isFirstMonth);
            const payoutStatus = getPayoutStatusFromRent(rent);

            return {
                ownerName,
                ownerId,
                propertyName,
                tenantName,
                tenantId,
                firstMonth: isFirstMonth,
                rentRecordId: rent._id || '',
                rent: calc.rent,
                commission: calc.commission,
                serviceFee: calc.serviceFee,
                toBePaid: calc.toBePaid,
                status: payoutStatus
            };
        }).filter((row) => row && row.rent > 0);

        renderTable();
        updateDashboardCards();
    } catch (err) {
        console.error('Failed loading commission rows:', err);
        const tbody = document.getElementById('commissionTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-red-500">${err.message}</td></tr>`;
    }
}

function statusBadge(status) {
    if (status === 'paid') {
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Payment Received</span>';
    }
    if (status === 'processing') {
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Processing</span>';
    }
    if (status === 'failed') {
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>';
    }
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>';
}

function renderTable() {
    const tbody = document.getElementById('commissionTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!commissionData.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="py-8 text-center text-gray-500">No commission data available</td></tr>';
        return;
    }

    commissionData.forEach((item) => {
        const actionHtml = item.status === 'paid'
            ? '<span class="text-xs text-green-700 font-semibold">Transferred</span>'
            : `<button class="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md" onclick="payNow('${item.ownerId}','${item.tenantId}','${String(item.propertyName).replace(/'/g, '\\\'')}',${item.toBePaid},${item.rent},${item.commission},${item.serviceFee})">Pay Now</button>`;

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
                    ${statusBadge(item.status)}
                    <p class="text-[11px] text-gray-500 mt-1">${item.firstMonth ? 'First month: 10% + 50' : 'Next month: 50 only'}</p>
                </td>
                <td>${actionHtml}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function updateDashboardCards() {
    const totalRevenue = commissionData.reduce((sum, item) => sum + item.commission + item.serviceFee, 0);
    const totalPendingPayout = commissionData
        .filter((item) => item.status !== 'paid')
        .reduce((sum, item) => sum + item.toBePaid, 0);

    const totalRevenueEl = document.getElementById('card-total-revenue');
    const pendingPayoutEl = document.getElementById('card-pending-payout');
    if (totalRevenueEl) totalRevenueEl.textContent = `INR ${totalRevenue.toLocaleString('en-IN')}`;
    if (pendingPayoutEl) pendingPayoutEl.textContent = `INR ${totalPendingPayout.toLocaleString('en-IN')}`;
}

async function payNow(ownerLoginId, tenantLoginId, propertyName, amount, rent, commission, serviceFee) {
    try {
        if (!confirm(`Transfer INR ${Number(amount).toLocaleString('en-IN')} to owner ${ownerLoginId}?`)) return;
        await fetchJson('/api/rents/platform/payout', {
            method: 'POST',
            body: JSON.stringify({
                ownerLoginId,
                tenantLoginId,
                propertyName,
                amount,
                rentAmount: rent,
                commissionAmount: commission,
                serviceFeeAmount: serviceFee
            })
        });
        alert('Payout transferred successfully. Owner email sent.');
        await loadCommissionRows();
    } catch (err) {
        alert(`Payout failed: ${err.message}`);
    }
}

window.payNow = payNow;
window.toggleModal = toggleModal;
window.toggleSubmenu = toggleSubmenu;
window.toggleMobileMenu = toggleMobileMenu;

window.addEventListener('load', () => {
    lucide.createIcons();
    loadCommissionRows();
});

document.addEventListener('DOMContentLoaded', () => {
    const mobileOpen = document.getElementById('mobile-menu-open');
    if (mobileOpen) mobileOpen.addEventListener('click', toggleMobileMenu);

    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase();
            document.querySelectorAll('#commissionTableBody tr').forEach((row) => {
                row.style.display = row.textContent.toLowerCase().includes(searchText) ? '' : 'none';
            });
        });
    }

    const statusFilter = document.querySelector('select');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            const status = e.target.value;
            document.querySelectorAll('#commissionTableBody tr').forEach((row) => {
                if (!status || row.dataset.status === status) row.style.display = '';
                else row.style.display = 'none';
            });
        });
    }
});
