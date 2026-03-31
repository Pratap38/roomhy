lucide.createIcons();
        let currentViewingId = null;
        let currentOwnersData = []; // For Excel Export
        let ownersLookup = {};
        const IS_LOCAL_HOST = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
        const API_BASES = Array.from(new Set(
            IS_LOCAL_HOST
                ? [API_URL, 'http://localhost:5001', 'https://api.roomhy.com']
                : [API_URL, 'https://api.roomhy.com']
        ));
        let activeApiBase = API_URL;

        function getStoredToken() {
            return (
                localStorage.getItem('token') ||
                sessionStorage.getItem('token') ||
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken') ||
                localStorage.getItem('jwt') ||
                sessionStorage.getItem('jwt') ||
                ''
            );
        }

        function getAuthHeaders(extraHeaders = {}) {
            const token = getStoredToken();
            const headers = { ...extraHeaders };
            if (token) headers.Authorization = `Bearer ${token}`;
            return headers;
        }

        async function fetchFromAnyApi(path, options = {}) {
            const attempts = [activeApiBase, ...API_BASES.filter(base => base !== activeApiBase)];
            let lastError = null;

            for (const base of attempts) {
                try {
                    const res = await fetch(`${base}${path}`, options);
                    if (res.ok) {
                        activeApiBase = base;
                        return res;
                    }
                    if (res.status === 401 || res.status === 404) {
                        lastError = new Error(`HTTP ${res.status} for ${path} at ${base}`);
                        continue;
                    }
                    return res;
                } catch (err) {
                    lastError = err;
                }
            }

            if (lastError) throw lastError;
            throw new Error(`API request failed: ${path}`);
        }

        async function upsertOwnerToBackend(owner) {
            const loginId = (owner.loginId || owner._id || '').toString().trim().toUpperCase();
            if (!loginId) return false;

            const payload = {
                loginId,
                name: owner.name || owner.profile?.name || 'Owner',
                email: owner.email || owner.gmail || '',
                phone: owner.checkinPhone || owner.phone || '',
                locationCode: owner.checkinArea || owner.locationCode || '',
                address: owner.checkinAddress || owner.address || '',
                checkinDob: owner.checkinDob || '',
                checkinAadhaarLinkedPhone: owner.checkinAadhaarLinkedPhone || '',
                checkinAadhaarNumber: owner.checkinAadhaarNumber || owner.aadharNumber || owner.kyc?.aadharNumber || '',
                checkinAccountHolderName: owner.checkinAccountHolderName || '',
                checkinUpiId: owner.checkinUpiId || '',
                checkinBankName: owner.checkinBankName || owner.bankName || owner.profile?.bankName || '',
                checkinBankAccountNumber: owner.checkinBankAccountNumber || owner.accountNumber || owner.profile?.accountNumber || '',
                checkinIfscCode: owner.checkinIfscCode || owner.ifscCode || owner.profile?.ifscCode || '',
                checkinBranchName: owner.checkinBranchName || owner.branchName || owner.profile?.branchName || '',
                kycStatus: owner.kycStatus || owner.kyc?.status || 'pending'
            };

            try {
                const patchRes = await fetchFromAnyApi(`/api/owners/${encodeURIComponent(loginId)}`, {
                    method: 'PATCH',
                    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify(payload)
                });
                return patchRes.ok;
            } catch (err) {
                try {
                    const postRes = await fetchFromAnyApi('/api/owners', {
                        method: 'POST',
                        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify(payload)
                    });
                    return postRes.ok;
                } catch (_) {
                    return false;
                }
            }
        }

        async function syncOwnersToBackend(owners) {
            if (!Array.isArray(owners) || owners.length === 0) return;
            let successCount = 0;
            for (const owner of owners) {
                const ok = await upsertOwnerToBackend(owner);
                if (ok) successCount += 1;
            }
            console.log(`Synced ${successCount}/${owners.length} owners to backend`);
        }

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

        function pickValue(...values) {
            for (const value of values) {
                if (value === undefined || value === null) continue;
                const text = String(value).trim();
                if (text) return text;
            }
            return '';
        }

        function populateAreaFilter(owners) {
            const select = document.getElementById('areaFilter');
            if (!select) return;
            const selected = select.value || 'all';
            const codes = Array.from(new Set(
                (owners || [])
                    .map(o => pickValue(o.checkinArea, o.locationCode, o.profile?.locationCode, o.area).toUpperCase())
                    .filter(Boolean)
            )).sort();

            select.innerHTML = '<option value="all">All Areas</option>';
            codes.forEach(code => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = code;
                select.appendChild(option);
            });

            select.value = codes.includes(selected) || selected === 'all' ? selected : 'all';
        }

        async function loadOwners() {
            const tbody = document.getElementById('ownersTableBody');
            const areaFilterElement = document.getElementById('areaFilter');
            const ownerSearchElement = document.getElementById('ownerSearch');
            if (!tbody || !areaFilterElement || !ownerSearchElement) return;
            const filterArea = areaFilterElement.value;
            const searchText = ownerSearchElement.value.toUpperCase();
            tbody.innerHTML = '';

            // Try backend first
            let owners = [];
            try {
                // Prefer backend with optional locationCode filter
                let url = `${API_URL}/api/owners`;
                if (filterArea && filterArea !== 'all') url += `?locationCode=${encodeURIComponent(filterArea)}`;
                const res = await fetchFromAnyApi(url.replace(API_URL, ''), {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    // Handle both array response and {data: [...]} response
                    owners = Array.isArray(data) ? data : (data.data || data.owners || []);
                } else {
                    console.warn('Owners API returned', res.status);
                }
            } catch (err) {
                console.warn('Failed to fetch owners from backend, falling back to localStorage', err);
            }

            // API-only mode: do not merge legacy localStorage data
            if (!owners || !Array.isArray(owners)) owners = [];

            owners = owners.map(o => ({
                ...o,
                loginId: pickValue(o.loginId, o._id).toUpperCase(),
                name: pickValue(o.name, o.profile?.name) || 'Unknown',
                email: pickValue(o.email, o.checkinEmail, o.profile?.email, o.gmail),
                checkinPhone: pickValue(o.checkinPhone, o.phone, o.profile?.phone),
                checkinDob: pickValue(o.checkinDob, o.dob),
                checkinAadhaarLinkedPhone: pickValue(o.checkinAadhaarLinkedPhone, o.aadhaarLinkedPhone),
                checkinAadhaarNumber: pickValue(o.checkinAadhaarNumber, o.aadhaarNumber, o.aadharNumber, o.kyc?.aadharNumber),
                checkinAccountHolderName: pickValue(o.checkinAccountHolderName, o.accountHolderName),
                checkinUpiId: pickValue(o.checkinUpiId, o.upiId),
                checkinAddress: pickValue(o.checkinAddress, o.address, o.profile?.address),
                checkinPassword: pickValue(o.checkinPassword, o.password, o.credentials?.password),
                checkinArea: pickValue(o.checkinArea, o.locationCode, o.profile?.locationCode, o.area),
                checkinBankName: pickValue(o.checkinBankName, o.bankName, o.profile?.bankName),
                checkinBankAccountNumber: pickValue(o.checkinBankAccountNumber, o.accountNumber, o.profile?.accountNumber),
                checkinIfscCode: pickValue(o.checkinIfscCode, o.ifscCode, o.profile?.ifscCode),
                checkinBranchName: pickValue(o.checkinBranchName, o.branchName, o.profile?.branchName)
            }));
            populateAreaFilter(owners);

            // Fetch visit data from backend and create a map of owner -> property details
            let visitMap = {};
            try {
                const visitsRes = await fetchFromAnyApi('/api/visits', {
                    headers: getAuthHeaders()
                });
                const visitsPayload = visitsRes.ok ? await visitsRes.json() : {};
                const visits = visitsPayload.visits || [];

                if (Array.isArray(visits) && visits.length > 0) {
                    visits.forEach(v => {
                        const ownerLoginId = v.generatedCredentials?.loginId || '';
                        const ownerName = (v.ownerName || v.propertyInfo?.ownerName || '').toUpperCase();
                        const monthlyRent = v.monthlyRent || v.propertyInfo?.rent || '-';
                        const deposit = v.deposit || v.propertyInfo?.deposit || '-';
                        const vacantRooms = v.vacantRooms || v.propertyInfo?.vacantRooms || 0;
                        const vacantBeds = v.vacantBeds || v.propertyInfo?.vacantBeds || 0;
                        const occupiedRooms = v.occupiedRooms || v.propertyInfo?.occupiedRooms || 0;
                        const occupiedBeds = v.occupiedBeds || v.propertyInfo?.occupiedBeds || 0;

                        if (ownerLoginId && !visitMap[ownerLoginId]) {
                            visitMap[ownerLoginId] = { monthlyRent, deposit, vacantRooms, vacantBeds, occupiedRooms, occupiedBeds };
                        }

                        if (ownerName && !visitMap[ownerName]) {
                            visitMap[ownerName] = { monthlyRent, deposit, vacantRooms, vacantBeds, occupiedRooms, occupiedBeds };
                        }
                    });
                    console.log('Loaded visit data for', Object.keys(visitMap).length, 'owners');
                }
            } catch (err) {
                console.warn('Failed to load visit data from backend:', err);
            }

            // ===== NEW: Load commission data for "To Be Paid" column =====
            let commissionMap = {};
            let latestRentMap = {};
            try {
                const commissionResponse = await fetchFromAnyApi('/api/rents', {
                    headers: getAuthHeaders()
                });
                if (commissionResponse.ok) {
                    const responseData = await commissionResponse.json();
                    // Handle both array and object responses
                    const allRents = responseData.rents || responseData || [];
                    console.log('Commission data received:', allRents.length);

                    allRents.forEach(payment => {
                        const ownerLoginId = payment.ownerLoginId || payment.owner_id || payment.loginId;
                        if (!ownerLoginId || latestRentMap[ownerLoginId]) return;
                        latestRentMap[ownerLoginId] = {
                            rentAmount: payment.rentAmount || payment.rent_amount || '-',
                            deposit: payment.deposit || '-'
                        };
                    });
                    // Filter only paid/completed payments
                    const paidPayments = allRents.filter(p => 
                        p.paymentStatus === 'completed' || 
                        p.paymentStatus === 'paid' || 
                        p.paidAmount > 0
                    );

                    console.log('Filtered paid payments:', paidPayments.length);

                    // Calculate commissions per owner
                    paidPayments.forEach(payment => {
                        const ownerLoginId = payment.ownerLoginId || payment.owner_id || payment.loginId;
                        const rentAmount = payment.rentAmount || payment.rent_amount || 0;

                        if (!commissionMap[ownerLoginId]) {
                            commissionMap[ownerLoginId] = {
                                totalRent: 0,
                                totalCommission: 0,
                                serviceFee: 0,
                                paymentCount: 0
                            };
                        }

                        commissionMap[ownerLoginId].paymentCount++;
                        
                        // First payment: 10% commission + ₹50 service fee
                        // Subsequent: ₹50 service fee only
                        let monthlyCommission = 0;
                        if (commissionMap[ownerLoginId].paymentCount === 1) {
                            monthlyCommission = rentAmount * 0.10; // 10% of rent
                        }
                        const serviceFee = 50; // Always ₹50

                        commissionMap[ownerLoginId].totalRent += rentAmount;
                        commissionMap[ownerLoginId].totalCommission += monthlyCommission;
                        commissionMap[ownerLoginId].serviceFee += serviceFee;
                    });

                    console.log('Commission map created:', Object.keys(commissionMap).length, 'owners');
                } else {
                    console.warn('Commission API returned:', commissionResponse.status);
                }
            } catch (err) {
                console.warn('Failed to load commission data:', err);
            }

            // Apply filters
            const filtered = owners.filter(o => {
                const id = o.loginId || o._id || '';
                const name = (o.name || o.profile?.name || '').toUpperCase();
                const areaCode = pickValue(o.checkinArea, o.locationCode, o.profile?.locationCode).toUpperCase();
                const areaMatch = (filterArea === 'all') || id.startsWith(filterArea) || areaCode.startsWith(filterArea);
                const searchMatch = id.toUpperCase().includes(searchText) || name.includes(searchText);
                return areaMatch && searchMatch;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="24" class="text-center py-8 text-gray-500">No owners found.</td></tr>`;
                return;
            }

            ownersLookup = {};
            filtered.forEach(o => {
                const ownerId = o.loginId || o._id || '';
                if (ownerId) ownersLookup[ownerId] = o;
            });

            currentOwnersData = filtered.map(o => {
                const id = o.loginId || o._id || '';
                const ownerName = (o.name || o.profile?.name || '').toUpperCase();
                const visitInfo = visitMap[id] || visitMap[ownerName] || {};
                const latestRentInfo = latestRentMap[id] || {};
                const statusRaw = (o.kycStatus || o.kyc?.status || '').toLowerCase();
                const derivedKycStatus = (statusRaw === 'verified' || statusRaw === 'submitted' || o.checkinOtpVerified || o.checkinSubmittedAt) ? 'Verified' : 'Pending';
                const vacantRooms = o.vacantRooms ?? visitInfo.vacantRooms ?? 0;
                const vacantBeds = o.vacantBeds ?? visitInfo.vacantBeds ?? 0;
                const occupiedRooms = o.occupiedRooms ?? visitInfo.occupiedRooms ?? 0;
                const occupiedBeds = o.occupiedBeds ?? visitInfo.occupiedBeds ?? 0;

                return {
                    "Owner ID": id,
                    "Name & Contact": [o.name || 'Unknown', o.checkinPhone || o.phone || '-', o.email || '-'].join(' | '),
                    "Property Under Owner": o.propertyTitle || o.propertyName || '-',
                    "DOB": o.checkinDob || '-',
                    "Gmail": o.email || '-',
                    "Aadhaar Linked Phone": o.checkinAadhaarLinkedPhone || '-',
                    "Aadhaar Number": o.checkinAadhaarNumber || o.aadharNumber || o.kyc?.aadharNumber || '-',
                    "Account Holder": o.checkinAccountHolderName || '-',
                    "UPI ID": o.checkinUpiId || '-',
                    "Address": o.checkinAddress || o.address || '-',
                    "Password": o.checkinPassword || o.password || o.credentials?.password || '-',
                    "Area": o.checkinArea || o.locationCode || '-',
                    "Bank Name": o.checkinBankName || o.bankName || o.profile?.bankName || '-',
                    "Account Number": o.checkinBankAccountNumber || o.accountNumber || o.profile?.accountNumber || '-',
                    "IFSC Code": o.checkinIfscCode || o.ifscCode || o.profile?.ifscCode || '-',
                    "Branch": o.checkinBranchName || o.branchName || o.profile?.branchName || '-',
                    "Vacant Rooms": vacantRooms ?? '-',
                    "Vacant Beds": vacantBeds ?? '-',
                    "Occupied Rooms": occupiedRooms ?? '-',
                    "Occupied Beds": occupiedBeds ?? '-',
                    "Monthly Rent": visitInfo.monthlyRent || latestRentInfo.rentAmount || '-',
                    "Security Deposit": visitInfo.deposit || latestRentInfo.deposit || '-',
                    "KYC Status": derivedKycStatus
                };
            });

            filtered.forEach(o => {
                const id = o.loginId || o._id || '';
                const profileName = o.name || 'Unknown';
                const propertyUnderOwner = o.propertyTitle || o.propertyName || '-';
                const email = o.email || '-';
                const phone = o.checkinPhone || o.phone || '-';
                const dob = o.checkinDob || '-';
                const aadhaarLinkedPhone = o.checkinAadhaarLinkedPhone || '-';
                const aadhaarNumber = o.checkinAadhaarNumber || o.aadharNumber || o.kyc?.aadharNumber || '-';
                const accountHolderName = o.checkinAccountHolderName || '-';
                const upiId = o.checkinUpiId || '-';
                const address = o.checkinAddress || o.address || '-';
                const credsPassword = o.checkinPassword || o.password || o.credentials?.password || '-';
                const areaCode = o.checkinArea || o.locationCode || '-';
                const ownerProfile = o.profile || {};
                const bankName = o.checkinBankName || o.bankName || ownerProfile.bankName || '-';
                const accountNumber = o.checkinBankAccountNumber || o.accountNumber || ownerProfile.accountNumber || '-';
                const ifscCode = o.checkinIfscCode || o.ifscCode || ownerProfile.ifscCode || '-';
                const branchName = o.checkinBranchName || o.branchName || ownerProfile.branchName || '-';
                const aadhar = o.aadharNumber || o.kyc?.aadharNumber || '-';
                const statusRaw = (o.kycStatus || o.kyc?.status || '').toLowerCase();
                const kycStatus = (statusRaw === 'verified' || statusRaw === 'submitted' || o.checkinOtpVerified || o.checkinSubmittedAt) ? 'verified' : 'pending';

                // Get rent and deposit from visit data
                const ownerName = (o.name || o.profile?.name || '').toUpperCase();
                const visitInfo = visitMap[id] || visitMap[ownerName] || {};
                const latestRentInfo = latestRentMap[id] || {};
                const monthlyRent = visitInfo.monthlyRent || latestRentInfo.rentAmount || '-';
                const securityDeposit = visitInfo.deposit || latestRentInfo.deposit || '-';
                const vacantRooms = o.vacantRooms ?? visitInfo.vacantRooms ?? 0;
                const vacantBeds = o.vacantBeds ?? visitInfo.vacantBeds ?? 0;
                const occupiedRooms = o.occupiedRooms ?? visitInfo.occupiedRooms ?? 0;
                const occupiedBeds = o.occupiedBeds ?? visitInfo.occupiedBeds ?? 0;
                let kycBadge = `<span class="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">Pending</span>`;
                if (kycStatus === 'pending') kycBadge = `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-bold">Pending</span>`;
                if (kycStatus === 'verified') kycBadge = `<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">Verified</span>`;

                const row = `
                    <tr class="hover:bg-gray-50 border-b border-gray-100" id="row-${id}">
                        <td class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-1 w-fit rounded text-xs">${id}</td>
                        <td>
                            <p class="font-bold text-slate-800">${profileName}</p>
                            <p class="text-xs text-gray-500">${phone}</p>
                            <p class="text-xs text-gray-400">${email}</p>
                        </td>
                        <td class="text-xs text-gray-700 font-semibold">${propertyUnderOwner}</td>
                        <td class="text-xs text-gray-700">${dob}</td>
                        <td class="text-xs text-gray-700">${email}</td>
                        <td class="text-xs text-gray-700">${aadhaarLinkedPhone}</td>
                        <td class="text-xs text-gray-700 font-mono">${aadhaarNumber}</td>
                        <td class="text-xs text-gray-700">${accountHolderName}</td>
                        <td class="text-xs text-gray-700">${upiId}</td>
                        <td class="text-sm text-gray-600 max-w-xs truncate" title="${address}">${address}</td>
                        <td><code class="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-red-500">${credsPassword}</code></td>
                        <td><span class="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">${areaCode}</span></td>
                        <td class="text-xs text-gray-700">${bankName}</td>
                        <td class="text-xs text-gray-700 font-mono">${accountNumber}</td>
                        <td class="text-xs text-gray-700 font-mono">${ifscCode}</td>
                        <td class="text-xs text-gray-700">${branchName}</td>
                        <td class="text-xs text-gray-700 font-semibold">${vacantRooms ?? '-'}</td>
                        <td class="text-xs text-gray-700 font-semibold">${vacantBeds ?? '-'}</td>
                        <td class="text-xs text-gray-700 font-semibold">${occupiedRooms ?? '-'}</td>
                        <td class="text-xs text-gray-700 font-semibold">${occupiedBeds ?? '-'}</td>
                        <td class="text-xs text-gray-700 font-semibold">${monthlyRent === '-' ? '-' : '₹' + monthlyRent}</td>
                        <td class="text-xs text-gray-700 font-semibold">${securityDeposit === '-' ? '-' : '₹' + securityDeposit}</td>
                        <td>${kycBadge}</td>
                        <td class="text-center">
                            <button onclick="deleteOwner('${id}')" class="text-red-500 hover:bg-red-50 p-2 rounded transition" title="Delete Owner">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
            lucide.createIcons();
        }

        // --- Delete Function ---
        async function deleteOwner(id) {
            if (!id) return;
            if (!confirm(`Are you sure you want to delete owner ${id}? This action cannot be undone.`)) return;

            try {
                const res = await fetchFromAnyApi(`/api/owners/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `Delete failed (HTTP ${res.status})`);
                }

                // Optional cleanup of stale local cache
                const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                if (db[id]) {
                    delete db[id];
                    localStorage.setItem('roomhy_owners_db', JSON.stringify(db));
                }

                alert('Owner deleted successfully.');
                await loadOwners();
            } catch (err) {
                if (String(err && err.message || '').includes('HTTP 404')) {
                    const row = document.getElementById(`row-${id}`);
                    if (row) row.remove();
                    alert(`Owner ${id} already deleted / not found in backend.`);
                    return;
                }
                alert(`Failed to delete owner ${id}: ${err.message}`);
            }
        }

        // --- Excel Export Function ---
        function exportToExcel() {
            if(currentOwnersData.length === 0) {
                alert("No data to export.");
                return;
            }
            
            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(currentOwnersData);
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Owners");
            
            // Generate file name with date
            const date = new Date().toISOString().split('T')[0];
            const fileName = `Roomhy_Owners_List_${date}.xlsx`;
            
            // Download
            XLSX.writeFile(wb, fileName);
        }

        // Mobile sidebar toggle
        const mobileMenuOpen = document.getElementById('mobile-menu-open');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');
        const mobileSidebarClose = document.getElementById('mobile-sidebar-close');

        if (mobileMenuOpen && mobileSidebar && mobileSidebarOverlay && mobileSidebarClose) {
            const openSidebar = () => {
                mobileSidebar.classList.remove('hidden');
                mobileSidebarOverlay.classList.remove('hidden');
                setTimeout(() => {
                    mobileSidebar.classList.remove('-translate-x-full');
                }, 10);
            };

            const closeSidebar = () => {
                mobileSidebar.classList.add('-translate-x-full');
                mobileSidebarOverlay.classList.add('hidden');
                setTimeout(() => {
                    mobileSidebar.classList.add('hidden');
                }, 300);
            };

            mobileMenuOpen.addEventListener('click', openSidebar);
            mobileSidebarClose.addEventListener('click', closeSidebar);
            mobileSidebarOverlay.addEventListener('click', closeSidebar);

            mobileSidebar.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeSidebar);
            });
        }

        loadOwners();
