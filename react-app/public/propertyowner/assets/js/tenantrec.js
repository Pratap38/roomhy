lucide.createIcons();
        
        let user = null;
        let ownerId = null;
        let currentOwnerId = null;

        // Listen for owner context updates from ownerContextSync.js
        window.addEventListener('owner-session-updated', (event) => {
            user = event.detail || window.__ownerContext;
            if (user) {
                ownerId = user.ownerId || user.loginId;
                currentOwnerId = ownerId;
                updateHeader(user);
            }
        });

        function updateHeader(userData) {
            if (!userData) return;
            if (document.getElementById('headerName')) {
                document.getElementById('headerName').innerText = userData.name;
            }
            if (document.getElementById('headerAvatar')) {
                document.getElementById('headerAvatar').innerText = userData.name.charAt(0).toUpperCase();
            }
            if (document.getElementById('headerAccountId')) {
                document.getElementById('headerAccountId').innerText = `Account: ${userData.loginId || userData.ownerId}`;
            }
        }

        // --- Header Population & Init ---
        document.addEventListener('DOMContentLoaded', () => {
            if (!user) {
                user = window.__ownerContext || (typeof getCurrentOwner === 'function' ? getCurrentOwner() : null);
                if (user) {
                    ownerId = user.ownerId || user.loginId;
                    currentOwnerId = ownerId;
                    updateHeader(user);
                } else {
                    window.location.href = '/propertyowner/ownerlogin';
                    return;
                }
            }
        });
        
        // --- Logout Handler (per-tab) ---
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            try { sessionStorage.removeItem('owner_session'); sessionStorage.removeItem('user'); } catch(_) {}
            try { localStorage.removeItem('user'); } catch(_) {}
            window.location.href = '/propertyowner/ownerlogin';
        });
        
        // Variable to store filtered tenants for export
        let tenantsForExport = [];
        let tenantRecordsCache = [];

        // Sidebar & Mobile Menu Logic
        function toggleMobileMenu() {
            const sidebar = document.getElementById('mobile-sidebar');
            const overlay = document.getElementById('mobile-overlay');
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        }
        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);
        document.getElementById('mobile-overlay').addEventListener('click', toggleMobileMenu);
        document.getElementById('close-mobile-menu')?.addEventListener('click', toggleMobileMenu);

        // Main Load Function
        document.addEventListener('DOMContentLoaded', () => {
            // Get Current Owner
            loadTenantRecords();
        });

        function normalizeTenantRecord(t) {
            const profile = (t && t.digitalCheckin && t.digitalCheckin.profile) || {};
            const kyc = (t && t.digitalCheckin && t.digitalCheckin.kyc) || {};
            const propertyObj = (t && t.property && typeof t.property === 'object') ? t.property : null;
            const propertyName = (propertyObj && (propertyObj.title || propertyObj.name)) || t.propertyTitle || profile.propertyName || t.propertyName || '';

            return {
                ...t,
                name: t.name || profile.name || '',
                email: t.email || profile.email || '',
                dob: t.dob || profile.dob || '',
                guardianNumber: t.guardianNumber || profile.guardianNumber || t.emergencyContact || '',
                moveInDate: t.moveInDate || profile.moveInDate || '',
                roomNo: t.roomNo || profile.roomNo || '',
                agreedRent: (t.agreedRent !== undefined && t.agreedRent !== null) ? t.agreedRent : (profile.agreedRent || 0),
                propertyTitle: t.propertyTitle || propertyName,
                property: propertyObj || propertyName || t.property || '',
                kycStatus: t.kycStatus || ((t.kyc && t.kyc.otpVerified) || kyc.otpVerified ? 'verified' : 'pending')
            };
        }

        async function loadTenantRecords() {
            let tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]').map(normalizeTenantRecord);
            const deletedKey = 'roomhy_deleted_tenants_owner';
            const deletedTenantIds = new Set((JSON.parse(localStorage.getItem(deletedKey) || '[]') || []).map(v => String(v || '').toUpperCase()).filter(Boolean));
            // Pull latest tenants from backend and merge into local cache.
            try {
                const res = await fetch(API_URL + '/api/tenants');
                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    const backendList = Array.isArray(data) ? data : (Array.isArray(data.tenants) ? data.tenants : []);
                    if (backendList.length > 0) {
                        const normalizedBackend = backendList.map((t) => normalizeTenantRecord({
                            _id: t._id || t.id || '',
                            dbId: t._id || t.id || '',
                            id: t.id || t._id || t.loginId || '',
                            name: t.name || '',
                            phone: t.phone || '',
                            email: t.email || '',
                            loginId: t.loginId || '',
                            tempPassword: t.tempPassword || '',
                            password: t.password || t.tempPassword || '',
                            ownerLoginId: t.ownerLoginId || (t.property && t.property.ownerLoginId) || '',
                            assignedBy: t.ownerLoginId || (t.property && t.property.ownerLoginId) || t.assignedBy || '',
                            propertyId: (t.property && (t.property._id || t.property.id || t.property.propertyId)) || t.propertyId || '',
                            propertyTitle: t.propertyTitle || (t.property && (t.property.title || t.property.name)) || '',
                            property: t.property || (t.propertyTitle ? { title: t.propertyTitle } : null),
                            roomNo: t.roomNo || '',
                            bedNo: t.bedNo || '',
                            agreedRent: t.agreedRent || 0,
                            moveInDate: t.moveInDate || '',
                            status: t.status || 'pending',
                            kycStatus: t.kycStatus || 'pending',
                            dob: t.dob || (t.digitalCheckin && t.digitalCheckin.profile && t.digitalCheckin.profile.dob) || '',
                            guardianNumber: t.guardianNumber || (t.digitalCheckin && t.digitalCheckin.profile && t.digitalCheckin.profile.guardianNumber) || '',
                            digitalCheckin: t.digitalCheckin || {},
                            kyc: t.kyc || {}
                        }));
                        const merged = [...tenants];
                        normalizedBackend.forEach((bt) => {
                            const idx = merged.findIndex((lt) => String(lt.loginId || '').toUpperCase() === String(bt.loginId || '').toUpperCase());
                            if (idx > -1) merged[idx] = { ...merged[idx], ...bt };
                            else merged.push(bt);
                        });
                        tenants = merged.filter(t => {
                            const key = String(t.loginId || '').toUpperCase();
                            const idKey = String(t._id || t.id || t.dbId || '').toUpperCase();
                            return !deletedTenantIds.has(key) && !deletedTenantIds.has(idKey);
                        });
                        localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                    }
                }
            } catch (err) {
                console.warn('tenantrec backend sync failed, using local cache only', err && err.message);
            }
            tenants = tenants.filter(t => {
                const key = String(t.loginId || '').toUpperCase();
                const idKey = String(t._id || t.id || t.dbId || '').toUpperCase();
                return !deletedTenantIds.has(key) && !deletedTenantIds.has(idKey);
            });
            // Build a property map so we can resolve property IDs to names/location codes
            let propMap = {};
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                const res = await fetch(API_URL + '/api/properties', { headers });
                if (res.ok) {
                    const data = await res.json();
                    const props = (data && data.success && Array.isArray(data.properties)) ? data.properties : (data.properties || []);
                    props.forEach(p => {
                        const id = p._id || p.id || p.propertyId || p.name || p.title;
                        propMap[id] = p;
                    });
                }
            } catch (err) {
                // ignore and fallback to localStorage below
            }

            // Merge local properties as fallback
            try {
                const localProps = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                localProps.forEach(lp => {
                    const id = lp.id || lp._id || lp.propertyId || lp.title || lp.name;
                    if (!propMap[id]) propMap[id] = lp;
                });
            } catch (err) {}
            const tbody = document.getElementById('all-tenants-body');
            tbody.innerHTML = '';

            // Filter Logic (Search Bar + Owner Filter)
            const search = document.getElementById('tenantSearch').value.toLowerCase();
            
            const filteredTenants = tenants.filter(t => {
                // 1. Filter by Owner (Assigned By)
                // If currentOwnerId is set, only show tenants assigned by them
                const tOwner = String(t.ownerLoginId || t.assignedBy || '').toUpperCase();
                const myId = String(currentOwnerId || '').toUpperCase();
                const isMyTenant = currentOwnerId ? (tOwner === myId) : true;

                // 2. Search Filter
                const matchesSearch = (t.name || '').toLowerCase().includes(search) ||
                                      (t.loginId || '').toLowerCase().includes(search) ||
                                      (t.phone || '').includes(search);
                
                return isMyTenant && matchesSearch;
            });
            
            // Update global variable for export
            // Resolve property references for display/export: if tenant.property is an id string, replace with object from propMap
            const resolved = filteredTenants.map(t => {
                const copy = Object.assign({}, t);
                if (copy.property && typeof copy.property === 'string') {
                    // Try by id first
                    if (propMap[copy.property]) {
                        copy.property = propMap[copy.property];
                    } else {
                        // Try to match by title/name
                        const byTitle = Object.values(propMap).find(p => (p.title || p.name) === copy.property);
                        if (byTitle) copy.property = byTitle;
                    }
                }
                return copy;
            });
            tenantRecordsCache = resolved;
            tenantsForExport = resolved;

            if (filteredTenants.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">No records found.</td></tr>';
                return;
            }

            resolved.forEach(t => {
                // Dates
                const moveIn = t.moveInDate ? new Date(t.moveInDate).toLocaleDateString() : '-';
                
                // Move Out Button Logic
                let moveOutHtml = '';
                if (t.status === 'moved_out') {
                    moveOutHtml = `<span class="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">Left: ${t.moveOutDate ? new Date(t.moveOutDate).toLocaleDateString() : '-'}</span>`;
                } else {
                    moveOutHtml = `
                        <button onclick="moveOutTenant('${t.loginId}')" class="flex items-center gap-1 text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 px-2 py-1 rounded transition shadow-sm">
                            <i data-lucide="log-out" class="w-3 h-3"></i> Move Out
                        </button>`;
                }

                // Password Display (Usually hidden, but requested)
                const passwordDisplay = t.password ? 
                    `<span class="font-mono bg-gray-100 px-1 rounded text-gray-700 select-all" title="Current Password">${t.password}</span>` : 
                    `<span class="text-gray-400 italic">Blocked/Not Set</span>`;

                // Guardian Info
                const guardian = t.guardianNumber || t.emergencyContact || '<span class="text-gray-400">-</span>';

                // Status Badge
                let statusBadge = '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Active</span>';
                if(t.status === 'moved_out') statusBadge = '<span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Inactive</span>';
                else if(t.status === 'pending') statusBadge = '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Onboarding</span>';

                // KYC Badge
                let kycBadge = '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">Not Submitted</span>';
                if(t.kycStatus === 'submitted') kycBadge = '<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">Review Pending</span>';
                if(t.kycStatus === 'verified') kycBadge = '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Verified</span>';
                if(t.kycStatus === 'rejected') kycBadge = '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Rejected</span>';


                const address = t.address || '<span class="text-gray-400 italic">Not filled</span>';
                const dob = t.dob || '-';
                
                const row = `
                    <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        <!-- 1. Tenant Identity -->
                        <td>
                            <div class="flex items-center">
                                <div class="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 text-sm border border-purple-200">${(t.name || '?').charAt(0)}</div>
                                <div>
                                    <div class="font-semibold text-gray-900 text-sm">${t.name}</div>
                                    <div class="text-xs text-gray-500">${t.phone}</div>
                                    <div class="text-xs text-gray-400">${t.email || ''}</div>
                                </div>
                            </div>
                        </td>
                        
                        <!-- 2. Credentials -->
                        <td>
                            <div class="text-xs">
                                <div class="mb-1">ID: <span class="font-mono font-bold text-purple-700 select-all">${t.loginId}</span></div>
                                <div>Pass: ${passwordDisplay}</div>
                            </div>
                        </td>

                        <!-- 3. Personal Details -->
                        <td>
                            <div class="text-xs text-gray-600 space-y-1">
                                <div><strong>Guardian:</strong> ${guardian}</div>
                                <div><strong>DOB:</strong> ${dob}</div>
                                <div class="truncate max-w-[150px]" title="${t.address}"><strong>Addr:</strong> ${address}</div>
                            </div>
                        </td>

                        <!-- 4. Room Info -->
                        <td>
                            <div class="text-sm text-gray-800 font-medium">${
                                (typeof t.property === 'object' && t.property !== null)
                                    ? `${t.property.title || t.property.name || 'Property'}${t.property.locationCode ? ' (' + t.property.locationCode + ')' : ''}`
                                    : (t.property || 'Unknown Property')
                            }</div>
                            <div class="text-xs text-gray-500">Room ${t.roomNo}, Bed ${t.bedNo}</div>
                            <div class="text-xs font-medium text-green-600 mt-0.5">Rent: ₹${t.agreedRent}</div>
                        </td>
                        <td class="font-mono text-sm text-gray-700">${(typeof t.property === 'object' && t.property !== null) ? (t.property.locationCode || '-') : (t.locationCode || '-')}</td>

                        <!-- 5. Move In/Out -->
                        <td>
                            <div class="text-xs text-gray-600">
                                <div class="mb-2"><strong>In:</strong> ${moveIn}</div>
                                <div>${moveOutHtml}</div>
                            </div>
                        </td>

                        <!-- 6. Status -->
                        <td>${statusBadge}</td>

                         <!-- 7. KYC Status -->
                        <td>${kycBadge}</td>

                        <!-- 8. Actions (Delete) -->
                        <td class="text-right">
                             <button onclick="deleteTenant('${t.loginId || ''}','${t._id || t.id || t.dbId || ''}')" class="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition" title="Permanently Delete">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
            lucide.createIcons();
        }

        function filterTenants() {
            loadTenantRecords();
        }

        // --- Move Out Logic ---
        function moveOutTenant(loginId) {
            if(!confirm("Are you sure you want to move out this tenant? \n\nThis will:\n1. Set status to 'Moved Out'\n2. Record today's date as exit date\n3. Block their login access.")) return;
            
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const idx = tenants.findIndex(t => t.loginId === loginId);
            
            if(idx !== -1) {
                tenants[idx].status = 'moved_out';
                tenants[idx].moveOutDate = new Date().toISOString();
                // Block Login by clearing password or setting a flag
                tenants[idx].password = null; 
                
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                loadTenantRecords();
                alert("Tenant moved out successfully. Login access blocked.");
            }
        }

        // --- Delete Logic ---
        async function deleteTenant(loginId, dbId) {
            if (!confirm("Permanently delete this record? This cannot be undone.")) return;

            const normalizedLoginId = String(loginId || '').toUpperCase();
            const normalizedDbId = String(dbId || '').trim();
            const deletedKey = 'roomhy_deleted_tenants_owner';
            const target = (Array.isArray(tenantRecordsCache) ? tenantRecordsCache : [])
                .find(t =>
                    (normalizedLoginId && String(t.loginId || '').toUpperCase() === normalizedLoginId) ||
                    (normalizedDbId && String(t._id || t.id || t.dbId || '') === normalizedDbId)
                );

            let deletedInBackend = false;
            try {
                const token = localStorage.getItem('token');
                const backendId = normalizedDbId || (target && (target._id || target.id || target.dbId));
                if (token && backendId) {
                    const res = await fetch(`${API_URL}/api/tenants/${encodeURIComponent(String(backendId))}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    deletedInBackend = res.ok;
                }
            } catch (err) {
                console.warn('tenantrec backend delete failed:', err);
            }

            let tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            tenants = (Array.isArray(tenants) ? tenants : []).filter(t => {
                const tLogin = String(t.loginId || '').toUpperCase();
                const tId = String(t._id || t.id || t.dbId || '');
                if (normalizedLoginId && tLogin === normalizedLoginId) return false;
                if (normalizedDbId && tId === normalizedDbId) return false;
                return true;
            });
            localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));

            try {
                const rooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
                let touched = false;
                (Array.isArray(rooms) ? rooms : []).forEach(room => {
                    if (!Array.isArray(room.beds)) return;
                    room.beds.forEach((bed, i) => {
                        const bedTenantId = String((bed && bed.tenantId) || '').toUpperCase();
                        if ((normalizedLoginId && bedTenantId === normalizedLoginId) || (normalizedDbId && bedTenantId === normalizedDbId.toUpperCase())) {
                            room.beds[i] = { status: 'available', tenantId: null, tenantName: null };
                            touched = true;
                        }
                    });
                });
                if (touched) localStorage.setItem('roomhy_rooms', JSON.stringify(rooms));
            } catch (_) {}

            const deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]');
            const deleteMarker = normalizedLoginId || normalizedDbId;
            let updatedDeleted = Array.from(new Set([...(Array.isArray(deletedIds) ? deletedIds : []), deleteMarker]));
            if (deletedInBackend) {
                updatedDeleted = updatedDeleted.filter(v => String(v || '').toUpperCase() !== String(deleteMarker || '').toUpperCase());
            }
            localStorage.setItem(deletedKey, JSON.stringify(updatedDeleted));

            loadTenantRecords();
        }

        // Mobile menu handlers
        document.getElementById('mobile-menu-open').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.remove('hidden');
        });

        document.getElementById('close-mobile-menu').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('mobile-menu-overlay').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        function exportToExcel() {
            // Uses tenantsForExport which is populated by the search/filter logic
            // or falls back to loading fresh if needed. 
            // Here we reconstruct based on current filtered view to be precise.
            
            if(tenantsForExport.length === 0) return alert("No data to export.");
            
            const data = tenantsForExport.map(t => ({
                "Tenant Name": t.name,
                "Login ID": t.loginId,
                "Phone": t.phone,
                "Email": t.email || '-',
                "Guardian Contact": t.guardianNumber || t.emergencyContact || '-',
                "DOB": t.dob || '-',
                "Address": t.address || '-',
                "Property": (typeof t.property === 'object' && t.property !== null) ? (t.property.title || t.property.name) : (t.property || '-'),
                "Location Code": (typeof t.property === 'object' && t.property !== null) ? (t.property.locationCode || '-') : (t.locationCode || '-'),
                "Room": t.roomNo,
                "Bed": t.bedNo,
                "Rent Amount": t.agreedRent,
                "Move In Date": t.moveInDate ? new Date(t.moveInDate).toLocaleDateString() : '-',
                "Move Out Date": t.moveOutDate ? new Date(t.moveOutDate).toLocaleDateString() : '-',
                "Status": t.status,
                "KYC Status": t.kycStatus || 'Not Submitted'
            }));
            
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Tenant_Records");
            XLSX.writeFile(wb, "Roomhy_Tenant_Records.xlsx");
        }
