lucide.createIcons();
        
        let owner = null;
        let ownerId = null;

        // --- Listen for owner context updates from ownerContextSync.js ---
        // ownerContextSync.js will both update the DOM AND fire this event
        window.addEventListener('owner-session-updated', (event) => {
            owner = event.detail || window.__ownerContext;
            if (owner) {
                ownerId = owner.ownerId || owner.loginId;
                loadTenantsFromBackend();
            }
        });

        // --- Fallback: If no context by DOMContentLoaded, redirect ---
        document.addEventListener('DOMContentLoaded', () => {
            if (!owner) {
                owner = window.__ownerContext || (typeof getCurrentOwner === 'function' ? getCurrentOwner() : null);
                if (owner) {
                    ownerId = owner.ownerId || owner.loginId;
                } else {
                    // Give ownerContextSync a moment to complete
                    setTimeout(() => {
                        owner = window.__ownerContext;
                        if (!owner) {
                            window.location.href = '/propertyowner/ownerlogin';
                        }
                    }, 500);
                }
            }
            setTimeout(loadTenantsFromBackend, 600);
        });

        let tenantTableData = [];
        let activeTenantFilter = 'all';

        function escapeHtml(text) {
            return String(text || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function maskAadhaar(value) {
            const digits = String(value || '').replace(/\D/g, '');
            if (digits.length < 4) return '-';
            return `XXXX-XXXX-${digits.slice(-4)}`;
        }

        function normalizeStatus(value) {
            const v = String(value || '').toLowerCase();
            if (v === 'active' || v === 'verified') return 'active';
            return 'inactive';
        }

        async function getOwnerPropertyIds() {
            if (!ownerId) return [];
            try {
                const res = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}/rooms`);
                if (!res.ok) return [];
                const data = await res.json();
                const props = Array.isArray(data?.properties) ? data.properties : [];
                return props.map((p) => String(p?._id || p?.id || p?.propertyId || '')).filter(Boolean);
            } catch (_) {
                return [];
            }
        }

        function renderTenantRows(tenants) {
            const tbody = document.getElementById('tenantTableBody');
            if (!tbody) return;
            if (!Array.isArray(tenants) || tenants.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-gray-500 py-8">No tenants found for this owner.</td></tr>`;
                const c = document.getElementById('tenantCountText');
                if (c) c.textContent = 'You have total of 0 tenants';
                return;
            }

            tbody.innerHTML = tenants.map((t) => {
                const status = normalizeStatus(t.status);
                const prop = t.property?.title || t.property?.name || t.propertyName || '-';
                const room = t.roomNo || t.room?.number || '-';
                const aadhaar = t.kyc?.aadhaarNumber || t.kyc?.aadhar || t.digitalCheckin?.kyc?.aadhaarNumber || '';
                const kycAvailable = !!aadhaar;
                return `
                    <tr class="tenant-row" data-status="${status}" data-tenant-id="${escapeHtml(t._id || t.id || t.loginId || '')}">
                        <td>
                            <div class="flex items-center">
                                <img class="h-10 w-10 rounded-full object-cover mr-3" src="https://i.pravatar.cc/150?u=${encodeURIComponent(t.loginId || t.name || 'tenant')}" alt="${escapeHtml(t.name || 'Tenant')}">
                                <div>
                                    <div class="font-medium text-gray-900">${escapeHtml(t.name || 'Tenant')}</div>
                                    <div class="text-xs text-gray-500">ID: ${escapeHtml(t.loginId || '-')}</div>
                                </div>
                            </div>
                        </td>
                        <td>${escapeHtml(maskAadhaar(aadhaar))}</td>
                        <td>${escapeHtml(t.phone || '-')}</td>
                        <td>${escapeHtml(prop)}</td>
                        <td>${escapeHtml(room)}</td>
                        <td data-status="${status}">
                            <select class="status-select ${status === 'active' ? 'status-select-active' : 'status-select-inactive'}">
                                <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </td>
                        <td>
                            <span class="text-xs font-medium ${kycAvailable ? 'text-green-700' : 'text-gray-500'}">
                                ${kycAvailable ? 'Submitted' : 'Pending'}
                            </span>
                        </td>
                        <td class="text-right">
                            <div class="text-xs text-gray-500">${escapeHtml(t.email || '-')}</div>
                        </td>
                    </tr>
                `;
            }).join('');

            const c = document.getElementById('tenantCountText');
            if (c) c.textContent = `You have total of ${tenants.length} tenants`;
            applyTenantFilter();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        async function loadTenantsFromBackend() {
            try {
                owner = owner || window.__ownerContext || (typeof getCurrentOwner === 'function' ? getCurrentOwner() : null);
                ownerId = ownerId || owner?.ownerId || owner?.loginId || '';
                if (!ownerId) return;

                const [propIds, res] = await Promise.all([
                    getOwnerPropertyIds(),
                    apiFetch(`/api/tenants`)
                ]);

                if (!res.ok) throw new Error(`Tenant API failed: ${res.status}`);
                const payload = await res.json();
                const tenants = Array.isArray(payload) ? payload : (payload.tenants || []);
                const ownerLoginId = String(ownerId).toUpperCase();

                tenantTableData = tenants.filter((t) => {
                    const propObj = t.property || {};
                    const propId = String(propObj._id || propObj.id || t.propertyId || '');
                    const propOwnerLogin = String(propObj.ownerLoginId || '').toUpperCase();
                    return (
                        (propIds.length > 0 && propIds.includes(propId)) ||
                        (propOwnerLogin && propOwnerLogin === ownerLoginId)
                    );
                });

                renderTenantRows(tenantTableData);
            } catch (err) {
                console.error('Failed to load tenants:', err);
                const tbody = document.getElementById('tenantTableBody');
                if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-600 py-8">Failed to load tenants from backend.</td></tr>`;
            }
        }
        
        // --- Logout Handler (per-tab) ---
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            try { sessionStorage.removeItem('owner_session'); sessionStorage.removeItem('user'); } catch(_) {}
            try { localStorage.removeItem('user'); } catch(_) {}
            window.location.href = '/propertyowner/ownerlogin';
        });
        
        // --- Reusable Modal Logic ---
        const openModal = (modalId) => {
            const modal = document.getElementById(modalId);
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.remove('hidden', 'invisible');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        };

        const closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (!modal) return; // Add check if modal exists
            const modalContent = modal.querySelector('.modal-content');
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-95', 'opacity-0');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden', 'invisible');
                // Reset form if applicable
                const form = modal.querySelector('form');
                if (form) form.reset();
                 // Reset modal title and button text for Add/Edit modal
                 if (modalId === 'tenant-modal') {
                    document.getElementById('tenant-modal-title').textContent = 'Add New Tenant';
                    document.getElementById('save-tenant-button').textContent = 'Add Tenant';
                    document.getElementById('edit-tenant-id').value = ''; // Clear edit ID
                 }

            }, 300);
        };

        // --- Add Event Listeners for Modal Buttons ---
        document.querySelectorAll('.close-modal-button, .cancel-modal-button').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Close modal when clicking overlay
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal(modal.id);
                }
            });
        });


        // --- Mobile Menu Toggle ---
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const closeMobileMenuButton = document.getElementById('close-mobile-menu');

        const openMobileMenu = () => mobileMenu.classList.remove('hidden');
        const closeMobileMenu = () => mobileMenu.classList.add('hidden');

        mobileMenuButton.addEventListener('click', openMobileMenu);
        closeMobileMenuButton.addEventListener('click', closeMobileMenu);
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
        mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));

        // --- Profile Dropdown Toggle ---
        const profileButton = document.getElementById('profile-button');
        const profileDropdown = document.getElementById('profile-dropdown');

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
            if (profileButton && !profileButton.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
                 if(!profileDropdown.classList.contains('hidden')) {
                     profileDropdown.classList.add('scale-95', 'opacity-0');
                     setTimeout(() => profileDropdown.classList.add('hidden'), 200);
                 }
            }
        });
        
        // --- Add New Tenant Button Click ---
        document.getElementById('add-new-tenant-button').addEventListener('click', () => {
            document.getElementById('tenant-modal-title').textContent = 'Add New Tenant';
            document.getElementById('save-tenant-button').textContent = 'Add Tenant';
            document.getElementById('edit-tenant-id').value = ''; // Ensure no ID for add
            document.getElementById('tenant-form').reset(); // Clear form
            openModal('tenant-modal');
        });

        // --- Edit Tenant Modal ---
        document.querySelectorAll('.open-edit-tenant-modal').forEach(button => {
            button.addEventListener('click', (event) => {
                const row = event.target.closest('.tenant-row'); // Use tenant row class
                const tenantId = row.dataset.tenantId;
                const name = row.dataset.name;
                const email = row.dataset.email;
                const phone = row.dataset.phone;
                const property = row.dataset.property;
                const room = row.dataset.room;
                const rent = row.dataset.rent;
                const date = row.dataset.date;
                const aadhaar = row.dataset.aadhaar;
                
                // Populate the modal form
                document.getElementById('tenant-modal-title').textContent = `Edit Tenant: ${name}`;
                document.getElementById('save-tenant-button').textContent = 'Save Changes';
                document.getElementById('edit-tenant-id').value = tenantId;
                document.getElementById('tenant-name').value = name;
                document.getElementById('tenant-email').value = email;
                document.getElementById('tenant-phone').value = phone;
                document.getElementById('tenant-property').value = property;
                document.getElementById('tenant-room').value = room;
                document.getElementById('tenant-move-in').value = date;
                document.getElementById('tenant-rent').value = rent;
                if(document.getElementById('tenant-aadhaar')) document.getElementById('tenant-aadhaar').value = aadhaar;
                
                openModal('tenant-modal');
            });
        });
        
        // --- Tenant Form Submission (Add/Edit Logic) ---
        document.getElementById('tenant-form').addEventListener('submit', function(event) {
            event.preventDefault();
            const isEdit = document.getElementById('edit-tenant-id').value !== '';
            
            // Collect Data
            const formData = {
                name: document.getElementById('tenant-name').value,
                email: document.getElementById('tenant-email').value,
                phone: document.getElementById('tenant-phone').value,
                property: document.getElementById('tenant-property').value,
                room: document.getElementById('tenant-room').value,
                moveIn: document.getElementById('tenant-move-in').value,
                rent: document.getElementById('tenant-rent').value,
                aadhaar: document.getElementById('tenant-aadhaar').value,
            };

            // 1. Close the Add/Edit Modal
            closeModal('tenant-modal');

            if (isEdit) {
                // Mock Edit/Update Logic
                console.log('Updating Tenant ID:', document.getElementById('edit-tenant-id').value, formData);
                
                // Show success message
                openModal('code-success-modal');
                document.getElementById('generated-tenant-code').textContent = 'Updated!';
            
            } else {
                // 2. Mock Generate Unique Code (e.g., RHY-003, RHY-ABCD)
                const newTenantCode = 'RHY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                
                // Mock Add/Create Logic
                console.log('Adding New Tenant:', formData);
                console.log('Generated Code:', newTenantCode);
                
                // 3. Display Code Success Modal
                document.getElementById('generated-tenant-code').textContent = newTenantCode;
                openModal('code-success-modal');
                
                // 4. In a real app, you would save formData and newTenantCode to the database (e.g., Firestore).
                // 5. Here, we mock updating the table (optional for this demo, as refresh would happen in real app)
            }
        });


        function applyTenantFilter() {
            const rows = document.querySelectorAll('.tenant-row');
            rows.forEach((row) => {
                if (activeTenantFilter === 'all' || row.dataset.status === activeTenantFilter) {
                    row.style.display = 'table-row';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // --- Filter Tabs Logic ---
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeTenantFilter = tab.dataset.filter || 'all';
                applyTenantFilter();
            });
        });

        // --- Status Select Color Changer (delegated) ---
        const tenantTableBody = document.getElementById('tenantTableBody');
        if (tenantTableBody) {
            tenantTableBody.addEventListener('change', async (event) => {
                const select = event.target;
                if (!select.classList.contains('status-select')) return;
                const row = select.closest('tr.tenant-row');
                if (!row) return;
                const newStatus = select.value;
                row.dataset.status = newStatus;
                if (newStatus === 'active') {
                    select.classList.add('status-select-active');
                    select.classList.remove('status-select-inactive');
                } else {
                    select.classList.add('status-select-inactive');
                    select.classList.remove('status-select-active');
                }
                applyTenantFilter();
                console.log(`Tenant ID ${row.dataset.tenantId} status changed to ${newStatus}`);
            });
        }