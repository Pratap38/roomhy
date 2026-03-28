// Debug: Log auth info at page load
console.log('[Manager] Page loading...');
console.log('[Manager] Storage - User:', localStorage.getItem('user') ? 'YES' : 'NO');
console.log('[Manager] Storage - Token:', localStorage.getItem('token') ? 'YES' : 'NO');
console.log('[Manager] SessionStorage - Token:', sessionStorage.getItem('token') ? 'YES' : 'NO');

const API_BASE = window.API_BASE || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://api.roomhy.com');
// Assign to window to avoid redeclaration errors on re-renders
if (!window.API_BASE) window.API_BASE = API_BASE;

// Persist auth info to window if available
if (localStorage.getItem('token')) {
    window.authToken = localStorage.getItem('token');
    console.log('[Manager] Set window.authToken from localStorage');
}
if (localStorage.getItem('user')) {
    window.authUser = JSON.parse(localStorage.getItem('user'));
    console.log('[Manager] Set window.authUser from localStorage');
}

function initManagerSocket() {
    if (window.connectSocket) {
        window.connectSocket('manager');
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManagerSocket);
} else {
    initManagerSocket();
}

lucide.createIcons();
        let currentTeamFilter = 'All';
        
        // In-memory employees cache (do NOT use localStorage for employees)
        let employeesCache = [];
        // Always keep the currently rendered table rows for accurate counter display
        let displayedEmployees = [];
        
        // Global store for Cities and Areas
        let citiesData = [];
        let areasData = [];

        const allPermissions = [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'teams', label: 'Teams' },
            { id: 'owners', label: 'Property Owners' },
            { id: 'properties', label: 'Properties' },
            { id: 'tenants', label: 'Tenants' },
            { id: 'new_signups', label: 'New Signups' },
            { id: 'web_enquiry', label: 'Web Enquiry' },
            { id: 'enquiries', label: 'Enquiries' },
            { id: 'bookings', label: 'Bookings' },
            { id: 'reviews', label: 'Reviews' },
            { id: 'complaint_history', label: 'Complaint History' },
            { id: 'live_properties', label: 'Live Properties' },
            { id: 'rent_collections', label: 'Rent Collections' },
            { id: 'commissions', label: 'Commissions' },
            { id: 'refunds', label: 'Refunds' },
            { id: 'locations', label: 'Locations' },
            { id: 'visits', label: 'Visit Reports' }
        ];
        let selectedPermissions = new Set();

