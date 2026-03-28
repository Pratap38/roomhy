window.addEventListener('load', () => { if(typeof lucide!=='undefined') lucide.createIcons(); });

        // Backend base with fallback support (local + hosted).
        const backendBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
        const backendBases = Array.from(new Set([
            backendBase,
            'http://localhost:5001',
            'https://api.roomhy.com'
        ]));
        let activeBackendBase = backendBase;

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

        async function apiFetch(path, options = {}) {
            const attempts = [activeBackendBase, ...backendBases.filter((b) => b !== activeBackendBase)];
            let lastError = null;

            const finalOptions = { ...options };
            const headers = { ...(options.headers || {}) };
            const token = getStoredToken();
            if (token && !headers.Authorization) {
                headers.Authorization = `Bearer ${token}`;
            }
            finalOptions.headers = headers;

            for (const base of attempts) {
                try {
                    const res = await fetch(`${base}${path}`, finalOptions);
                    if (res.status === 404) {
                        lastError = new Error(`404 for ${path} at ${base}`);
                        continue;
                    }
                    if (res.ok) activeBackendBase = base;
                    return res;
                } catch (err) {
                    lastError = err;
                }
            }
            if (lastError) throw lastError;
            throw new Error(`API request failed for ${path}`);
        }
        let backendRoomsCache = null; // store rooms fetched from backend for this owner

        // 1. Session & Property Init
        function safeReadJson(raw) {
            try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
        }
        function getUrlLoginId() {
            try {
                const q = new URLSearchParams(window.location.search);
                const h = (window.location.hash && window.location.hash.includes('?'))
                    ? new URLSearchParams(window.location.hash.split('?')[1])
                    : new URLSearchParams('');
                return (q.get('loginId') || q.get('loginid') || h.get('loginId') || h.get('loginid') || '').trim().toUpperCase();
            } catch (e) {
                return '';
            }
        }
        function propagateLoginIdToLinks(loginId) {
            if (!loginId) return;
            document.querySelectorAll('a[href]').forEach((a) => {
                const href = a.getAttribute('href') || '';
                if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
                try {
                    const u = new URL(href, window.location.origin + window.location.pathname);
                    if (!u.searchParams.get('loginId')) u.searchParams.set('loginId', loginId);
                    a.setAttribute('href', `${u.pathname.split('/').pop()}${u.search}${u.hash || ''}`);
                } catch (e) { /* ignore malformed links */ }
            });
        }

        let user = safeReadJson(sessionStorage.getItem('owner_session'))
            || safeReadJson(localStorage.getItem('owner_user'))
            || safeReadJson(sessionStorage.getItem('owner_user'))
            || safeReadJson(localStorage.getItem('user'))
            || null;
        const urlLoginId = getUrlLoginId();
        let ownerId = (user && (user.ownerId || user.loginId)) ? String(user.ownerId || user.loginId).toUpperCase() : '';
        if (!ownerId && urlLoginId) ownerId = urlLoginId;
        let areaCode = (user && (user.locationCode || user.area)) ? (user.locationCode || user.area) : '';

        window.addEventListener('owner-session-updated', async (ev) => {
            const owner = ev && ev.detail ? ev.detail : null;
            if (!owner) return;
            user = { ...(user || {}), ...owner };
            ownerId = String(owner.loginId || owner.ownerId || ownerId || '').toUpperCase();
            areaCode = owner.locationCode || owner.area || areaCode;
            try {
                await loadOwnerProperty();
                await loadRooms();
            } catch (_) {}
        });

        async function ensureOwnerContext() {
            if (!ownerId) {
                console.warn('No owner loginId found in storage or URL');
                return;
            }
            try {
                const res = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}`);
                if (res.ok) {
                    const payload = await res.json();
                    const owner = payload && (payload.owner || payload.data || payload);
                    const profile = (owner && owner.profile) || {};
                    user = {
                        ...(user || {}),
                        loginId: ownerId,
                        ownerId: ownerId,
                        role: 'owner',
                        name: profile.name || owner?.name || user?.name || 'Owner',
                        locationCode: profile.area || owner?.locationCode || user?.locationCode || '',
                        area: profile.area || owner?.area || user?.area || ''
                    };
                    areaCode = user.locationCode || user.area || areaCode;
                    try { localStorage.setItem('owner_user', JSON.stringify(user)); } catch (e) {}
                    try { sessionStorage.setItem('owner_session', JSON.stringify(user)); } catch (e) {}
                }
            } catch (e) {
                console.warn('Owner context fetch failed:', e && e.message);
            }
            if (!areaCode) areaCode = 'KO';
            propagateLoginIdToLinks(ownerId);
        }

        function normalizeTextValue(value) {
            const text = String(value || '').trim();
            if (!text) return '';
            const lower = text.toLowerCase();
            if (lower === 'new' || lower === 'undefined' || lower === 'null' || lower === 'na' || lower === 'n/a') return '';
            return text;
        }

        function firstValidValue(...values) {
            for (const v of values) {
                const cleaned = normalizeTextValue(v);
                if (cleaned) return cleaned;
            }
            return '';
        }

        if(!user || user.role !== 'owner') {
            console.warn("No owner session found");
        }
        let currentProperty = null;

        // Load property associated with this Owner ID
        async function loadOwnerProperty() {
            if (!ownerId) {
                console.warn('loadOwnerProperty: No ownerId available');
                return;
            }

            console.debug('loadOwnerProperty: Loading for ownerId:', ownerId);

            // PRIMARY: Try backend properties endpoint first
            try {
                const pres = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}/properties`);
                if (pres.ok) {
                    const pdata = await pres.json();
                    const props = Array.isArray(pdata?.properties) ? pdata.properties : [];
                    if (props.length > 0) {
                        const p = props[0];
                        currentProperty = {
                            _id: p?._id,
                            id: p?._id || p?.id || p?.propertyId || ('PROP_' + ownerId),
                            title: p?.title || p?.name || p?.propertyName || 'Property',
                            name: p?.title || p?.name || p?.propertyName || 'Property',
                            location: p?.location || p?.area || p?.city || p?.address || 'Location',
                            address: p?.address || p?.area || '',
                            ownerName: p?.ownerName || user?.name || 'Owner',
                            ownerLoginId: p?.ownerLoginId || ownerId,
                            locationCode: p?.locationCode || p?.area || 'KO'
                        };
                        console.debug('loadOwnerProperty: Loaded from backend API', currentProperty);
                        return;
                    }
                }
            } catch (err) {
                console.warn('loadOwnerProperty: Properties API failed', err?.message);
            }

            // SECONDARY: Try rooms endpoint which also returns properties
            try {
                const res = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}/rooms`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.properties) && data.properties.length > 0) {
                        const p = data.properties[0];
                        currentProperty = {
                            _id: p?._id,
                            id: p?._id || p?.id || p?.propertyId || ('PROP_' + ownerId),
                            title: p?.title || p?.name || p?.propertyName || 'Property',
                            name: p?.title || p?.name || p?.propertyName || 'Property',
                            location: p?.location || p?.area || p?.city || p?.address || 'Location',
                            address: p?.address || p?.area || '',
                            ownerName: p?.ownerName || user?.name || 'Owner',
                            ownerLoginId: p?.ownerLoginId || ownerId,
                            locationCode: p?.locationCode || p?.area || 'KO'
                        };
                        console.debug('loadOwnerProperty: Loaded from rooms endpoint', currentProperty);
                    }
                    if (data && Array.isArray(data.rooms)) {
                        backendRoomsCache = data.rooms;
                    }
                    if (currentProperty) return;
                }
            } catch (err) {
                console.warn('loadOwnerProperty: Rooms endpoint failed', err?.message);
            }

            // TERTIARY: Fallback to localStorage properties
            if (!currentProperty) {
                try {
                    const properties = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                    const found = properties.find(p => p.ownerId === ownerId || p.ownerLoginId === ownerId || p.owner === ownerId);
                    if (found) {
                        currentProperty = {
                            _id: found?._id,
                            id: found?._id || found?.id || found?.propertyId || ('PROP_' + ownerId),
                            title: found?.title || found?.name || found?.propertyName || 'Property',
                            name: found?.title || found?.name || found?.propertyName || 'Property',
                            location: found?.location || found?.area || found?.city || found?.address || 'Location',
                            address: found?.address || found?.area || '',
                            ownerName: found?.ownerName || user?.name || 'Owner',
                            ownerLoginId: found?.ownerLoginId || ownerId,
                            locationCode: found?.locationCode || found?.area || 'KO'
                        };
                        console.debug('loadOwnerProperty: Loaded from localStorage', currentProperty);
                        return;
                    }
                } catch (err) {
                    console.warn('loadOwnerProperty: localStorage search failed', err?.message);
                }
            }

            // QUATERNARY: Fallback to approved visits from backend
            if (!currentProperty) {
                try {
                    const vr = await apiFetch(`/api/visits/approved`);
                    if (vr.ok) {
                        const vd = await vr.json();
                        const visits = vd.visits || [];
                        const matchedVisit = visits.find(v => {
                            const gid = (v.generatedCredentials && v.generatedCredentials.loginId) || '';
                            return String(gid).toUpperCase() === String(ownerId || '').toUpperCase();
                        });
                        if (matchedVisit) {
                            const pInfo = matchedVisit.propertyInfo || matchedVisit;
                            currentProperty = {
                                _id: pInfo?._id || matchedVisit._id,
                                id: pInfo?._id || matchedVisit.propertyId || matchedVisit._id || matchedVisit.id || ('PROP_' + ownerId),
                                title: pInfo?.title || pInfo?.name || pInfo?.propertyName || matchedVisit.propertyName || 'Property',
                                name: pInfo?.title || pInfo?.name || pInfo?.propertyName || matchedVisit.propertyName || 'Property',
                                location: pInfo?.location || pInfo?.area || pInfo?.city || pInfo?.address || matchedVisit.area || matchedVisit.city || matchedVisit.address || 'Location',
                                address: pInfo?.address || matchedVisit.address || matchedVisit.area || '',
                                ownerName: pInfo?.ownerName || matchedVisit.ownerName || user?.name || 'Owner',
                                ownerLoginId: pInfo?.ownerLoginId || ownerId,
                                locationCode: pInfo?.locationCode || matchedVisit.locationCode || matchedVisit.area || 'KO'
                            };
                            console.debug('loadOwnerProperty: Loaded from visits endpoint', currentProperty);
                            return;
                        }
                    }
                } catch (err) {
                    console.warn('loadOwnerProperty: Visits endpoint failed', err?.message);
                }
            }

            // QUINARY: Try owner context in window scope (from ownerContextSync.js)
            if (!currentProperty) {
                try {
                    const oc = window.__ownerContext || {};
                    if (oc.propertyName || oc.propertyLocation) {
                        currentProperty = {
                            id: 'PROP_' + ownerId,
                            title: oc.propertyName || 'Property',
                            name: oc.propertyName || 'Property',
                            location: oc.propertyLocation || oc.area || oc.locationCode || 'Location',
                            address: oc.address || oc.area || '',
                            ownerName: oc.name || user?.name || 'Owner',
                            ownerLoginId: ownerId,
                            locationCode: oc.locationCode || oc.area || 'KO'
                        };
                        console.debug('loadOwnerProperty: Loaded from owner context', currentProperty);
                        return;
                    }
                } catch (err) {
                    console.warn('loadOwnerProperty: Owner context failed', err?.message);
                }
            }

            // SENARY: Final fallback to visit reports in localStorage
            if (!currentProperty) {
                try {
                    const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                    const matchedVisit = visits.find(v => {
                        const gv = v.generatedCredentials || v.generatedCreds || v.generated || {};
                        return String(v.loginId) === String(ownerId) ||
                            String(gv.loginId) === String(ownerId) ||
                            String(v.generatedId || '') === String(ownerId) ||
                            String(v.username || '') === String(ownerId) ||
                            (user && v.mobile && String(v.mobile) === String(user.phone));
                    });

                    if (matchedVisit) {
                        const pInfo = matchedVisit.propertyInfo || matchedVisit.property || matchedVisit.propertyDetails || matchedVisit;
                        const pName = pInfo?.title || pInfo?.name || pInfo?.propertyName || matchedVisit.propertyName || matchedVisit.name || "Property Name";
                        const pLoc = pInfo?.location || pInfo?.area || pInfo?.city || pInfo?.address || matchedVisit.area || matchedVisit.city || matchedVisit.address || matchedVisit.location || "Location";
                        const oName = pInfo?.ownerName || matchedVisit.ownerName || matchedVisit.owner || "Owner";

                        currentProperty = {
                            _id: pInfo?._id || matchedVisit._id,
                            id: pInfo?._id || matchedVisit.propertyId || matchedVisit._id || matchedVisit.id || ('PROP_' + ownerId),
                            title: pName,
                            name: pName,
                            location: pLoc,
                            address: pInfo?.address || matchedVisit.address || '',
                            ownerName: oName,
                            ownerLoginId: ownerId,
                            locationCode: pInfo?.locationCode || ownerId.slice(0, 2) || 'KO'
                        };

                        // Update session name from Visit info if needed
                        if (user && (user.name === 'Owner' || !user.name)) {
                            user.name = oName;
                            sessionStorage.setItem('owner_session', JSON.stringify(user));
                            const hn = document.getElementById('headerOwnerName');
                            const ha = document.getElementById('headerAvatar');
                            if (hn) hn.innerText = user.name;
                            if (ha) ha.innerText = (user.name || 'O').charAt(0).toUpperCase();
                        }
                        console.debug('loadOwnerProperty: Loaded from localStorage visits', currentProperty);
                        return;
                    }
                } catch (err) {
                    console.warn('loadOwnerProperty: localStorage visits search failed', err?.message);
                }
            }

            // Update UI with the loaded property
            const displayEl = document.getElementById('propertyNameDisplay');
            const modalDisplayEl = document.getElementById('modalPropertyNameText');
            const modalIdEl = document.getElementById('modalPropertyId');

            if (currentProperty) {
                const title = firstValidValue(
                    currentProperty.title,
                    currentProperty.name,
                    currentProperty.propertyName,
                    currentProperty.displayName,
                    currentProperty.propName
                ) || 'Owner Property';
                const loc = firstValidValue(
                    currentProperty.location,
                    currentProperty.locationCode,
                    currentProperty.area,
                    currentProperty.city,
                    areaCode
                );
                currentProperty.title = title;
                currentProperty.name = title;
                const text = loc ? `${title} (${loc})` : title;
                if (displayEl) {
                    // render as a clickable link to the property page (use id when available)
                    displayEl.innerText = text;
                    const pid = currentProperty._id || currentProperty.id || currentProperty.propertyId || currentProperty.id;
                    if (pid) {
                        displayEl.href = `/propertyowner/properties?id=${encodeURIComponent(pid)}`;
                        displayEl.target = '_self';
                    } else {
                        // fallback to properties list
                        displayEl.href = '/propertyowner/properties';
                        displayEl.target = '_self';
                    }
                }
                if(modalDisplayEl) modalDisplayEl.innerText = text;
                if(modalIdEl) modalIdEl.value = currentProperty._id || currentProperty.id || currentProperty.propertyId || currentProperty.id;
            } else {
                const errText = "No Property Linked (Contact Admin)";
                if(displayEl) { displayEl.innerText = errText; displayEl.removeAttribute('href'); }
                if(modalDisplayEl) modalDisplayEl.innerText = errText;
            }
            
            // Update Header Profile
            if(user) {
                const headerName = document.getElementById('headerOwnerName');
                const headerId = document.getElementById('headerOwnerId');
                const headerAvatar = document.getElementById('headerAvatar');
                
                if(headerName) headerName.innerText = user.name || 'Owner';
                if(headerId) headerId.innerText = `ID: ${ownerId || '-'}`;
                if(headerAvatar) headerAvatar.innerText = (user.name || 'O').charAt(0).toUpperCase();
            }
            
            // Profile Dropdown Logic
            const profileBtn = document.getElementById('profile-button');
            const profileDropdown = document.getElementById('profile-dropdown');
            if(profileBtn && profileDropdown) {
                profileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isHidden = profileDropdown.classList.contains('hidden');
                    if(isHidden) {
                        profileDropdown.classList.remove('hidden');
                        setTimeout(() => {
                            profileDropdown.classList.remove('scale-95', 'opacity-0');
                            profileDropdown.classList.add('scale-100', 'opacity-100');
                        }, 10);
                    } else {
                        profileDropdown.classList.remove('scale-100', 'opacity-100');
                        profileDropdown.classList.add('scale-95', 'opacity-0');
                        setTimeout(() => profileDropdown.classList.add('hidden'), 200);
                    }
                });
                document.addEventListener('click', () => {
                    if(!profileDropdown.classList.contains('hidden')) {
                        profileDropdown.classList.remove('scale-100', 'opacity-100');
                        profileDropdown.classList.add('scale-95', 'opacity-0');
                        setTimeout(() => profileDropdown.classList.add('hidden'), 200);
                    }
                });
            }
            
            if (typeof lucide !== 'undefined') lucide.createIcons();
            try { document.getElementById('roomsCount').innerText = 'Rooms: ' + myRooms.length; } catch(e){}
            try { const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]'); document.getElementById('tenantsCount').innerText = 'Tenants: ' + tenants.length; } catch(e){}
        }

        // Check backend availability and update status UI
        async function checkBackendStatus() {
            const statusEl = document.getElementById('backendStatus');
            if (!backendBase) {
                if (statusEl) statusEl.innerText = 'Backend: disabled';
                return false;
            }
            try {
                const res = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}/rooms`, { method: 'GET' });
                if (res.ok) {
                    if (statusEl) statusEl.innerText = 'Backend: reachable';
                    return true;
                } else {
                    if (statusEl) statusEl.innerText = 'Backend: unreachable';
                    return false;
                }
            } catch (e) {
                if (statusEl) statusEl.innerText = 'Backend: connection failed';
                return false;
            }
        }

        // Load tenants from backend and store in localStorage (owner scoped)
        async function loadTenantsFromBackend() {
            if (!backendBase) return alert('Backend not configured.');
            try {
                const resp = await apiFetch(`/api/tenants/owner/${encodeURIComponent(ownerId)}`);
                if (!resp.ok) return alert('Failed to fetch tenants from backend: ' + resp.status);
                const data = await resp.json();
                // Expect data to be an array or object with .data
                const tenants = Array.isArray(data) ? data : (data.data || data.tenants || []);
                if (!Array.isArray(tenants)) return alert('Unexpected tenants response');
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                document.getElementById('tenantsCount').innerText = 'Tenants: ' + tenants.length;
                alert('Imported ' + tenants.length + ' tenants into localStorage');
                // refresh room UI
                loadRooms();
            } catch (e) {
                console.error('loadTenantsFromBackend error', e);
                alert('Error importing tenants: ' + e.message);
            }
        }

        // 2. Load Rooms
        async function loadRooms() {
            // Try backend cache first
            let myRooms = [];
            if (backendRoomsCache && Array.isArray(backendRoomsCache)) {
                myRooms = backendRoomsCache.filter(r => (r.ownerLoginId === ownerId) || (r.owner && r.owner.loginId === ownerId) || (r.ownerId === ownerId));
            }

            // If backend didn't return rooms, fallback to localStorage
            if (!myRooms || myRooms.length === 0) {
                const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
                let patched = false;
                const fixedTitle = firstValidValue(currentProperty && (currentProperty.title || currentProperty.name)) || 'Owner Property';
                allRooms.forEach((r) => {
                    if (r && (r.ownerId === ownerId || r.ownerLoginId === ownerId || r.owner === ownerId) && !firstValidValue(r.propertyTitle)) {
                        r.propertyTitle = fixedTitle;
                        patched = true;
                    }
                });
                if (patched) {
                    try { localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms)); } catch (_) {}
                }
                myRooms = allRooms.filter(r => r.ownerId === ownerId || r.ownerLoginId === ownerId || r.owner === ownerId);

                // If still no rooms (session ownerId might be missing), try matching by current property
                if((!myRooms || myRooms.length === 0) && currentProperty) {
                    const pid = currentProperty._id || currentProperty.id || currentProperty.propertyId || currentProperty.id;
                    myRooms = allRooms.filter(r => r.propertyId === pid || r.propertyTitle === (currentProperty.title || currentProperty.name));
                    if(myRooms && myRooms.length > 0) console.debug('loadRooms: matched rooms by property fallback', pid, myRooms.length);
                }
            }

            // Deduplicate rooms by room number + property to prevent showing the same room twice
            // (same room may exist in both localStorage and backend with different IDs)
            const seenRoomKeys = new Set();
            myRooms = myRooms.filter(room => {
                const propId = room.propertyId || room.property?._id || room.property?.id || '';
                const roomNum = room.number || '';
                const roomKey = `${propId}:${roomNum}`;
                
                if (seenRoomKeys.has(roomKey)) {
                    console.debug('loadRooms: filtering duplicate room', { roomKey, roomId: room.id || room._id });
                    return false;
                }
                seenRoomKeys.add(roomKey);
                return true;
            });
            
            const grid = document.getElementById('roomsGrid');
            if(!grid) return;
            grid.innerHTML = '';

            const emptyState = document.getElementById('emptyState');
            if (myRooms.length === 0) {
                if(emptyState) emptyState.classList.remove('hidden');
                return;
            }
            if(emptyState) emptyState.classList.add('hidden');

            myRooms.forEach(room => {
                const bedsVisuals = generateBedsVisuals(room);
                const occupied = room.beds.filter(b => b.status === 'occupied').length;
                const total = room.beds.length;
                const percent = Math.round((occupied / total) * 100);
                
                const borderColorClass = room.type === 'AC' ? 'room-card-ac' : 'room-card-nonac';
                const badgeColor = room.type === 'AC' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';

                const card = document.createElement('div');
                card.className = `bg-white rounded-xl shadow-sm border border-gray-100 p-0 flex flex-col room-card ${borderColorClass}`;
                
                card.innerHTML = `
                    <!-- Card Header -->
                    <div class="p-5 pb-3 border-b border-gray-50">
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="text-lg font-bold text-gray-800">Room ${room.number}</h3>
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor} uppercase tracking-wide">${room.type}</span>
                                    ${room.source === 'tenant' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">From Visit</span>' : ''}
                                    
                                    ${room.approvalStatus === 'auto-approved' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">Approved</span>' : ''}
                                </div>
                                <div class="text-xs text-gray-400">Capacity: ${total} Beds</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-slate-700">₹${room.rent}<span class="text-xs text-gray-400 font-normal">/mo</span></div>
                            </div>
                        </div>
                        
                        <div class="mt-3 flex items-center gap-2">
                            <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-green-500 rounded-full" style="width: ${percent}%"></div>
                            </div>
                            <span class="text-[10px] font-bold text-gray-500">${occupied}/${total}</span>
                        </div>
                    </div>
                    
                    <div class="p-5 bg-slate-50 flex-1">
                        <div class="grid grid-cols-2 gap-3">
                            ${bedsVisuals}
                            <div onclick="addBedToRoom('${room.id}')" class="add-bed-btn p-3 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition h-full min-h-[80px]" title="Add another bed">
                                <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm text-gray-400">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </div>
                                <span class="text-xs font-semibold">Add Bed</span>
                            </div>
                        </div>
                    </div>

                    <div class="px-5 py-3 bg-white border-t border-gray-100 flex justify-end gap-2">
                        ${room.source === 'tenant' ? '<span class="text-xs text-gray-500 flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3"></i> Read-only (from visit)</span>' : ''}
                                    
                        <button onclick="deleteRoom('${room.id}')" ${room.source === 'tenant' ? 'disabled' : ''} class="text-gray-400 hover:text-red-500 disabled:text-gray-200 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition">
                            <i data-lucide="trash-2" class="w-3 h-3"></i> Remove Room
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function generateBedsVisuals(room) {
            return room.beds.map((bed, idx) => {
                const bedNum = idx + 1;
                if (bed.status === 'occupied') {
                    return `
                    <div class="bed-item bed-occupied p-3 rounded-lg relative group h-full min-h-[80px] flex flex-col justify-between">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-1.5">
                                <div class="w-6 h-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-[10px] font-bold">
                                    ${(bed.tenantName || 'U').charAt(0)}
                                </div>
                                <span class="text-xs font-bold text-green-800 truncate max-w-[60px]">${bed.tenantName || 'User'}</span>
                            </div>
                            <span class="text-[9px] font-bold text-green-600 bg-green-100 px-1 rounded">B${bedNum}</span>
                        </div>
                        <div class="mt-2 text-[10px] text-green-600 flex items-center gap-1">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
                        </div>
                        <div class="absolute inset-0 bg-white/95 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-red-200" onclick="vacateBed('${room.id}', ${idx})">
                            <span class="text-red-500 text-xs font-bold flex items-center gap-1"><i data-lucide="log-out" class="w-3 h-3"></i> Vacate</span>
                        </div>
                    </div>`;
                } else {
                    return `
                    <div onclick="openAssignModal('${room.id}', ${idx}, '${room.number}')" class="bed-item bed-empty p-3 rounded-lg flex flex-col items-center justify-center text-center relative group h-full min-h-[80px]">
                        <span class="absolute top-1 left-2 text-[9px] font-bold text-gray-300">B${bedNum}</span>
                        <div class="text-purple-300 group-hover:text-purple-500 transition-colors mb-1">
                            <i data-lucide="user-plus" class="w-5 h-5"></i>
                        </div>
                        <span class="text-xs font-semibold group-hover:underline">Assign</span>
                        <button onclick="removeBedFromRoom('${room.id}', ${idx}, event)" class="absolute -top-1.5 -right-1.5 bg-white text-gray-300 hover:text-red-500 shadow-sm border border-gray-100 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all hover:scale-110" title="Remove Bed">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>
                    </div>`;
                }
            }).join('');
        }

        // 3. Save Room
        async function saveRoom(e) {
            e.preventDefault();
            let propId = document.getElementById('modalPropertyId').value;
            const number = document.getElementById('roomNo').value;
            const type = document.getElementById('roomType').value;
            const rent = document.getElementById('roomRent').value;
            const gender = document.getElementById('roomGender').value;
            const bedCount = parseInt(document.getElementById('roomBeds').value);

            if (!propId) {
                propId = await ensureCorrectPropertyId();
                const modalIdEl = document.getElementById('modalPropertyId');
                if (modalIdEl && propId) modalIdEl.value = propId;
            }
            if (!propId) return alert("Property not loaded. Cannot add room.");

            const beds = Array(bedCount).fill().map(() => ({ status: 'available', tenantId: null, tenantName: null }));

            const newRoom = {
                id: 'ROOM-' + Date.now(),
                ownerId: ownerId,
                ownerLoginId: (user && (user.loginId || user.ownerId)) || ownerId,
                owner: (user && (user.name || user.ownerName)) || undefined,
                propertyId: propId,
                propertyTitle: firstValidValue(currentProperty && (currentProperty.title || currentProperty.name)) || 'Owner Property',
                number,
                type,
                rent,
                gender,
                beds,
                source: 'owner',
                submittedAt: new Date().toISOString(),
                submittedBy: (user && (user.name || user.ownerName)) || 'Owner',
                approvalStatus: 'auto-approved'
            };

            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            allRooms.push(newRoom);
            try {
                localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms));
            } catch (err) {
                console.error('Failed to save roomhy_rooms:', err);
            }

            closeRoomModal();
            loadRooms();
        }

        // 4. Manage Bed Logic
        function addBedToRoom(roomId) {
            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            const roomIdx = allRooms.findIndex(r => r.id === roomId);
            if (roomIdx !== -1) {
                if(allRooms[roomIdx].beds.length >= 10) return alert("Maximum 10 beds per room.");
                allRooms[roomIdx].beds.push({ status: 'available', tenantId: null, tenantName: null });
                try { localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms)); } catch(e){ console.error('Failed to save roomhy_rooms after addBed:', e); }
                loadRooms();
            }
        }

        function removeBedFromRoom(roomId, bedIdx, event) {
            event.stopPropagation();
            if(!confirm("Remove this bed slot permanently?")) return;
            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            const roomIdx = allRooms.findIndex(r => r.id === roomId);
            if (roomIdx !== -1) {
                allRooms[roomIdx].beds.splice(bedIdx, 1);
                localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms));
                loadRooms();
            }
        }

        function adjustBedCount(delta) {
            const input = document.getElementById('roomBeds');
            let val = parseInt(input.value) + delta;
            if(val < 1) val = 1;
            if(val > 10) val = 10;
            input.value = val;
        }

        // Ensure propertyId is correct MongoDB ObjectId for backend tenant assign API
        async function ensureCorrectPropertyId() {
            const isMongoId = (value) => /^[a-f\d]{24}$/i.test(String(value || '').trim());
            const normalizedOwnerId = String(ownerId || '').trim().toUpperCase();
            const wantedTitle = String(
                (currentProperty && (currentProperty.title || currentProperty.name || currentProperty.propertyName))
                || ((window.__ownerContext && window.__ownerContext.propertyName) || '')
                || ''
            ).trim().toLowerCase();

            const pickBestPropertyId = (items) => {
                if (!Array.isArray(items) || items.length === 0) return null;

                const matchByOwner = items.filter((p) => {
                    const candidateOwner = String(
                        p?.ownerLoginId || p?.owner?.loginId || p?.ownerId || p?.generatedCredentials?.loginId || ''
                    ).trim().toUpperCase();
                    return candidateOwner && candidateOwner === normalizedOwnerId;
                });

                const pool = matchByOwner.length > 0 ? matchByOwner : items;

                if (wantedTitle) {
                    const titleMatch = pool.find((p) => {
                        const title = String(p?.title || p?.name || p?.propertyName || '').trim().toLowerCase();
                        return title && title === wantedTitle;
                    });
                    const titleId = titleMatch?._id || titleMatch?.id || titleMatch?.propertyId || null;
                    if (titleId && isMongoId(titleId)) return String(titleId);
                }

                const first = pool.find((p) => isMongoId(p?._id || p?.id || p?.propertyId));
                if (!first) return null;
                return String(first._id || first.id || first.propertyId);
            };

            try {
                // PRIORITY 1: Owner-specific properties endpoint.
                if (backendBase && normalizedOwnerId) {
                    console.log('ensureCorrectPropertyId: checking owner properties API', normalizedOwnerId);
                    const pres = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}/properties`);
                    if (pres.ok) {
                        const pdata = await pres.json();
                        const props = Array.isArray(pdata?.properties) ? pdata.properties : [];
                        const id = pickBestPropertyId(props);
                        if (id) {
                            if (currentProperty) currentProperty._id = id;
                            const modalIdEl = document.getElementById('modalPropertyId');
                            if (modalIdEl) modalIdEl.value = id;
                            console.log('ensureCorrectPropertyId: resolved from owner properties API', id);
                            return id;
                        }
                    }
                }

                // PRIORITY 2: Superadmin property source (/api/properties) used by superadmin//propertyowner/properties.
                if (backendBase) {
                    console.log('ensureCorrectPropertyId: checking superadmin property source /api/properties');
                    const allRes = await apiFetch(`/api/properties`);
                    if (allRes.ok) {
                        const allData = await allRes.json();
                        const allProps = Array.isArray(allData?.properties) ? allData.properties : [];
                        const id = pickBestPropertyId(allProps);
                        if (id) {
                            if (currentProperty) currentProperty._id = id;
                            const modalIdEl = document.getElementById('modalPropertyId');
                            if (modalIdEl) modalIdEl.value = id;
                            try {
                                const cacheList = allProps.map((p) => ({
                                    _id: p?._id || p?.id || p?.propertyId || null,
                                    id: p?.id || p?._id || p?.propertyId || null,
                                    propertyId: p?.propertyId || p?._id || p?.id || null,
                                    title: p?.title || p?.name || p?.propertyName || '',
                                    name: p?.name || p?.title || p?.propertyName || '',
                                    ownerLoginId: p?.ownerLoginId || p?.owner?.loginId || '',
                                    locationCode: p?.locationCode || p?.areaCode || ''
                                }));
                                localStorage.setItem('roomhy_properties', JSON.stringify(cacheList));
                            } catch (_) {}
                            console.log('ensureCorrectPropertyId: resolved from /api/properties', id);
                            return id;
                        }
                    }
                }

                // PRIORITY 3: Cached property data populated by superadmin//propertyowner/properties.
                try {
                    const cached = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                    const id = pickBestPropertyId(cached);
                    if (id) {
                        if (currentProperty) currentProperty._id = id;
                        const modalIdEl = document.getElementById('modalPropertyId');
                        if (modalIdEl) modalIdEl.value = id;
                        console.log('ensureCorrectPropertyId: resolved from local cache roomhy_properties', id);
                        return id;
                    }
                } catch (_) {}

                // PRIORITY 4: No property found -> auto-create from owner context.
                const propertyTitle =
                    (currentProperty && (currentProperty.title || currentProperty.name || currentProperty.propertyName))
                    || ((window.__ownerContext && window.__ownerContext.propertyName) || '').trim()
                    || 'Owner Property';
                const propertyAddress =
                    (currentProperty && (currentProperty.address || currentProperty.location || currentProperty.city || currentProperty.area))
                    || ((window.__ownerContext && (window.__ownerContext.propertyLocation || window.__ownerContext.area)) || '')
                    || '';
                const propertyArea =
                    ((window.__ownerContext && (window.__ownerContext.area || window.__ownerContext.locationCode)) || areaCode || '')
                    || '';

                console.warn('ensureCorrectPropertyId: no property found, creating one', { ownerId: normalizedOwnerId, propertyTitle, propertyArea });
                let createRes = await apiFetch(`/api/owners/${encodeURIComponent(ownerId)}/properties`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: propertyTitle,
                        address: propertyAddress,
                        locationCode: propertyArea,
                        area: propertyArea
                    })
                });

                if (!createRes.ok && createRes.status === 404) {
                    createRes = await apiFetch(`/api/properties/ensure-owner`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ownerLoginId: normalizedOwnerId,
                            title: propertyTitle,
                            address: propertyAddress,
                            locationCode: propertyArea,
                            area: propertyArea
                        })
                    });
                }

                if (createRes.ok) {
                    const created = await createRes.json();
                    const newId = created?.property?._id || null;
                    if (newId && isMongoId(newId)) {
                        if (currentProperty) {
                            currentProperty._id = newId;
                            currentProperty.title = propertyTitle;
                            currentProperty.name = propertyTitle;
                        }
                        const modalIdEl = document.getElementById('modalPropertyId');
                        if (modalIdEl) modalIdEl.value = newId;
                        console.log('ensureCorrectPropertyId: auto-created property', newId);
                        return newId;
                    }
                }

                const createFail = await createRes.json().catch(() => ({}));
                console.error('ensureCorrectPropertyId: property create failed', createFail);
                return null;
            } catch (err) {
                console.error('ensureCorrectPropertyId: error', err);
                return null;
            }
        }
        // 5. Assign Tenant Logic with TABS
        function openAssignModal(roomId, bedIndex, roomNum) {
            document.getElementById('assignRoomId').value = roomId;
            document.getElementById('assignBedIndex').value = bedIndex;
            const titleEl = document.getElementById('assignRoomTitle');
            if(titleEl) titleEl.innerText = `Assigning to Room ${roomNum} - Bed ${bedIndex + 1}`;
            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            const room = allRooms.find(r => r.id === roomId);
            const propertyNameEl = document.getElementById('assignPropertyName');
            const roomNoEl = document.getElementById('assignRoomNumber');
            const rentEl = document.getElementById('assignRoomRent');
            if (room) {
                const resolvedPropertyName = firstValidValue(
                    room.propertyTitle,
                    currentProperty && (currentProperty.title || currentProperty.name || currentProperty.propertyName),
                    document.getElementById('modalPropertyNameText') ? document.getElementById('modalPropertyNameText').innerText : '',
                    'Owner Property'
                ) || 'Owner Property';
                room.propertyTitle = resolvedPropertyName;
                if (propertyNameEl) propertyNameEl.innerText = resolvedPropertyName;
                if (roomNoEl) roomNoEl.innerText = room.number || roomNum || '-';
                if (rentEl) rentEl.innerText = `INR ${room.rent || 0}`;
            }
            
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const available = tenants.filter(t => t.ownerId === ownerId && !t.roomNo);
            
            const select = document.getElementById('tenantSelect');
            select.innerHTML = '<option value="">Select a tenant...</option>';
            
            if (available.length === 0) {
                const opt = document.createElement('option');
                opt.text = "No unassigned tenants found";
                opt.disabled = true;
                select.add(opt);
            } else {
                available.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id || t.loginId;
                    opt.text = t.name;
                    select.add(opt);
                });
            }

            toggleAssignTab('new');
            const modal = document.getElementById('assignModal');
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        function toggleAssignTab(mode) {
            const inputMode = document.getElementById('assignMode');
            if(inputMode) inputMode.value = mode;
            
            const secExist = document.getElementById('existingTenantSection');
            const secNew = document.getElementById('newTenantSection');
            const tabEx = document.getElementById('tabExisting');
            const tabNew = document.getElementById('tabNew');

            if (mode === 'existing') {
                if(secExist) secExist.classList.remove('hidden');
                if(secNew) secNew.classList.add('hidden');
                if(tabEx) { tabEx.classList.add('active', 'bg-white', 'text-purple-600', 'shadow-sm'); tabEx.classList.remove('text-gray-500'); }
                if(tabNew) { tabNew.classList.remove('active', 'bg-white', 'text-purple-600', 'shadow-sm'); tabNew.classList.add('text-gray-500'); }
            } else {
                if(secExist) secExist.classList.add('hidden');
                if(secNew) secNew.classList.remove('hidden');
                if(tabNew) { tabNew.classList.add('active', 'bg-white', 'text-purple-600', 'shadow-sm'); tabNew.classList.remove('text-gray-500'); }
                if(tabEx) { tabEx.classList.remove('active', 'bg-white', 'text-purple-600', 'shadow-sm'); tabEx.classList.add('text-gray-500'); }
            }
        }

        async function confirmAssignment(e) {
            e.preventDefault();
            const mode = document.getElementById('assignMode').value;
            const roomId = document.getElementById('assignRoomId').value;
            const bedIdx = parseInt(document.getElementById('assignBedIndex').value);
            
            let tenantId, tenantName;
            
            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            const roomIdx = allRooms.findIndex(r => r.id === roomId);
            if (roomIdx === -1) return;
            const assignedPropertyName = firstValidValue(
                document.getElementById('assignPropertyName') ? document.getElementById('assignPropertyName').innerText : '',
                allRooms[roomIdx].propertyTitle,
                currentProperty && (currentProperty.title || currentProperty.name || currentProperty.propertyName),
                'Owner Property'
            ) || 'Owner Property';
            allRooms[roomIdx].propertyTitle = assignedPropertyName;

            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');

            if (mode === 'existing') {
                tenantId = document.getElementById('tenantSelect').value;
                if (!tenantId) return alert("Select a tenant");
                const t = tenants.find(x => x.id === tenantId || x.loginId === tenantId);
                if(!t) return;
                tenantName = t.name;
                if (!t.email) return alert("Tenant email is required. Please update tenant email before assigning room.");
                if (!t.phone) return alert("Tenant phone number is required. Please update tenant phone before assigning room.");
                
                if (!t.loginId) {
                    const creds = generateCredentials(areaCode);
                    t.loginId = creds.loginId;
                    t.password = creds.password;
                    t.tempPassword = creds.password;
                    showCredentialsModal(t.name, t.loginId, t.password, t.email, {
                        propertyName: assignedPropertyName,
                        roomNo: allRooms[roomIdx].number,
                        agreedRent: allRooms[roomIdx].rent || 0
                    });
                }
                t.roomNo = allRooms[roomIdx].number;
                t.bedNo = bedIdx + 1;
                t.propertyId = allRooms[roomIdx].propertyId;
                t.propertyTitle = assignedPropertyName;
                t.ownerLoginId = ownerId;
                t.agreedRent = allRooms[roomIdx].rent || 0;
                t.moveInDate = new Date().toISOString().split('T')[0];
                // assign property object or fallback to title for display
                try {
                    const props = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                    const prop = props.find(p => (p._id && p._id === t.propertyId) || (p.id && p.id === t.propertyId) || (p.propertyId && p.propertyId === t.propertyId) || (p.title && p.title === t.propertyId) || (p.name && p.name === t.propertyId));
                    if (prop) t.property = prop;
                    else if (allRooms[roomIdx].propertyTitle) t.property = { title: allRooms[roomIdx].propertyTitle };
                    else if (currentProperty) t.property = { title: currentProperty.title || currentProperty.name };
                } catch (err) {}
                t.assignedBy = ownerId;

                // Keep backend sync best-effort for legacy tenants (without dbId)
                if (!t.dbId) {
                    try {
                        // Ensure we have correct propertyId before sending
                        const correctPropertyId = await ensureCorrectPropertyId();
                        // Only send fields expected by backend /api/tenants/assign
                        const payload = {
                            name: t.name,
                            phone: t.phone,
                            email: t.email,
                            propertyId: correctPropertyId || t.propertyId || '',
                            roomNo: t.roomNo,
                            bedNo: t.bedNo,
                            moveInDate: t.moveInDate,
                            agreedRent: t.agreedRent,
                            ownerLoginId: ownerId,
                            propertyTitle: assignedPropertyName,
                            locationCode: (window.__ownerContext && (window.__ownerContext.area || window.__ownerContext.locationCode)) || areaCode || ''
                        };
                        const resp = await apiFetch(`/api/tenants/assign`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (resp.ok) {
                            const data = await resp.json();
                            if (data && data.tenant) {
                                t.dbId = data.tenant.id || data.tenant._id || t.dbId;
                                t.loginId = data.tenant.loginId || t.loginId;
                                t.tempPassword = data.tenant.tempPassword || t.tempPassword;
                            }
                        }
                    } catch (err) {
                        console.warn('Tenant sync to backend failed (continuing with local record):', err);
                    }
                }
            } else {
                const name = document.getElementById('newTenantName').value.trim();
                const phone = document.getElementById('newTenantPhone').value.trim();
                const email = document.getElementById('newTenantEmail').value.trim();
                
                if (!name || !phone || !email) return alert("Name, Phone and Tenant Gmail are required");
                if (!/^[0-9]{10}$/.test(phone)) return alert("Tenant phone must be 10 digits");
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Enter valid tenant Gmail ID");

                const newTenant = {
                    id: 'TNT-' + Date.now(),
                    loginId: '',
                    password: '',
                    name: name,
                    phone: phone,
                    email: email,
                    ownerId: ownerId,
                    roomNo: allRooms[roomIdx].number,
                    bedNo: bedIdx + 1,
                    propertyId: allRooms[roomIdx].propertyId,
                    propertyTitle: allRooms[roomIdx].propertyTitle || (currentProperty && (currentProperty.title || currentProperty.name)) || '',
                    agreedRent: allRooms[roomIdx].rent || 0,
                    moveInDate: new Date().toISOString().split('T')[0],
                    // attach property object for immediate display in tenant records
                    property: (function(){
                        try {
                            const props = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
                            const pid = allRooms[roomIdx].propertyId;
                            const found = props.find(p => (p._id && p._id === pid) || (p.id && p.id === pid) || (p.propertyId && p.propertyId === pid) || (p.title && p.title === pid) || (p.name && p.name === pid));
                            if (found) return found;
                        } catch(e) {}
                        if (allRooms[roomIdx].propertyTitle) return { title: allRooms[roomIdx].propertyTitle };
                        if (currentProperty) return { title: currentProperty.title || currentProperty.name };
                        return allRooms[roomIdx].propertyId || '';
                    })(),
                    status: 'Active',
                    assignedBy: ownerId,
                    ownerLoginId: ownerId,
                    joinedDate: new Date().toISOString().split('T')[0]
                };
                
                tenants.push(newTenant);
                tenantName = name;

                // Create tenant in backend first; use backend-generated credentials to avoid mismatch.
                let modalLoginId = '';
                let modalPassword = '';
                try {
                    // Ensure we have correct propertyId before sending (this will fetch fresh from API)
                    const correctPropertyId = await ensureCorrectPropertyId();
                    
                    // Only send fields expected by backend /api/tenants/assign
                    const payload = {
                        name: newTenant.name,
                        phone: newTenant.phone,
                        email: newTenant.email,
                        propertyId: correctPropertyId || newTenant.propertyId || '',
                        roomNo: newTenant.roomNo,
                        bedNo: newTenant.bedNo,
                        moveInDate: newTenant.moveInDate,
                        agreedRent: newTenant.agreedRent,
                        ownerLoginId: ownerId,
                        propertyTitle: assignedPropertyName,
                        locationCode: (window.__ownerContext && (window.__ownerContext.area || window.__ownerContext.locationCode)) || areaCode || ''
                    };
                    
                    console.log('📤 Sending tenant assignment payload:', payload);
                    const resp = await apiFetch(`/api/tenants/assign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!resp.ok) {
                        const failData = await resp.json().catch(() => ({}));
                        return alert(failData.message || 'Failed to assign tenant in backend');
                    }
                    const d = await resp.json();
                    if (d && d.tenant) {
                        newTenant.dbId = d.tenant.id || d.tenant._id || '';
                        newTenant.loginId = d.tenant.loginId || '';
                        newTenant.tempPassword = d.tenant.tempPassword || '';
                        newTenant.password = d.tenant.tempPassword || '';
                        newTenant.ownerLoginId = d.tenant.ownerLoginId || newTenant.ownerLoginId;
                        // Keep property name from current rooms assignment context.
                        newTenant.propertyTitle = assignedPropertyName;
                        newTenant.property = { title: assignedPropertyName };
                        modalLoginId = newTenant.loginId;
                        modalPassword = newTenant.tempPassword;
                    }
                } catch (err) {
                    console.warn('Tenant assign to backend failed:', err);
                    const reason = (err && err.message) ? `\nReason: ${err.message}` : '';
                    return alert(`Backend assign failed. Please try again.${reason}`);
                }

                tenantId = newTenant.loginId || newTenant.id;
                showCredentialsModal(name, modalLoginId, modalPassword, email, {
                    propertyName: assignedPropertyName,
                    roomNo: newTenant.roomNo,
                    agreedRent: newTenant.agreedRent || 0
                });
            }

            allRooms[roomIdx].beds[bedIdx] = {
                status: 'occupied',
                tenantId: tenantId,
                tenantName: tenantName
            };
            localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms));
            localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));

            closeAssignModal();
            loadRooms();
        }

        function generateCredentials(code) {
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const nextNumber = tenants.reduce((max, t) => {
                const id = String((t && t.loginId) || '');
                const match = id.match(/^ROOMHYTNT(\d{4})$/i);
                if (!match) return max;
                const n = parseInt(match[1], 10);
                return Number.isFinite(n) && n > max ? n : max;
            }, 0) + 1;
            const loginId = `ROOMHYTNT${String(nextNumber).padStart(4, '0')}`;
            const password = Math.random().toString(36).slice(-8);
            return { loginId, password };
        }

        function showCredentialsModal(name, id, pass, email, assignmentDetails = {}) {
            const nameEl = document.getElementById('credName');
            const idEl = document.getElementById('credLoginId');
            const passEl = document.getElementById('credPassword');
            const modal = document.getElementById('credsModal');

            if(nameEl) nameEl.innerText = name;
            if(idEl) idEl.innerText = id;
            if(passEl) passEl.innerText = pass;
            
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            
            // Send email credentials with digital check-in link
            if (email) {
                try {
                    const checkinBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? 'http://localhost:5001'
                        : 'https://admin.roomhy.com';
                    const checkinLink = `${checkinBase}/digital-checkin/tenantprofile?loginId=${encodeURIComponent(id)}`;
                    const propertyName = firstValidValue(
                        assignmentDetails.propertyName,
                        document.getElementById('assignPropertyName') ? document.getElementById('assignPropertyName').innerText : '',
                        currentProperty && (currentProperty.title || currentProperty.name || currentProperty.propertyName),
                        'Owner Property'
                    ) || 'Owner Property';
                    const roomNo = assignmentDetails.roomNo || '-';
                    const agreedRent = assignmentDetails.agreedRent || 0;
                    const emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
                                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                                .header h1 { margin: 0; font-size: 28px; }
                                .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
                                .credentials-box { background: #f5f5f5; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; font-family: 'Courier New', monospace; }
                                .credentials-box p { margin: 10px 0; font-size: 14px; }
                                .label { color: #666; font-weight: bold; }
                                .value { color: #000; font-weight: bold; font-size: 16px; }
                                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                            </style>
</head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>🏠 Welcome to RoomHy!</h1>
                                </div>
                                <div class="content">
                                    <p>Hi ${name},</p>
                                    
                                    <p>You have been successfully assigned a room. Your tenant account has been created on the RoomHy platform. Here are your login credentials:</p>
                                    <p><strong>Property:</strong> ${propertyName}</p>
                                    <p><strong>Room Number:</strong> ${roomNo}</p>
                                    <p><strong>Rent:</strong> INR ${agreedRent}</p>
                                    
                                    <div class="credentials-box">
                                        <p><span class="label">Login ID:</span><br><span class="value">${id}</span></p>
                                        <p><span class="label">Password:</span><br><span class="value">${pass}</span></p>
                                    </div>

                                    <p><strong>Tenant Digital Check-In Link:</strong><br><a href="${checkinLink}">${checkinLink}</a></p>
                                    
                                    <p><strong>Next Steps:</strong></p>
                                    <ol>
                                        <li>Log in to your tenant portal using the credentials above</li>
                                        <li>Open the digital check-in link and complete profile + KYC + OTP + agreement</li>
                                        <li>Complete your profile information</li>
                                        <li>Upload necessary documents</li>
                                        <li>Connect with property management</li>
                                    </ol>
                                    
                                    <p style="color: #d32f2f; font-weight: bold;">⚠️ Important: Please keep these credentials secure and change your password on first login.</p>
                                    
                                    <p>If you have any questions, please contact property management.</p>
                                </div>
                                <div class="footer">
                                    <p>© 2026 Roomhy. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
                    
                    apiFetch(`/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            subject: '🏠 Your RoomHy Tenant Account Credentials',
                            html: emailHtml,
                            text: `Tenant login credentials\nProperty: ${propertyName}\nRoom Number: ${roomNo}\nRent: INR ${agreedRent}\nLogin ID: ${id}\nPassword: ${pass}\nDigital Check-In: ${checkinLink}`
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.success) {
                            console.log('✅ Credentials email sent to:', email);
                        } else {
                            console.warn('⚠️ Failed to send email:', data.message);
                        }
                    }).catch(err => console.error('❌ Email send error:', err));
                } catch (err) {
                    console.error('Error preparing email:', err);
                }
            }
        }
        function closeCredsModal() {
            const modal = document.getElementById('credsModal');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }
        function copyText(id) {
            const text = document.getElementById(id).innerText;
            navigator.clipboard.writeText(text);
            alert("Copied!");
        }

        function vacateBed(roomId, bedIdx) {
            if(!confirm("Remove tenant from this bed?")) return;
            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            const roomIdx = allRooms.findIndex(r => r.id === roomId);
            if (roomIdx === -1) return;

            const tenantId = allRooms[roomIdx].beds[bedIdx].tenantId;
            allRooms[roomIdx].beds[bedIdx] = { status: 'available', tenantId: null, tenantName: null };
            localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms));

            if (tenantId) {
                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                const tIdx = tenants.findIndex(t => (t.id === tenantId || t.loginId === tenantId));
                if (tIdx !== -1) {
                    tenants[tIdx].status = 'moved_out';
                    tenants[tIdx].moveOutDate = new Date().toISOString();
                    delete tenants[tIdx].roomNo;
                    delete tenants[tIdx].bedNo;
                    delete tenants[tIdx].propertyId;
                    delete tenants[tIdx].propertyName;
                    delete tenants[tIdx].propertyTitle;
                    localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                }
            }
            loadRooms();
        }

        function deleteRoom(roomId) {
            let allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            
            const room = allRooms.find(r => r.id === roomId);
            if(!room) return alert('Room not found');
            
            // Prevent deletion of tenant-added rooms
            if(room.source === 'tenant') return alert('Cannot delete rooms added from visit reports. This room was created by area manager inspection.');
            
            // Prevent deletion of pending rooms
            // allow deletion for owner-created rooms; tenant-sourced rooms remain read-only
            if(room.source === 'tenant') return alert('Cannot delete rooms created from visit reports. Contact area manager.');
            
            if(!confirm("Delete this room? Tenants will be unassigned.")) return;
            
            if(room) {
                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                let updatedTenants = false;
                room.beds.forEach(bed => {
                    if(bed.tenantId) {
                        const tIdx = tenants.findIndex(t => t.id === bed.tenantId || t.loginId === bed.tenantId);
                        if(tIdx !== -1) {
                            delete tenants[tIdx].roomNo;
                            delete tenants[tIdx].bedNo;
                            updatedTenants = true;
                        }
                    }
                });
                if(updatedTenants) localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
            }

            allRooms = allRooms.filter(r => r.id !== roomId);
            localStorage.setItem('roomhy_rooms', JSON.stringify(allRooms));
            loadRooms();
        }

        // Modal Helpers
        function openAddRoomModal() {
            const modal = document.getElementById('roomModal');
            if(modal) {
                // Reset form
                document.getElementById('roomForm').reset();
                document.getElementById('roomBeds').value = '2';
                document.getElementById('roomGender').value = '';
                // form.reset() clears hidden fields too; repopulate property binding.
                const modalIdEl = document.getElementById('modalPropertyId');
                const modalNameEl = document.getElementById('modalPropertyNameText');
                if (modalIdEl) {
                    modalIdEl.value = (currentProperty && (currentProperty._id || currentProperty.id || currentProperty.propertyId)) || '';
                }
                if (modalNameEl && currentProperty) {
                    const t = currentProperty.title || currentProperty.name || currentProperty.propertyName || 'Property';
                    const l = currentProperty.location || currentProperty.locationCode || currentProperty.area || currentProperty.city || 'Unknown';
                    modalNameEl.innerText = `${t} (${l})`;
                }
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }
        function closeRoomModal() {
            const modal = document.getElementById('roomModal');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }
        function closeAssignModal() {
            const modal = document.getElementById('assignModal');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }
        const menuBtn = document.getElementById('mobile-menu-open');
        const closeMenuBtn = document.getElementById('close-mobile-menu');
        const menuOverlay = document.getElementById('mobile-menu-overlay');
        const mobileMenu = document.getElementById('mobile-menu');

        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => mobileMenu.classList.remove('hidden'));
        }
        if (closeMenuBtn && mobileMenu) {
            closeMenuBtn.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        }
        if (menuOverlay && mobileMenu) {
            menuOverlay.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        }

        // Init (ensure backend calls complete before rendering)
        (async function initPage(){
            await ensureOwnerContext();
            await loadOwnerProperty();
            await checkBackendStatus();
            await loadRooms();
        })();
