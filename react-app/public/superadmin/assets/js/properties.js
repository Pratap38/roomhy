lucide.createIcons();
        const token = localStorage.getItem('token');
        const isPreview = window.location.protocol === 'blob:' || window.location.href.includes('scf.usercontent');
        if (isPreview) document.getElementById('demoMode').classList.remove('hidden');

        let currentPropertiesData = [];
        const API_BASES = Array.from(new Set([
            API_URL,
            'https://api.roomhy.com',
            'https://api.roomhy.com',
            'http://localhost:5001'
        ]));
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
            const t = getStoredToken();
            const headers = { ...extraHeaders };
            if (t) headers.Authorization = `Bearer ${t}`;
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

        // --- Sidebar Functions ---
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
            const sidebar = document.getElementById('mobile-sidebar');
            const overlay = document.getElementById('mobile-sidebar-overlay');
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        }
        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);

        // --- Load Data ---
        // Fetch owners data from API (same as owner does)
        async function loadOwners() {
            let owners = [];
            console.log('📥 Fetching owners data from backend...');
            try {
                const res = await fetchFromAnyApi('/api/owners', {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    // Handle both array response and {data: [...]} response
                    owners = Array.isArray(data) ? data : (data.data || data.owners || []);
                    console.log(`✅ Loaded ${owners.length} owners from backend`);
                } else {
                    console.warn('⚠️ Owners API returned', res.status);
                }
            } catch (err) {
                console.warn('⚠️ Failed to fetch owners from backend, ', err);
            }

            if (!owners || !Array.isArray(owners)) {
                owners = [];
            }

            return owners;
        }

        // Create a map of owners for quick lookup by loginId
        let ownerMap = {};
        function buildOwnerMap(owners) {
            ownerMap = {};
            owners.forEach(owner => {
                const loginId = (owner.loginId || owner.login_id || '').toUpperCase();
                if (loginId) {
                    ownerMap[loginId] = {
                        name: owner.name || owner.fullName || '-',
                        email: owner.email || owner.gmail || '-',
                        phone: owner.phone || owner.phoneNumber || '-',
                        address: owner.address || '-',
                        areaCode: owner.areaCode || owner.locationCode || '-'
                    };
                }
            });
            console.log(`🗺️ Built owner map with ${Object.keys(ownerMap).length} entries`);
            return ownerMap;
        }

        // Enrich property with owner details
        function enrichPropertyWithOwnerData(property, ownerMap) {
            const ownerLoginId = (property.ownerLoginId || '').toUpperCase();
            const ownerData = ownerMap[ownerLoginId] || {};
            
            return {
                ...property,
                ownerEmail: ownerData.email || property.ownerEmail || '-',
                ownerAddress: ownerData.address || property.ownerAddress || '-',
                areaCode: ownerData.areaCode || property.areaCode || property.locationCode || '-'
            };
        }

        async function loadProperties() {
            // Load owners data first to enrich properties
            const allOwners = await loadOwners();
            buildOwnerMap(allOwners);

            // Try backend properties endpoint first only when auth token exists.
            // Without token this endpoint returns 401 on hosted backend.
            let props = [];
            try {
                if (getStoredToken()) {
                    const res = await fetchFromAnyApi('/api/properties', {
                        headers: getAuthHeaders()
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.success && Array.isArray(data.properties)) {
                            props = data.properties.map(p => ({
                                id: p._id || p.id,
                                title: p.title || p.name || p.propertyName || 'Untitled',
                                locationCode: p.locationCode || '-',
                                address: p.address || '-',
                                city: p.city || p.locationCity || '-',
                                ownerName: p.owner ? (p.owner.name || '-') : (p.ownerName || '-'),
                                ownerPhone: p.owner ? (p.owner.phone || '-') : (p.ownerPhone || '-'),
                                ownerLoginId: p.owner ? (p.owner.loginId || null) : (p.ownerLoginId || null),
                                photos: p.photos || (p.image ? [p.image] : []),
                                imageBase64: p.imageBase64 || null,
                                status: p.status || 'active'
                            })).map(p => enrichPropertyWithOwnerData(p, ownerMap));
                        }
                    } else {
                        console.warn('Properties API returned', res.status);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch properties from backend, ', err);
            }

            // Also include properties that came from approved visits/enquiries (merge)
            try {
                let visits = [];
                try {
                    // Prefer public visits endpoint first
                    const res = await fetchFromAnyApi('/api/visits', {
                        headers: getAuthHeaders()
                    });
                    if (res.ok) visits = await res.json();
                    if (visits && visits.visits) visits = visits.visits;
                } catch (err) {
                    // ignore backend error
                }

                // Fallback to admin endpoint if needed
                if (!Array.isArray(visits) || visits.length === 0) {
                    try {
                        const adminRes = await fetchFromAnyApi('/api/admin/visits?status=approved', {
                            headers: getAuthHeaders()
                        });
                        if (adminRes.ok) visits = await adminRes.json();
                    } catch (_) {}
                }

                if (!visits || visits.length === 0) {
                    visits = [];
                }

                const visitProps = visits.map(v => ({
                    id: v._id,
                    title: v.propertyInfo ? v.propertyInfo.name : (v.title || 'Property'),
                    locationCode: v.propertyInfo ? v.propertyInfo.locationCode : (v.locationCode || 'NA'),
                    address: v.propertyInfo ? (v.propertyInfo.address || '-') : (v.address || '-'),
                    city: v.propertyInfo ? v.propertyInfo.city : (v.city || '-'),
                    ownerName: v.propertyInfo ? (v.propertyInfo.ownerName || 'Unknown') : (v.ownerName || 'Unknown'),
                    ownerPhone: v.propertyInfo ? v.propertyInfo.contactPhone : v.ownerPhone,
                    ownerLoginId: v.generatedCredentials ? v.generatedCredentials.loginId : (v.ownerLoginId || null),
                    photos: v.photos || (v.imageBase64 ? [v.imageBase64] : []),
                    imageBase64: v.imageBase64,
                    status: 'active'
                })).map(p => enrichPropertyWithOwnerData(p, ownerMap));

                // Merge visitProps into props, avoiding duplicates by id or title+locationCode
                visitProps.forEach(vp => {
                    const exists = props.find(p => (p.id && vp.id && p.id === vp.id) || (p.title === vp.title && p.locationCode === vp.locationCode));
                    if (!exists) props.push(vp);
                });
            } catch (err) {
                console.warn('Failed to merge approved visits into properties', err);
            }

            // Apply city filter if coming from location carousel
            const filterByCity = sessionStorage.getItem('filterByCity');
            if (filterByCity) {
                props = props.filter(p => p.city === filterByCity);
                document.querySelector('h1').textContent = `Properties in ${filterByCity}`;
                sessionStorage.removeItem('filterByCity');
            }

            // Cache merged properties so owner pages can resolve propertyId consistently
            // from the same data source shown in this superadmin list.
            try {
                localStorage.setItem('roomhy_properties', JSON.stringify(props));
            } catch (e) {
                console.warn('Failed to cache roomhy_properties', e);
            }

            renderProperties(props);
        }

        function renderProperties(props) {
            const tbody = document.getElementById('propertiesTableBody');
            tbody.innerHTML = '';
            currentPropertiesData = []; // For export

            if (props.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500">No properties found. Approve visits in Enquiry page first.</td></tr>`;
                return;
            }

            // Group by Area Code
            const groups = {};
            props.forEach(p => {
                const code = (p.locationCode || 'NA').toUpperCase();
                if(!groups[code]) groups[code] = [];
                groups[code].push(p);
                
                currentPropertiesData.push({
                    "Property": p.title,
                    "Location": p.locationCode,
                    "Address": p.address,
                    "Owner": p.ownerName,
                    "Phone": p.ownerPhone,
                    "OwnerID": p.ownerLoginId,
                    "Status": "Active"
                });
            });

            Object.keys(groups).sort().forEach(code => {
                tbody.innerHTML += `<tr class="bg-gray-50"><td colspan="9" class="font-bold text-slate-700 px-4 py-2 text-xs uppercase tracking-wider border-b border-gray-200">Zone: ${code}</td></tr>`;
                
                groups[code].forEach(p => {
                    // Image Logic
                    let thumbnail = '<div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 mx-auto"><i data-lucide="image-off" class="w-4 h-4"></i></div>';
                    let photos = p.photos || [];
                    if(p.imageBase64) photos.unshift(p.imageBase64);

                    if(photos.length > 0) {
                        thumbnail = `
                            <div class="relative group cursor-pointer w-10 h-10 mx-auto" onclick='openGallery(${JSON.stringify(photos)})'>
                                <img src="${photos[0]}" class="w-full h-full rounded object-cover border border-gray-200 shadow-sm">
                                <div class="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span class="text-white text-[9px] font-bold">+${photos.length}</span>
                                </div>
                            </div>`;
                    }

                    tbody.innerHTML += `
                        <tr class="hover:bg-gray-50 border-b border-gray-100 property-row">
                            <td class="text-center align-middle py-3">${thumbnail}</td>
                            <td class="font-medium text-slate-800 property-name">${p.title}</td>
                            <td><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono font-bold">${p.locationCode}</span></td>
                            <td class="text-sm text-gray-600">${p.city}</td>
                            <td class="text-sm text-gray-600 max-w-xs truncate" title="${p.address}">${p.address}</td>
                            <td class="text-sm text-gray-600 property-owner">
                                <div class="font-medium text-gray-900">${p.ownerName}</div>
                                <div class="text-xs text-gray-400">${p.ownerLoginId || '-'}</div>
                            </td>
                            <td><span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active</span></td>
                            <td class="text-right">
                                <button onclick="viewDetails('${p.ownerLoginId}', '${p.title}', '${p.locationCode}')" class="text-purple-600 hover:text-purple-800 text-xs font-medium border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-50 transition-colors">
                                    View Details
                                </button>
                            </td>
                            <td class="text-center">
                                <button onclick="deleteProperty('${p.id}')" class="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors" title="Delete">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            });
            lucide.createIcons();
        }
        
        // --- View Details Functionality ---
        async function viewDetails(ownerId, propName, location) {
            if(!ownerId) {
                alert("Owner ID not found for this property.");
                return;
            }

            document.getElementById('modal-prop-name').innerText = propName;
            document.getElementById('modal-owner-name').innerText = `Owner: ${ownerId}`;
            document.getElementById('modal-location').innerText = location;
            
            // Try backend first: GET /api/owners/:ownerId/rooms
            let propRooms = [];
            try {
                const roomsRes = await fetchFromAnyApi(`/api/owners/${encodeURIComponent(ownerId)}/rooms`, {
                    headers: getAuthHeaders()
                });
                if (roomsRes.ok) {
                    const payload = await roomsRes.json();
                    propRooms = payload.rooms || [];
                }
                // If 404 or other error, silently fall back to localStorage
            } catch (err) {
                // Backend unavailable, will use localStorage fallback
            }

            // Fallback to localStorage if no rooms found from backend
            if (!propRooms || propRooms.length === 0) {
                const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
                propRooms = allRooms.filter(r => (r.ownerId === ownerId || r.ownerLoginId === ownerId));
                if (propRooms.length > 0) console.log('📦 Loaded rooms from localStorage for owner:', ownerId);
            }
            
            const container = document.getElementById('rooms-container');
            container.innerHTML = '';

            if(propRooms.length === 0) {
                container.innerHTML = `
                    <div class="col-span-2 flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <div class="bg-gray-50 p-4 rounded-full mb-3"><i data-lucide="bed-double" class="w-8 h-8 text-gray-400"></i></div>
                        <h3 class="text-gray-800 font-medium">No Rooms Configured</h3>
                        <p class="text-gray-500 text-sm mt-1">The owner hasn't added any rooms to this property yet.</p>
                    </div>`;
            } else {
                propRooms.forEach(room => {
                    let bedsHtml = '';
                    const beds = room.beds || [];
                    const totalBeds = beds.length;
                    const occupied = beds.filter(b => b.tenant).length;
                    
                    // Progress bar calculation
                    const percent = totalBeds > 0 ? (occupied / totalBeds) * 100 : 0;
                    const barColor = percent === 100 ? 'bg-red-500' : (percent > 50 ? 'bg-yellow-500' : 'bg-green-500');

                    if(beds.length > 0) {
                        beds.forEach((bed, idx) => {
                            const isOccupied = bed.status === 'occupied' || !!bed.tenantName;
                            const statusClass = isOccupied ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100';
                            const iconColor = isOccupied ? 'text-red-500' : 'text-green-500';
                            const icon = isOccupied ? 'user' : 'check-circle';
                            
                            let tenantHtml = `<span class="text-green-700 font-bold text-xs">Vacant</span>`;
                            if(isOccupied) {
                                tenantHtml = `
                                    <div>
                                        <p class="text-red-700 font-bold text-xs flex items-center"><i data-lucide="user" class="w-3 h-3 mr-1"></i> ${bed.tenantName || bed.tenant?.name || 'Unknown'}</p>
                                        <p class="text-gray-500 text-[10px]">${bed.tenantPhone || bed.tenant?.phone || '-'}</p>
                                    </div>`;
                            }

                            bedsHtml += `
                                <div class="flex items-center justify-between p-2.5 border rounded-md mb-2 bg-white shadow-sm">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200">B${idx + 1}</div>
                                        <div class="text-sm">${tenantHtml}</div>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        bedsHtml = `<p class="text-xs text-gray-400 italic p-2">No beds added to this room.</p>`;
                    }

                    container.innerHTML += `
                        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                            <div class="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-start">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h4 class="font-bold text-gray-800 text-lg">Room ${room.number}</h4>
                                        <span class="px-2 py-0.5 bg-white border text-xs rounded text-gray-500 font-medium">${room.type}</span>
                                    </div>
                                    <p class="text-sm text-gray-500 mt-1 font-medium">Rent: <span class="text-slate-800">?${room.rent}</span></p>
                                </div>
                                <div class="text-right">
                                     <div class="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Occupancy</div>
                                     <div class="text-sm font-bold ${percent === 100 ? 'text-red-600' : 'text-green-600'}">${occupied}/${totalBeds}</div>
                                </div>
                            </div>
                            
                            <!-- Occupancy Bar -->
                            <div class="h-1.5 w-full bg-gray-100">
                                <div class="h-full ${barColor}" style="width: ${percent}%"></div>
                            </div>

                            <div class="p-4 flex-1 bg-slate-50/50">
                                <h5 class="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">Bed Configuration & Tenants</h5>
                                ${bedsHtml}
                            </div>
                        </div>
                    `;
                });
            }
            
            lucide.createIcons();
            const modal = document.getElementById('detailsModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeDetailsModal() {
            const modal = document.getElementById('detailsModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        // --- Delete Function ---
        function deleteProperty(id) {
            if(!confirm("Are you sure? This will remove the property from the system.")) return;
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const newVisits = visits.filter(v => v._id !== id);
            localStorage.setItem('roomhy_visits', JSON.stringify(newVisits));
            
            // Also cleanup rooms if needed (optional for demo)
            
            const row = document.getElementById(`row-${id}`);
            if(row) row.remove();
            alert("Property deleted.");
            loadProperties();
        }

        // --- Excel Export ---
        function exportToExcel() {
            if(currentPropertiesData.length === 0) return alert("No data to export.");
            const ws = XLSX.utils.json_to_sheet(currentPropertiesData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Properties");
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Roomhy_Properties_${date}.xlsx`);
        }
        
        // --- Search Filter ---
        function filterProperties() {
            const input = document.getElementById('propertySearch');
            const filter = input.value.toUpperCase();
            const rows = document.querySelectorAll(".property-row");
            
            rows.forEach(row => {
                const title = row.querySelector(".property-name")?.innerText.toUpperCase() || "";
                const owner = row.querySelector(".property-owner")?.innerText.toUpperCase() || "";
                
                if (title.includes(filter) || owner.includes(filter)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        }

        function openGallery(photos) {
            const grid = document.getElementById('galleryGrid');
            grid.innerHTML = '';
            photos.forEach(src => {
                grid.innerHTML += `<img src="${src}" class="w-full h-48 object-cover rounded-lg border border-gray-600 shadow-lg hover:scale-105 transition-transform">`;
            });
            document.getElementById('imageModal').classList.remove('hidden');
            document.getElementById('imageModal').classList.add('flex');
        }

        function closeImageModal() {
            document.getElementById('imageModal').classList.add('hidden');
            document.getElementById('imageModal').classList.remove('flex');
        }

        loadProperties();