async function initManagerApp() {
    loadLocationsFromStorage();
    renderPermissions();
    await syncEmployeesFromBackend(); // Fetch employees from backend first
    loadEmployees();
    updateCounts();
    initLocationSync();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManagerApp);
} else {
    initManagerApp();
}

        // Load employees from localStorage cache (fallback when backend is unavailable)
        function loadEmployeesFromCache() {
            try {
                const cache = JSON.parse(localStorage.getItem('roomhy_employees_cache') || 'null');
                if (Array.isArray(cache) && cache.length) {
                    employeesCache = cache.map(e => ({ ...e }));
                    console.log('Loaded', employeesCache.length, 'employees from localStorage cache');
                    return true;
                }
            } catch (e) {
                console.warn('Failed to load employees cache from localStorage:', e);
            }
            return false;
        }

        // Helper: detect if a password is a bcrypt hash (starts with $2b$ or $2a$)
        function isBcryptHash(password) {
            if (!password || typeof password !== 'string') return false;
            return password.startsWith('$2b$') || password.startsWith('$2a$');
        }

        // Listen for location changes from location via BroadcastChannel or storage events
        function initLocationSync() {
            // Try BroadcastChannel first (modern browsers, cross-tab communication)
            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const locationChannel = new BroadcastChannel('roomhy_locations');
                    locationChannel.addEventListener('message', (event) => {
                        if (event.data && event.data.type === 'locations-updated') {
                            refreshLocationsFromStorage();
                        }
                    });
                }
            } catch (e) {
                // Fallback to storage events for same-tab updates
                window.addEventListener('storage', (event) => {
                    if (event.key === 'roomhy_locations_updated_at') {
                        refreshLocationsFromStorage();
                    }
                });
            }
        }

        // Refresh locations from localStorage and update UI
        function refreshLocationsFromStorage() {
            loadLocationsFromStorage();
            loadEmployees();
            // Notify user (optional visual indicator)
            console.log('Locations updated from location');
        }

        // --- 1. LOCATION DATA LOADING (Linked to MongoDB via location) ---
        async function loadLocationsFromStorage() {
            try {
                // First try to fetch from MongoDB API
                const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:5001'
                    : 'https://api.roomhy.com';
                
                // Fetch cities from MongoDB
                const citiesResponse = await fetch(`${apiBase}/api/locations/cities`);
                const citiesResult = await citiesResponse.json();
                citiesData = (citiesResult.data || []).map(city => ({
                    id: city._id || city.id,
                    name: city.name || city.cityName,
                    state: city.state || '',
                    status: 'Active',
                    image: city.imageUrl || city.image
                }));

                // Fetch areas from MongoDB
                const areasResponse = await fetch(`${apiBase}/api/locations/areas`);
                const areasResult = await areasResponse.json();
                areasData = (areasResult.data || []).map(area => ({
                    id: area._id || area.id,
                    name: area.name || area.areaName,
                    city: area.city || area.cityName,
                    cityName: area.cityName || (area.city && area.city.name) || '',
                    pincode: area.pincode || '',
                    status: 'Active',
                    image: area.imageUrl || area.image
                }));

                // If no data from API, use fallback from localStorage
                if (citiesData.length === 0) {
                    citiesData = JSON.parse(localStorage.getItem('roomhy_cities') || '[]');
                }
                if (areasData.length === 0) {
                    areasData = JSON.parse(localStorage.getItem('roomhy_areas') || '[]');
                }
                
            } catch (error) {
                console.log('Error fetching from MongoDB, using fallback:', error.message);
                // Read from roomhy_cities and roomhy_areas (Must match keys from location)
                citiesData = JSON.parse(localStorage.getItem('roomhy_cities') || '[]');
                areasData = JSON.parse(localStorage.getItem('roomhy_areas') || '[]');
            }

            // FALLBACK: Ensure defaults exist if no data available
            if (citiesData.length === 0) {
                citiesData = [
                    { id: 'ct_1', name: 'Bangalore', state: 'Karnataka', status: 'Active' },
                    { id: 'ct_2', name: 'Chennai', state: 'Tamil Nadu', status: 'Active' },
                    { id: 'ct_3', name: 'Coimbatore', state: 'Tamil Nadu', status: 'Active' }
                ];
                // Save to ensure persistence across pages (simulating backend)
                localStorage.setItem('roomhy_cities', JSON.stringify(citiesData));
            }

            if (areasData.length === 0) {
                areasData = [
                    { id: 'ar_1', name: 'Koramangala', city: 'Bangalore', pincode: '560034', status: 'Active' },
                    { id: 'ar_2', name: 'Indiranagar', city: 'Bangalore', pincode: '560038', status: 'Active' },
                    { id: 'ar_3', name: 'Anna Nagar', city: 'Chennai', pincode: '600040', status: 'Active' },
                    { id: 'ar_4', name: 'T Nagar', city: 'Chennai', pincode: '600017', status: 'Active' },
                    { id: 'ar_5', name: 'Gandhipuram', city: 'Coimbatore', pincode: '641012', status: 'Active' }
                ];
                localStorage.setItem('roomhy_areas', JSON.stringify(areasData));
            }
            
            // Populate Filter Dropdowns
            const filterCity = document.getElementById('filterCity');
            const modalCity = document.getElementById('modalCity');

            // Clear existing to avoid duplicates on reload
            filterCity.innerHTML = '<option value="">All Cities</option>';
            modalCity.innerHTML = '<option value="">Select City</option>';

            citiesData.forEach(c => {
                filterCity.add(new Option(c.name, c.name));
                modalCity.add(new Option(c.name, c.name));
            });
        }

        // Update Filter Area Dropdown
        function updateAreaDropdown() {
            const city = document.getElementById('filterCity').value;
            const areaSelect = document.getElementById('filterArea');
            areaSelect.innerHTML = '<option value="">All Areas</option>';

            const relevantAreas = city ? areasData.filter(a => a.cityName === city) : areasData;
            relevantAreas.forEach(a => areaSelect.add(new Option(a.name, a.name)));

            applyFilters();
        }

        // Update Modal Area Dropdown
        function updateModalAreaDropdown() {
            const city = document.getElementById('modalCity').value;
            const areaSelect = document.getElementById('modalArea');
            areaSelect.innerHTML = '<option value="">Select Area</option>';

            const relevantAreas = city ? areasData.filter(a => a.cityName === city) : [];
            relevantAreas.forEach(a => areaSelect.add(new Option(a.name, a.name)));
        }

        // --- 2. Filter Logic ---
        function filterTeam(role) {
            currentTeamFilter = role;
            document.querySelectorAll('.team-card').forEach(c => c.classList.remove('active'));
            
            let idMap = { 
                'All': 'box-all', 'Marketing Team': 'box-marketing', 'Accounts Department': 'box-accounts', 
                'Maintenance Team': 'box-maintenance', 'Customer Support': 'box-support', 'Custom': 'box-custom'
            };
            if(idMap[role]) document.getElementById(idMap[role]).classList.add('active');
            applyFilters();
        }

        function applyFilters() {
            const city = document.getElementById('filterCity').value;
            const area = document.getElementById('filterArea').value;
            // Update Title based on filters
            let title = currentTeamFilter;
            if (city) title += ` (${city})`;
            if (area) title += ` - ${area}`;
            
            document.getElementById('currentTeamLabel').innerText = title;
            loadEmployees();
        }

        // --- 3. Employee CRUD ---
        // Sync employees from backend MongoDB into in-memory cache
        async function syncEmployeesFromBackend() {
            try {
                console.log('Starting employee sync from backend...');
                const res = await fetch(`${API_BASE}/api/employees`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && Array.isArray(data.data)) {
                        console.log('Backend returned', data.data.length, 'employees');
                        // Load any local cache to preserve photoDataUrl/password
                        let localCache = [];
                        try { localCache = JSON.parse(localStorage.getItem('roomhy_employees_cache') || '[]') || []; } catch(e) { localCache = []; }

                        // Convert MongoDB employees to local in-memory format, merging with local cache
                        employeesCache = data.data.map(emp => {
                            const base = {
                                id: emp._id,
                                name: emp.name,
                                loginId: emp.loginId,
                                email: emp.email,
                                phone: emp.phone,
                                password: emp.password || '',
                                role: emp.role,
                                area: emp.area,
                                areaCode: emp.areaCode,
                                city: emp.city,
                                permissions: emp.permissions || [],
                                parentLoginId: emp.parentLoginId,
                                isActive: emp.isActive !== false,
                                _synced: true,
                                _dbId: emp._id
                            };
                            // find matching cached entry by loginId
                            const cached = localCache.find(c => c.loginId === emp.loginId) || {};
                            // Preserve photoDataUrl and password from cache if backend doesn't provide
                            base.photoDataUrl = emp.photoDataUrl || emp.photoUrl || emp.photo || cached.photoDataUrl || '';
                            
                            // For password: if backend returns a bcrypt hash, use the cached plain password instead
                            // (bcrypt hashes should not be displayed to user; we keep the original plain text)
                            if (isBcryptHash(emp.password)) {
                                // Backend returned a hash; use cached plain password if available
                                base.password = cached.password || emp.password || '';
                                console.log('Password is bcrypt hash for', emp.loginId, '- using cached plain password');
                            } else {
                                // Backend returned plain text or nothing; use as-is or fallback to cache
                                base.password = emp.password || cached.password || '';
                            }
                            return base;
                        });

                        // Also merge in any local-only employees (not returned by backend)
                        const localOnly = (localCache || []).filter(c => !employeesCache.find(e => e.loginId === c.loginId));
                        if (localOnly.length) {
                            console.log('Merging', localOnly.length, 'local-only employees into cache');
                            employeesCache = employeesCache.concat(localOnly.map(c => ({ ...c, _synced: false })));
                        }

                        // Persist merged cache for future fallback
                        try { localStorage.setItem('roomhy_employees_cache', JSON.stringify(employeesCache)); } catch(e) { console.warn('Could not persist merged employees cache:', e); }

                        // IMPORTANT: Update roomhy_employees with plain passwords for index login
                        // Extract login credentials (loginId + password only)
                        const loginCredsArray = employeesCache.map(emp => ({
                            loginId: emp.loginId,
                            password: emp.password,
                            name: emp.name,
                            role: emp.role || 'employee',
                            team: emp.role || emp.team || 'Employee',
                            email: emp.email || '',
                            permissions: emp.permissions || [],
                            area: emp.area || '',
                            areaName: emp.area || '',
                            areaCode: emp.areaCode || ''
                        }));
                        try { 
                            localStorage.setItem('roomhy_employees', JSON.stringify(loginCredsArray));
                            console.log('? Updated roomhy_employees with', loginCredsArray.length, 'credentials for login');
                        } catch(e) { 
                            console.warn('Could not update roomhy_employees:', e); 
                        }

                        console.log('Employees loaded into memory. Count:', employeesCache.length);
                    } else {
                        console.warn('Backend returned invalid employee data:', data);
                        // Try fallback to cached employees in localStorage
                        if (!loadEmployeesFromCache()) employeesCache = [];
                    }
                } else {
                    console.warn('Backend fetch returned status:', res.status);
                    // Fallback to cached employees in localStorage
                    if (!loadEmployeesFromCache()) employeesCache = [];
                }
            } catch (err) {
                console.warn('Failed to sync employees from backend:', err.message);
                // Try load from cache if fetch fails
                if (!loadEmployeesFromCache()) employeesCache = [];
            }
        }

        function loadEmployees(skipAutoSync = false) {
            let employees = Array.isArray(employeesCache) ? employeesCache.slice() : [];
            const tbody = document.getElementById('employeesTableBody');
            const empty = document.getElementById('emptyState');
            const filterCity = document.getElementById('filterCity')?.value || '';
            const filterArea = document.getElementById('filterArea')?.value || '';
            
            // Debug: Log current state
            console.log('loadEmployees: Found', employees.length, 'employees in memory');
            console.log('   Filters - Team:', currentTeamFilter, 'City:', filterCity || 'All', 'Area:', filterArea || 'All');
            
            if (employees.length === 0) {
                // Prevent infinite re-sync loop when backend truly has zero employees
                if (!skipAutoSync) {
                    console.warn('No employees currently in memory. Attempting one sync from backend...');
                    syncEmployeesFromBackend().then(() => {
                        loadEmployees(true); // Retry render once after sync
                    }).catch(() => {
                        // If fetch fails, show empty state
                        tbody.innerHTML = '';
                        empty.classList.remove('hidden');
                        displayedEmployees = [];
                        updateCounts();
                    });
                    return;
                }
                tbody.innerHTML = '';
                empty.classList.remove('hidden');
                displayedEmployees = [];
                updateCounts([]);
                return;
            }

            const filtered = employees.filter(e => {
                const matchRole = currentTeamFilter === 'All' || e.role === currentTeamFilter;
                const matchCity = !filterCity || e.city === filterCity;
                const matchArea = !filterArea || e.area === filterArea;
                const isActive = (typeof e.isActive === 'undefined') ? true : !!e.isActive; // Default to active if not set
                const passes = matchRole && matchCity && matchArea && isActive;
                if (!passes) console.log('   Filtered out:', e.name, '- Role:', e.role, 'City:', e.city, 'Area:', e.area, 'Active:', isActive);
                return passes;
            });
            
            console.log('   After filters:', filtered.length, 'employees passed');

            if(filtered.length === 0) {
                tbody.innerHTML = '';
                empty.classList.remove('hidden');
                displayedEmployees = [];
                updateCounts([]);
                return;
            }
            empty.classList.add('hidden');
            displayedEmployees = filtered.slice();
            tbody.innerHTML = filtered.map(e => {
                const active = (typeof e.isActive === 'undefined') ? true : !!e.isActive;
                // Generate avatar with initials or use photo
                let avatarHtml = '';
                if (e.photoDataUrl) {
                    avatarHtml = `<img src="${e.photoDataUrl}" class="w-10 h-10 rounded-full object-cover border border-gray-200">`;
                } else {
                    const initials = e.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '--';
                    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
                    const colorIdx = e.loginId.charCodeAt(0) % colors.length;
                    avatarHtml = `<div class="w-10 h-10 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white text-xs font-bold">${initials}</div>`;
                }
                return `
                <tr class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="px-6 py-4 flex items-center gap-3">
                        ${avatarHtml}
                        <div>
                            <div class="font-medium text-gray-900 text-sm">${e.name} ${e.parentLoginId ? '<span class="text-xs text-gray-400">(Reports to ' + e.parentLoginId + ')</span>' : ''}</div>
                            <div class="text-xs text-gray-500">${e.phone}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4"><span class="bg-white border px-2 py-1 rounded text-xs font-semibold">${e.role}</span></td>
                    <td class="px-6 py-4 text-sm text-gray-600">${e.area || '-'}, <span class="text-xs text-gray-400">${e.city || '-'}</span></td>
                    <td class="px-6 py-4"><code class="text-xs ${active ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'} px-2 py-1 rounded font-bold">${e.loginId}</code>
                        ${!active ? '<div class="text-xs text-red-600 mt-1">Disabled</div>' : ''}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="editEmployee('${e.id}')" class="p-1.5 text-gray-400 hover:text-purple-600" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="viewCredentials('${e.loginId}', '${e.password || ''}')" class="p-1.5 text-gray-400 hover:text-blue-600" title="View Credentials"><i data-lucide="key" class="w-4 h-4"></i></button>
                        ${active ? `<button onclick="logoutEmployee('${e.loginId}')" class="p-1.5 text-gray-400 hover:text-red-600" title="Logout"><i data-lucide="log-out" class="w-4 h-4"></i></button>` : `<button onclick="reactivateEmployee('${e.loginId}')" class="p-1.5 text-gray-400 hover:text-green-600" title="Reactivate"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>`}
                        <button onclick="openSubEmployeeModal('${e.loginId}')" class="p-1.5 text-gray-400 hover:text-indigo-600" title="Add Sub-employee"><i data-lucide="user-plus" class="w-4 h-4"></i></button>
                        <button onclick="deleteEmp('${e.id}')" class="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `}).join('');
            lucide.createIcons();
            updateCounts(filtered);
        }

        function updateCounts(sourceList) {
            const db = Array.isArray(sourceList)
                ? sourceList
                : (Array.isArray(displayedEmployees) ? displayedEmployees : []);
            const count = (role) => db.filter(e => e.role === role).length;
            document.getElementById('count-all').innerText = db.length;
            ['Marketing Team', 'Accounts Department', 'Maintenance Team', 'Customer Support', 'Custom'].forEach(r => {
                const id = r.split(' ')[0].toLowerCase();
                const el = document.getElementById(`count-${id === 'customer' ? 'support' : id}`);
                if(el) el.innerText = count(r);
            });
        }

        // --- Permission UI ---
        function renderPermissions() {
            document.getElementById('permissionsContainer').innerHTML = allPermissions.map(p => `
                <div class="permission-item" onclick="togglePerm('${p.id}', this)">
                    <div class="w-4 h-4 border rounded bg-white flex-shrink-0 checkbox-ui"></div>
                    <span class="text-xs font-medium text-gray-700">${p.label}</span>
                </div>`).join('');
        }
        function togglePerm(id, el) {
            if(selectedPermissions.has(id)) { selectedPermissions.delete(id); el.classList.remove('selected'); el.querySelector('.checkbox-ui').innerHTML=''; el.querySelector('.checkbox-ui').classList.remove('bg-purple-600'); } 
            else { selectedPermissions.add(id); el.classList.add('selected'); el.querySelector('.checkbox-ui').innerHTML='<i data-lucide="check" class="w-3 h-3 text-white"></i>'; el.querySelector('.checkbox-ui').classList.add('bg-purple-600'); lucide.createIcons(); }
        }
        function selectAllPerms() { allPermissions.forEach(p => { if(!selectedPermissions.has(p.id)) togglePerm(p.id, document.querySelectorAll('.permission-item')[allPermissions.indexOf(p)]); }); }
        function clearPerms() { selectedPermissions.forEach(id => togglePerm(id, document.querySelectorAll('.permission-item')[allPermissions.findIndex(p=>p.id===id)])); }

        // --- Actions ---
        function getLocalCode() {
            const area = document.getElementById('modalArea')?.value || '';
            const city = document.getElementById('modalCity')?.value || '';
            const base = (area || city || '').replace(/[^A-Za-z]/g, '').toUpperCase();
            return base.slice(0, 4);
        }

        function generateCreds() {
            // Generate login id using RY + local code (area/city) + 4 digits
            const localCode = getLocalCode();
            const prefix = localCode ? `RY${localCode}` : 'RY';
            const genId = prefix + Math.floor(1000 + Math.random() * 9000);
            document.getElementById('empLoginId').value = genId;
            document.getElementById('empPassword').value = Math.random().toString(36).slice(-8).toUpperCase();
        }


        // Handle employee profile photo upload using backend API (Cloudinary)
        async function handleEmpPhotoUpload(input) {
            if (!input) return;
            const file = input.files && input.files[0];
            if (!file) return;
            const preview = document.getElementById('empPhotoPreview');
            if (preview) {
                preview.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-full"><p class="text-xs text-gray-500">Uploading...</p></div>';
            }
            const formData = new FormData();
            formData.append('profilePhoto', file);
            try {
                const res = await fetch(`${API_BASE}/api/upload-profile-photo`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    const dataInput = document.getElementById('empPhotoDataUrl');
                    if (dataInput) dataInput.value = data.url;
                    if (preview) {
                        preview.innerHTML = `<img src="${data.url}" class="w-full h-full rounded-full object-cover">`;
                    }
                } else {
                    if (preview) preview.innerHTML = '<span>Failed to upload</span>';
                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                    const dataInput = document.getElementById('empPhotoDataUrl');
                    if (dataInput) dataInput.value = '';
                    updateEmpPhotoPreview();
                }
            } catch (err) {
                if (preview) preview.innerHTML = '<span>Failed to upload</span>';
                alert('Upload error: ' + err.message);
                const dataInput = document.getElementById('empPhotoDataUrl');
                if (dataInput) dataInput.value = '';
                updateEmpPhotoPreview();
            }
        }

        // Update photo preview with initials if no photo
        function updateEmpPhotoPreview() {
            const nameInput = document.getElementById('empName');
            const dataInput = document.getElementById('empPhotoDataUrl');
            const preview = document.getElementById('empPhotoPreview');
            if (!nameInput || !dataInput || !preview) return;
            const name = nameInput.value.trim();
            const photoUrl = dataInput.value;
            
            if (photoUrl) {
                const img = document.createElement('img');
                img.src = photoUrl;
                img.className = 'w-full h-full rounded-full object-cover';
                preview.innerHTML = '';
                preview.appendChild(img);
            } else {
                const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '--';
                preview.innerHTML = `<span id="empPhotoInitials">${initials}</span>`;
            }
        }

        // Show/hide custom role input
        function roleChangeHandler() {
            const role = document.getElementById('empRole').value;
            if (role === 'Custom') document.getElementById('empCustomRole').classList.remove('hidden');
            else document.getElementById('empCustomRole').classList.add('hidden');
        }

        async function saveEmployee() {
            const name = document.getElementById('empName').value.trim();
            const role = document.getElementById('empRole').value;
            const city = document.getElementById('modalCity').value;
            const area = document.getElementById('modalArea').value;
            // derive areaCode as first three letters (letters only) of the area/city
            const areaCode = getLocalCode();
            const phone = document.getElementById('empPhone').value.trim();
            const email = document.getElementById('empEmail').value.trim();
            const loginId = document.getElementById('empLoginId').value;
            const password = document.getElementById('empPassword').value;
            const photoDataUrl = document.getElementById('empPhotoDataUrl')?.value || '';

            if(!name || !role || !loginId) return alert("Fill Required Fields");
            const isEditing = !!editingEmployeeId;
            
            const db = Array.isArray(employeesCache) ? employeesCache : [];

            // Client-side validation: Check for duplicates before sending to backend
            const finalLoginId = (loginId || '').toString().toUpperCase();
            if (!isEditing) {
                // For new employees, check if loginId, email, or phone already exist
                const duplicate = db.find(e => {
                    const isActive = (typeof e.isActive === 'undefined') ? true : !!e.isActive;
                    if (!isActive) return false;
                    const isDupLoginId = e.loginId && e.loginId.toUpperCase() === finalLoginId;
                    const isDupEmail = email && e.email && e.email.toLowerCase() === email.toLowerCase();
                    const isDupPhone = phone && e.phone && e.phone === phone;
                    return isDupLoginId || isDupEmail || isDupPhone;
                });

                if (duplicate) {
                    let reason = [];
                    if (duplicate.loginId && duplicate.loginId.toUpperCase() === finalLoginId) reason.push(`Login ID "${finalLoginId}" already exists`);
                    if (email && duplicate.email && duplicate.email.toLowerCase() === email.toLowerCase()) reason.push(`Email "${email}" already in use`);
                    if (phone && duplicate.phone && duplicate.phone === phone) reason.push(`Phone "${phone}" already in use`);
                    
                    const msg = reason.length > 0 ? reason.join(' | ') : 'This employee already exists';
                    return alert(`Cannot create employee: ${msg}`);
                }
            } else {
                // For editing, only check for duplicates from OTHER employees
                const duplicate = db.find(e => {
                    const isActive = (typeof e.isActive === 'undefined') ? true : !!e.isActive;
                    if (!isActive) return false;
                    if (e.id === editingEmployeeId || e.loginId === editingEmployeeId) return false; // Skip self
                    const isDupLoginId = e.loginId && e.loginId.toUpperCase() === finalLoginId;
                    const isDupEmail = email && e.email && e.email.toLowerCase() === email.toLowerCase();
                    const isDupPhone = phone && e.phone && e.phone === phone;
                    return isDupLoginId || isDupEmail || isDupPhone;
                });

                if (duplicate) {
                    let reason = [];
                    if (duplicate.loginId && duplicate.loginId.toUpperCase() === finalLoginId) reason.push(`Login ID "${finalLoginId}" is already assigned`);
                    if (email && duplicate.email && duplicate.email.toLowerCase() === email.toLowerCase()) reason.push(`Email "${email}" is already in use`);
                    if (phone && duplicate.phone && duplicate.phone === phone) reason.push(`Phone "${phone}" is already in use`);
                    
                    const msg = reason.length > 0 ? reason.join(' | ') : 'This data conflicts with another employee';
                    return alert(`Cannot update employee: ${msg}`);
                }
            }

            // Enforce login ID prefix: RY + local code (or just RY).
            const desiredPrefix = 'RY' + (areaCode || '');
            let finalLoginIdVal = finalLoginId;
            if (!finalLoginIdVal.startsWith(desiredPrefix)) {
                // Generate unique loginId with prefix
                let attempt = 0;
                do {
                    finalLoginIdVal = desiredPrefix + Math.floor(1000 + Math.random() * 9000);
                    attempt++;
                } while (attempt < 10 && db.some(e => e.loginId && e.loginId.toUpperCase() === finalLoginIdVal));
                document.getElementById('empLoginId').value = finalLoginIdVal;
            }

            // Prepare payload for backend
            // If custom role provided, use it
            const finalRole = (role === 'Custom' && document.getElementById('empCustomRole').value.trim()) ? document.getElementById('empCustomRole').value.trim() : role;
            const payload = { name, email, phone, password, role: finalRole, loginId: finalLoginIdVal, area, areaCode, city, locationCode: areaCode, permissions: Array.from(selectedPermissions), photoDataUrl };

            async function sendEmployeeCredentialsEmailFallback() {
                if (!email) return { ok: false, message: 'No email provided' };
                try {
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
                            <h2>RoomHy Employee Credentials</h2>
                            <p>Hi ${name},</p>
                            <p>Your employee account has been created.</p>
                            <p><strong>Login ID:</strong> ${finalLoginIdVal}</p>
                            <p><strong>Password:</strong> ${password}</p>
                            <p>Please change your password after first login.</p>
                        </div>
                    `;
                    const emailRes = await fetch(`${API_BASE}/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            subject: 'RoomHy Employee Login Credentials',
                            html: emailHtml
                        })
                    });
                    const emailData = await emailRes.json().catch(() => ({}));
                    return {
                        ok: !!(emailRes.ok && emailData.success),
                        message: emailData.message || emailData.error || `HTTP ${emailRes.status}`
                    };
                } catch (err) {
                    console.warn('Fallback credential email failed:', err.message);
                    return { ok: false, message: err.message };
                }
            }

            if (editingEmployeeId) {
                // Update existing employee in-memory
                const prevEditingId = editingEmployeeId;
                const empIdx = db.findIndex(e => e.id === prevEditingId || e.loginId === prevEditingId);
                if (empIdx >= 0) {
                    db[empIdx] = {
                        ...db[empIdx],
                        name, role: finalRole, city, area, areaCode, phone, email, loginId: finalLoginIdVal, password,
                        permissions: Array.from(selectedPermissions), photoDataUrl
                    };
                }
                // Try to update on backend
                try {
                    const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(finalLoginIdVal)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        await syncEmployeesFromBackend();
                        console.log('Employee updated on backend and cache refreshed');
                    } else {
                        console.warn('Employee update API returned', res.status);
                    }
                } catch (err) {
                    console.warn('Employee update API failed, updated in memory only:', err.message);
                }
                editingEmployeeId = null;
            } else {
                // Create new employee: optimistic in-memory add, backend create when possible
                const newEmp = {
                    id: Date.now().toString(),
                    name, role: finalRole, city, area, areaCode, phone, email, loginId: finalLoginIdVal, password,
                    permissions: Array.from(selectedPermissions), photoDataUrl,
                    createdAt: new Date().toISOString(),
                    _synced: false
                };
                const parent = document.getElementById('employeeModal').dataset.parentLogin;
                if (parent) newEmp.parentLoginId = parent;
                db.push(newEmp);
                let createdOnBackend = false;
                // Try backend create
                try {
                    const res = await fetch(`${API_BASE}/api/employees`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const createdData = await res.json().catch(() => ({}));
                        const emailAttempted = !!(createdData && createdData.email && createdData.email.attempted);
                        const emailSent = !!(createdData && createdData.email && createdData.email.sent);

                        if (email && (!emailAttempted || !emailSent)) {
                            const fallback = await sendEmployeeCredentialsEmailFallback();
                            if (!fallback.ok) {
                                alert(`Employee created, but credentials email was not sent. Reason: ${fallback.message}. Check Mailjet keys on backend.`);
                            }
                        }
                        await syncEmployeesFromBackend();
                        loadEmployees(true);
                        console.log('Employee created on backend and cache refreshed');
                        createdOnBackend = true;
                    } else if (res.status === 409) {
                        const data = await res.json().catch(() => ({}));
                        const reason = data.error || data.message || 'Duplicate record';
                        const details = data.details || '';
                        const fullMsg = details ? `${reason} (${details})` : reason;
                        
                        // Remove optimistic entry since backend rejected it
                        const idx = db.findIndex(e => e.loginId === finalLoginIdVal);
                        if (idx >= 0) db.splice(idx, 1);
                        
                        alert(`❌ Employee not created\n\nReason: ${fullMsg}\n\n✓ Solution: Use a different Login ID, Email, or Phone number`);
                    } else {
                        console.warn('Employee create API returned', res.status);
                        // Remove optimistic entry
                        const idx = db.findIndex(e => e.loginId === finalLoginIdVal);
                        if (idx >= 0) db.splice(idx, 1);
                    }
                } catch (err) {
                    console.warn('Employee create API failed, kept in memory:', err.message);
                    // Remove optimistic entry
                    const idx = db.findIndex(e => e.loginId === finalLoginIdVal);
                    if (idx >= 0) db.splice(idx, 1);
                }
                if (!createdOnBackend) {
                    // Do not persist credentials or close modal if backend create failed
                    employeesCache = Array.isArray(db) ? db : employeesCache;
                    try {
                        localStorage.setItem('roomhy_employees_cache', JSON.stringify(employeesCache));
                    } catch (e) {}
                    return;
                }
            }

            // Update UI from in-memory cache
            employeesCache = Array.isArray(db) ? db : employeesCache;
            // Persist in-memory cache as fallback for offline / refresh scenarios
            try {
                localStorage.setItem('roomhy_employees_cache', JSON.stringify(employeesCache));
            } catch (e) {
                console.warn('Could not persist employees cache to localStorage:', e);
            }
            closeEmployeeModal();
            applyFilters();
            updateCounts();
            
            // Save credentials to localStorage for quick access
            if (!isEditing) {
                // Store in roomhy_employees for index login
                try {
                    // Save credentials to roomhy_employees (this is what index uses for login)
                    const existingEmployees = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');
                    // Remove any old entry with same loginId to avoid duplicates
                    const filtered = existingEmployees.filter(e => (e.loginId || '').toUpperCase() !== finalLoginIdVal.toUpperCase());
                    
                    const newEmployee = {
                        loginId: finalLoginIdVal,
                        password: password,
                        name: name,
                        email: email || '',
                        phone: phone || '',
                        role: finalRole,
                        team: finalRole,
                        area: area || '',
                        areaName: area || '',
                        areaCode: areaCode || '',
                        permissions: Array.from(selectedPermissions),
                        createdAt: new Date().toISOString()
                    };
                    filtered.push(newEmployee);
                    localStorage.setItem('roomhy_employees', JSON.stringify(filtered));
                    console.log('✓ Credentials saved to roomhy_employees (for index login):', finalLoginIdVal, 'with plain password');
                } catch (e) {
                    console.warn('Could not save to localStorage:', e);
                }
            }
            
            // Show Creds modal if new employee
            if (!isEditing) {
                document.getElementById('viewLoginId').innerText = finalLoginIdVal;
                document.getElementById('viewPassword').innerText = password;
                document.getElementById('viewCredModal').classList.remove('hidden');
            } else {
                alert('Employee updated successfully!');
            }
        }

        let editingEmployeeId = null; // Track which employee is being edited

        function editEmployee(id) {
            editingEmployeeId = id;
            const db = Array.isArray(employeesCache) ? employeesCache : [];
            const emp = db.find(e => e.id === id || e.loginId === id);
            if (!emp) return alert('Employee not found');

            // Populate modal with existing data
            document.getElementById('empName').value = emp.name;
            document.getElementById('empRole').value = emp.role;
            document.getElementById('empPhone').value = emp.phone || '';
            document.getElementById('empEmail').value = emp.email || '';
            document.getElementById('empLoginId').value = emp.loginId;
            document.getElementById('empPassword').value = emp.password;
            const dataInput = document.getElementById('empPhotoDataUrl');
            if (dataInput) dataInput.value = emp.photoDataUrl || '';

            // Restore photo preview
            const preview = document.getElementById('empPhotoPreview');
            if (preview && emp.photoDataUrl) {
                const img = document.createElement('img');
                img.src = emp.photoDataUrl;
                img.className = 'w-full h-full rounded-full object-cover';
                preview.innerHTML = '';
                preview.appendChild(img);
            } else {
                updateEmpPhotoPreview();
            }

            // Set city and area
            document.getElementById('modalCity').value = emp.city || '';
            updateModalAreaDropdown();
            document.getElementById('modalArea').value = emp.area || '';

            // Update modal title to indicate edit mode
            document.querySelector('#employeeModal h3').innerText = 'Edit Employee';
            document.querySelector('#employeeModal p').innerText = 'Update employee details and assigned location.';

            // Restore permissions
            selectedPermissions.clear();
            if (emp.permissions && Array.isArray(emp.permissions)) {
                emp.permissions.forEach(p => selectedPermissions.add(p));
            }
            renderPermissions();
            document.querySelectorAll('.permission-item').forEach((el, idx) => {
                if (selectedPermissions.has(allPermissions[idx].id)) {
                    el.classList.add('selected');
                    el.querySelector('.checkbox-ui').innerHTML = '<i data-lucide="check" class="w-3 h-3 text-white"></i>';
                    el.querySelector('.checkbox-ui').classList.add('bg-purple-600');
                }
            });
            lucide.createIcons();

            document.getElementById('employeeModal').classList.remove('hidden');
        }

        // Logout (deactivate) an employee: mark isActive=false and notify backend
        async function logoutEmployee(loginId) {
            if(!confirm('Logout this employee and disable their login?')) return;
            const db = Array.isArray(employeesCache) ? employeesCache : [];
            const idx = db.findIndex(e => e.loginId === loginId);
            if (idx === -1) return alert('Employee not found');
            // Optimistic UI update
            db[idx].isActive = false;
            employeesCache = db;
            // persist cache
            try { localStorage.setItem('roomhy_employees_cache', JSON.stringify(employeesCache)); } catch(e){ console.warn('Could not persist employees cache after deactivate:', e); }
            applyFilters();
            try {
                const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(loginId)}/deactivate`, { method: 'POST' });
                if (res.ok) await syncEmployeesFromBackend();
            } catch (err) {
                console.warn('Failed to notify backend about logout:', err.message);
            }
            alert('Employee logged out and disabled. Their login ID will not work.');
        }

        // Reactivate employee
        async function reactivateEmployee(loginId) {
            if(!confirm('Reactivate this employee?')) return;
            const db = Array.isArray(employeesCache) ? employeesCache : [];
            const idx = db.findIndex(e => e.loginId === loginId);
            if (idx === -1) return alert('Employee not found');
            db[idx].isActive = true;
            employeesCache = db;
            // persist cache
            try { localStorage.setItem('roomhy_employees_cache', JSON.stringify(employeesCache)); } catch(e){ console.warn('Could not persist employees cache after reactivate:', e); }
            applyFilters();
            try {
                const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(loginId)}/reactivate`, { method: 'POST' });
                if (res.ok) await syncEmployeesFromBackend();
            } catch (err) {
                console.warn('Failed to notify backend about reactivate:', err.message);
            }
            alert('Employee reactivated. Login will work now.');
        }

        // Open modal to add sub-employee under a parent login id
        function openSubEmployeeModal(parentLoginId) {
            openEmployeeModal();
            // Prefill parent relationship
            const db = Array.isArray(employeesCache) ? employeesCache : [];
            const parent = db.find(e => e.loginId === parentLoginId);
            if (parent) {
                // Prefill city/area and role based on parent
                document.getElementById('modalCity').value = parent.city || '';
                updateModalAreaDropdown();
                document.getElementById('modalArea').value = parent.area || '';
                if (['Marketing Team','Accounts Department','Maintenance Team','Customer Support'].includes(parent.role)) {
                    document.getElementById('empRole').value = parent.role;
                    document.getElementById('empCustomRole').classList.add('hidden');
                } else {
                    document.getElementById('empRole').value = 'Custom';
                    document.getElementById('empCustomRole').classList.remove('hidden');
                    document.getElementById('empCustomRole').value = parent.role;
                }
            } else {
                document.getElementById('empRole').value = 'Custom';
                document.getElementById('empCustomRole').classList.remove('hidden');
            }
            // store parentLoginId in a hidden field
            document.getElementById('employeeModal').dataset.parentLogin = parentLoginId;
            // Show note
            document.querySelector('#employeeModal p').innerText = `Creating sub-employee under ${parentLoginId}`;
        }

        async function deleteEmp(id) {
            if(!confirm("Delete?")) return;
            let db = Array.isArray(employeesCache) ? employeesCache : [];
            const emp = db.find(e => e.id === id || e.loginId === id);
            if (!emp) return alert('Employee not found');
            // Optimistically remove from cache
            db = db.filter(e => e.id !== id && e.loginId !== id);
            employeesCache = db;
            // persist cache after deletion
            try { localStorage.setItem('roomhy_employees_cache', JSON.stringify(employeesCache)); } catch(e){ console.warn('Could not persist employees cache after delete:', e); }
            applyFilters();
            updateCounts();
            try {
                // Use loginId for the DELETE request as expected by backend
                const res = await fetch(`${API_BASE}/api/employees/${encodeURIComponent(emp.loginId)}`, { method: 'DELETE' });
                if (res.ok) {
                    await syncEmployeesFromBackend();
                    loadEmployees(true);
                }
            } catch (err) {
                console.warn('Failed to delete employee on backend:', err.message);
            }
        }

        function deleteAllEmployees() {
            if(!confirm("Are you sure you want to delete ALL employees? This cannot be undone.")) return;
            // Clear the employees cache
            employeesCache = [];
            // Clear localStorage
            try { localStorage.removeItem('roomhy_employees_cache'); } catch(e){ console.warn('Could not clear employees cache:', e); }
            // Refresh the display
            applyFilters();
            updateCounts();
            console.log('All employees deleted from local cache');
        }

        function openEmployeeModal() {
            editingEmployeeId = null; // Clear edit mode
            generateCreds();
            clearPerms();
            
            // Reset modal title back to "Add Employee"
            document.querySelector('#employeeModal h3').innerText = 'Add Employee';
            document.querySelector('#employeeModal p').innerText = 'Create a new user with specific role and location access.';

            // Clear form fields
            document.getElementById('empName').value = '';
            document.getElementById('empPhone').value = '';
            document.getElementById('empEmail').value = '';
            document.getElementById('modalCity').value = '';
            document.getElementById('modalArea').innerHTML = '<option value="">Select Area</option>';
            
            if(currentTeamFilter !== 'All') document.getElementById('empRole').value = currentTeamFilter;
            document.getElementById('employeeModal').classList.remove('hidden');
            // clear any parent marker
            delete document.getElementById('employeeModal').dataset.parentLogin;
        }
        function closeEmployeeModal() { 
            editingEmployeeId = null;
            document.getElementById('employeeModal').classList.add('hidden'); 
        }
        function viewCredentials(id, pass) {
            document.getElementById('viewLoginId').innerText = id;
            document.getElementById('viewPassword').innerText = pass;
            document.getElementById('viewCredModal').classList.remove('hidden');
        }

        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                if(chevron) chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                if(chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }
        
        function copyText(id) {
            navigator.clipboard.writeText(document.getElementById(id).innerText);
            alert("Copied!");
        }


