lucide.createIcons();
        
        // API Configuration
        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
        
        let myArea = ''; // Store logged in area
        let isAreaManager = false; // Track role
        let currentUserId = ''; // Store current logged-in user's ID
        let currentUserIds = []; // All possible IDs for current user (_id/id/loginId/login)
        let syncedVisitsCache = []; // Latest backend-synced visits kept in memory
        let originalPhotosMap = {}; // store existing photos for edits keyed by visit id
        let editingStaffPhotoId = null; // currently editing visit id for staff photo
        let staffPhotoDataURL = null; // preview / selected dataURL for staff professional photo
        let staffPhotoDataURLs = []; // array of selected/provided professional photos (dataURLs)
        let createProfessionalPhotos = []; // temporary storage for professional photos when creating a new visit
        let _currentCapturedPhoto = null; // Store the currently captured photo for preview

        // Helper: set toggle button value and visual state
        function setToggle(fieldId, value, button) {
            document.getElementById(fieldId).value = value;
            const parent = button.parentElement;
            parent.querySelectorAll('button').forEach(b => {
                b.classList.remove('border-green-500', 'border-red-500', 'bg-green-50', 'bg-red-50', 'text-green-700', 'text-red-700');
                b.classList.add('border-gray-300', 'text-gray-600');
            });
            if (value === 'Yes') {
                button.classList.remove('border-gray-300', 'text-gray-600');
                button.classList.add('border-green-500', 'bg-green-50', 'text-green-700');
            } else {
                button.classList.remove('border-gray-300', 'text-gray-600');
                button.classList.add('border-red-500', 'bg-red-50', 'text-red-700');
            }
        }

        // Helper: handle star rating (works with any star field)
        function handleStarClick(e, fieldId) {
            if (e.target.classList.contains('star')) {
                const value = e.target.getAttribute('data-value');
                document.getElementById(fieldId).value = value;
                
                // Find the parent container (works for all star rating fields)
                const starsContainer = e.currentTarget;
                const stars = starsContainer.querySelectorAll('.star');
                stars.forEach((s, i) => {
                    s.classList.toggle('text-yellow-400', i < value);
                    s.classList.toggle('text-gray-300', i >= value);
                });
                
                // Update label if it exists
                const labelId = fieldId + 'Label';
                const label = document.getElementById(labelId);
                if (label) label.innerText = `Rating: ${value}/5 \u2605`;
            }
        }

        // Helper: set owner behaviour
        function setOwnerBehaviour(value, button) {
            document.getElementById('ownerBehaviourPublic').value = value;
            const parent = button.parentElement;
            parent.querySelectorAll('button').forEach(b => {
                b.classList.remove('border-green-500', 'border-yellow-500', 'border-red-500', 'bg-green-50', 'bg-yellow-50', 'bg-red-50', 'text-green-700', 'text-yellow-700', 'text-red-700');
                b.classList.add('border-gray-300', 'text-gray-600');
            });
            if (value === 'Good') button.classList.add('border-green-500', 'bg-green-50', 'text-green-700');
            else if (value === 'Average') button.classList.add('border-yellow-500', 'bg-yellow-50', 'text-yellow-700');
            else button.classList.add('border-red-500', 'bg-red-50', 'text-red-700');
            button.classList.remove('border-gray-300', 'text-gray-600');
            const label = document.getElementById('behaviourLabel');
            if (label) label.innerText = `Selected: ${value}`;
        }

        // Helper: mask phone for UI
        function maskPhone(num) {
            if (!num) return '-';
            const s = String(num).replace(/\s+/g, '');
            if (s.length <= 4) return '****' + s;
            const last = s.slice(-4);
            const stars = '*'.repeat(Math.max(3, s.length - 4));
            return stars + last;
        }

        // Watermark image file -> dataURL
        function watermarkImage(file, areaName, visitDate) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                        const maxW = img.width; const maxH = img.height;
                        const canvas = document.createElement('canvas');
                        canvas.width = maxW; canvas.height = maxH;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const text = `RoomHy | ${areaName || 'Area'} | ${visitDate}`;
                        const fontSize = Math.max(16, Math.floor(canvas.width / 40));
                        ctx.font = `${fontSize}px Inter, sans-serif`;
                        ctx.textBaseline = 'bottom';
                        const padding = 10;
                        // draw background for legibility
                        const textWidth = ctx.measureText(text).width;
                        ctx.fillStyle = 'rgba(0,0,0,0.35)';
                        ctx.fillRect(padding - 6, canvas.height - fontSize - padding - 6, textWidth + 12, fontSize + 12);
                        // draw text
                        ctx.fillStyle = 'white';
                        ctx.fillText(text, padding, canvas.height - padding);
                        resolve(canvas.toDataURL('image/jpeg', 0.85));
                    };
                    img.onerror = reject;
                    img.src = reader.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Watermark when we already have a dataURL (captured from canvas)
        function watermarkDataURL(dataURL, areaName, visitDate) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width; canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const text = `RoomHy | ${areaName || 'Area'} | ${visitDate}`;
                    const fontSize = Math.max(16, Math.floor(canvas.width / 40));
                    ctx.font = `${fontSize}px Inter, sans-serif`;
                    ctx.textBaseline = 'bottom';
                    const padding = 10;
                    const textWidth = ctx.measureText(text).width;
                    ctx.fillStyle = 'rgba(0,0,0,0.35)';
                    ctx.fillRect(padding - 6, canvas.height - fontSize - padding - 6, textWidth + 12, fontSize + 12);
                    ctx.fillStyle = 'white';
                    ctx.fillText(text, padding, canvas.height - padding);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = reject;
                img.src = dataURL;
            });
        }

        // ======================================================
        // SYNC VISITS FROM BACKEND DATABASE (New Feature)
        // ======================================================
        function mergeVisitsByKey(...lists) {
            const merged = new Map();
            const statusRank = (s) => {
                if (s === 'approved' || s === 'rejected') return 4;
                if (s === 'hold') return 3;
                if (s === 'pending_review') return 2;
                return 1;
            };

            const enrichWithIdentity = (primary, secondary) => ({
                ...(secondary || {}),
                ...(primary || {}),
                _id: (primary && primary._id) || (secondary && secondary._id) || '',
                visitId: (primary && primary.visitId) || (secondary && secondary.visitId) || '',
                submittedById: (primary && primary.submittedById) || (secondary && secondary.submittedById) || '',
                submittedByLoginId: (primary && primary.submittedByLoginId) || (secondary && secondary.submittedByLoginId) || '',
                ownerLoginId: (primary && primary.ownerLoginId) || (secondary && secondary.ownerLoginId) || '',
                staffId: (primary && primary.staffId) || (secondary && secondary.staffId) || '',
                submittedBy: (primary && primary.submittedBy) || (secondary && secondary.submittedBy) || '',
                staffName: (primary && primary.staffName) || (secondary && secondary.staffName) || '',
                propertyInfo: (primary && primary.propertyInfo) || (secondary && secondary.propertyInfo) || null
            });

            const pickLatest = (a, b) => {
                const aRank = statusRank(a && a.status);
                const bRank = statusRank(b && b.status);
                if (bRank > aRank) return enrichWithIdentity(b, a);
                if (aRank > bRank) return enrichWithIdentity(a, b);
                const aTime = new Date((a && (a.updatedAt || a.approvedAt || a.submittedAt)) || 0).getTime();
                const bTime = new Date((b && (b.updatedAt || b.approvedAt || b.submittedAt)) || 0).getTime();
                return bTime >= aTime ? enrichWithIdentity(b, a) : enrichWithIdentity(a, b);
            };

            lists.forEach((arr) => {
                (arr || []).forEach((visit) => {
                    const key = visit && (visit.visitId || visit._id);
                    if (!key) return;
                    const existing = merged.get(key);
                    merged.set(key, existing ? pickLatest(existing, visit) : visit);
                });
            });

            return Array.from(merged.values());
        }

        async function syncVisitsFromBackend(staffId, staffName) {
            try {
                console.log('ðŸ”„ Syncing visits from backend for staff:', staffId);
                
                const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                
                const response = await fetch(`${API_URL}/api/visits?staffId=${encodeURIComponent(staffId || '')}&staffName=${encodeURIComponent(staffName || '')}`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });

                if (!response.ok) {
                    console.warn('âš ï¸ Backend sync failed:', response.status);
                    return false;
                }

                const data = await response.json();
                const visits = data.visits || data || [];

                if (visits.length > 0) {
                    console.log('✅ Synced', visits.length, 'visits from backend');

                    // Normalize backend visit ids for frontend usage
                    const normalizedBackendVisits = visits.map(v => {
                        const stableId = v.visitId || v._id;
                        return {
                            ...v,
                            _id: stableId,
                            submittedById: v.submittedById || v.staffId || staffId || '',
                            submittedByLoginId: v.submittedByLoginId || v.ownerLoginId || staffId || '',
                            staffId: v.staffId || v.submittedById || staffId || '',
                            staffName: v.staffName || v.submittedBy || staffName || ''
                        };
                    });
                    syncedVisitsCache = normalizedBackendVisits.slice();

                    // Merge backend + existing local visits to avoid dropping unsynced local reports
                    try {
                        const localVisits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                        const mergedVisits = mergeVisitsByKey(localVisits, normalizedBackendVisits);
                        localStorage.setItem('roomhy_visits', JSON.stringify(mergedVisits));
                        console.log('ðŸ’¾ Saved merged synced visits to localStorage:', mergedVisits.length);
                    } catch (e) {
                        console.warn('âš ï¸ Failed to save to localStorage:', e.message);
                        try {
                            const sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
                            const mergedForSession = mergeVisitsByKey(sessionVisits, normalizedBackendVisits);
                            sessionStorage.setItem('roomhy_visits', JSON.stringify(mergedForSession));
                            console.log('Saved merged synced visits to sessionStorage:', mergedForSession.length);
                        } catch (se) {
                            console.warn('Failed to save to sessionStorage as well:', se.message);
                        }
                    }
                    
                    return true;
                } else {
                    console.log('ℹ️ No visits found on backend');
                    return false;
                }
            } catch (err) {
                console.error('âŒ Backend sync error:', err);
                return false;
            }
        }

        // Populate auth UI and load visits
        const initVisitPage = async () => {
            const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');
            if (!user) return;
            
            // Save current user ID for filtering
            currentUserId = user._id || user.id || user.loginId || user.login || '';
            currentUserIds = [user && user._id, user && user.id, user && user.loginId, user && user.login]
                .map(v => String(v || '').trim())
                .filter(Boolean);
            console.log('Current User ID:', currentUserId);
            
            document.getElementById('headerName').innerText = user.name || '';
            const staffId = currentUserId;
            document.getElementById('staffName').value = user.name || '';
            document.getElementById('staffId').value = staffId;

            if (user.role === 'areamanager') {
                isAreaManager = true;
                const displayArea = user.areaName || user.area || user.city || 'Area';
                document.getElementById('headerRole').innerText = `${displayArea} Manager`;
                myArea = '';
                console.log('Area Manager set - Will show ALL visits');
            } else if (user.role === 'employee') {
                isAreaManager = false;
                myArea = user.location || user.areaName || user.area || user.team || '';
                const displayArea = user.location || user.areaName || user.area || user.team || 'Team';
                document.getElementById('headerRole').innerText = `${displayArea} Team Member`;
                document.getElementById('areaLocality').value = myArea;
                console.log('Employee - Assigned Area:', myArea);
            } else {
                myArea = '';
                console.log('⚠️ Unknown role:', user.role);
            }

            // prefill hidden location code if available
            if (user.areaCode || (user.location && user.location.code)) {
                const myAreaCode = user.areaCode || (user.location ? user.location.code : '');
                if (document.getElementById('locationCode')) document.getElementById('locationCode').value = myAreaCode;
            }

            // Sync visits from backend to ensure data persists across refreshes
            console.log('ðŸ”„ Attempting to sync visits from backend...');
            await syncVisitsFromBackend(staffId, user.name || '');

            // Load and display visits (from localStorage or synced data)
            loadVisits();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initVisitPage);
        } else {
            initVisitPage();
        }

        // Auto-refresh when another tab updates visits (e.g., approval from Enquiry page)
        window.addEventListener('storage', (e) => {
            if (e && (e.key === 'roomhy_visits' || e.key === 'roomhy_visits_last_updated')) {
                try { loadVisits(); } catch (err) { console.warn('Auto-refresh failed:', err); }
            }
        });

        // Open modal: set visit id, date, staff and try to get geolocation
        function openModal() {
            const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');
            const now = new Date();
            const vid = 'v_' + Date.now();
            document.getElementById('visitId').value = vid;
            document.getElementById('visitDateDisplay').value = now.toLocaleString();
            document.getElementById('formMode').value = 'create';
            document.getElementById('editingId').value = '';
            if (user) {
                document.getElementById('staffName').value = user.name || '';
                document.getElementById('staffId').value = user._id || user.id || user.loginId || user.login || '';
                const areaName = user.areaName || user.location || user.area || user.team || '';
                document.getElementById('areaLocality').value = areaName;
            }

            // auto-generate property id for create mode
            generatePropertyId();

            // try geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    document.getElementById('latitude').value = pos.coords.latitude;
                    document.getElementById('longitude').value = pos.coords.longitude;
                }, (err) => {
                    console.warn('Geo error', err.message);
                }, { enableHighAccuracy: true, timeout: 10000 });
            }
            document.getElementById('addModal').classList.remove('hidden');
            document.getElementById('addModal').classList.add('flex');
            // Ensure modal is visible and scroll to top
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden'; // Prevent body scroll when modal is open
        }

        function closeModal() { 
            document.getElementById('addModal').classList.remove('flex'); 
            document.getElementById('addModal').classList.add('hidden');
            document.body.style.overflow = 'auto'; // Re-enable body scroll
            document.getElementById('visitForm').reset(); // Reset form
            document.getElementById('formMode').value = 'create';
            document.getElementById('editingId').value = '';
        }
        function closeGallery() { document.getElementById('galleryModal').classList.add('hidden'); document.getElementById('galleryModal').classList.remove('flex'); }

        // Clean up storage to prevent quota exceeded errors
        function cleanupStorage() {
            try {
                const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                if (visits.length === 0) return;
                
                const size = JSON.stringify(visits).length;
                const sizeInMB = (size / 1024 / 1024).toFixed(2);
                
                if (size > 4 * 1024 * 1024) { // If > 4MB
                    console.warn('âš ï¸ Storage nearly full:', sizeInMB, 'MB. Cleaning up old data...');
                    
                    // Keep only recent 10 visits, remove photos from older ones
                    const cleaned = visits.map((v, idx) => {
                        if (idx < visits.length - 10) {
                            // Old visit - remove photos to save space
                            return {
                                ...v,
                                photos: [],
                                professionalPhotos: []
                            };
                        }
                        return v; // Keep recent visits as-is
                    });
                    
                    localStorage.setItem('roomhy_visits', JSON.stringify(cleaned));
                    console.log('✅ Cleanup done. Removed photos from old visits.');
                    const newSize = JSON.stringify(cleaned).length;
                    console.log('ðŸ“Š Size reduced from', sizeInMB, 'MB to', (newSize / 1024 / 1024).toFixed(2), 'MB');
                }
            } catch (err) {
                console.error('Cleanup error:', err);
            }
        }

        // Load visits and render table (no delete, add edit)
        function loadVisits() {
            console.log('ðŸ”„ loadVisits() called - Starting to load visits from storage');
            cleanupStorage(); // Run cleanup before loading
            // Defensive storage reads (Tracking Prevention or other browsers may block storage access)
            let visits = [];
            let sessionVisits = [];
            try {
                visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                console.log('✅ Loaded from localStorage:', visits.length, 'visits');
                if (visits.length > 0) {
                    console.log('ðŸ“¦ First visit ID:', visits[0]._id, 'Status:', visits[0].status);
                }
            } catch (err) {
                console.error('ðŸ”’ localStorage access blocked or parse failed:', err);
                visits = [];
            }
            try {
                sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
                console.log('✅ Loaded from sessionStorage:', sessionVisits.length, 'visits');
            } catch (err) {
                console.error('ðŸ”’ sessionStorage access blocked or parse failed:', err);
                sessionVisits = [];
            }

            visits = mergeVisitsByKey(visits, sessionVisits, syncedVisitsCache);
            console.log('Merged localStorage + sessionStorage + backend cache');

            const tbody = document.getElementById('visitsTableBody');
            tbody.innerHTML = '';

            console.log('ðŸ“Š Loading visits. Total in storage:', visits.length, 'isAreaManager:', isAreaManager, 'myArea:', myArea);

            if (visits.length === 0) {
                console.warn('âš ï¸ No visits in storage');
                tbody.innerHTML = '<tr><td colspan="24" class="text-center py-8 text-gray-500">No visits found. Add one to start.</td></tr>';
                return;
            }

            // Helper: normalize strings
            const normalize = (s) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

            // Robust area matching: check multiple candidate fields and allow substring matches
            const areaMatches = (v, area) => {
                if (!area) return true;
                const a = normalize(area);
                const candidates = [];
                if (v.propertyArea) candidates.push(v.propertyArea);
                if (v.propertyInfo && v.propertyInfo.area) candidates.push(v.propertyInfo.area);
                if (v.propertyInfo && v.propertyInfo.locality) candidates.push(v.propertyInfo.locality);
                if (v.propertyInfo && v.propertyInfo.location && v.propertyInfo.location.area) candidates.push(v.propertyInfo.location.area);
                if (v.propertyInfo && v.propertyInfo.location && v.propertyInfo.location.locality) candidates.push(v.propertyInfo.location.locality);
                if (v.areaLocality) candidates.push(v.areaLocality);
                if (v.area) candidates.push(v.area);
                if (v.address) candidates.push(v.address);

                for (const c of candidates) {
                    const n = normalize(c);
                    if (!n) continue;
                    if (n === a) return true;
                    if (n.includes(a)) return true;
                    if (a.includes(n)) return true;
                }
                return false;
            };

            let filteredVisits = visits;
            
            // PRIMARY FILTER: Show only visits submitted by current user
            if (currentUserIds.length > 0) {
                const normalizedUserIds = currentUserIds.map(x => String(x || '').trim().toLowerCase()).filter(Boolean);
                filteredVisits = visits.filter(v => {
                    const submittedById = String(v.submittedById || '').trim().toLowerCase();
                    const submittedByLoginId = String(v.submittedByLoginId || '').trim().toLowerCase();
                    const staffId = String(v.staffId || '').trim().toLowerCase();
                    const ownerLoginId = String(v.ownerLoginId || '').trim().toLowerCase();
                    return normalizedUserIds.includes(submittedById) || normalizedUserIds.includes(submittedByLoginId) || normalizedUserIds.includes(staffId) || normalizedUserIds.includes(ownerLoginId);
                });
                console.log('Showing only visits by current user');
            }
            
            // SECONDARY FILTER: If employee with area, also filter by area
            if (!isAreaManager && myArea && filteredVisits.length > 0 && currentUserIds.length === 0) {
                filteredVisits = filteredVisits.filter(v => areaMatches(v, myArea));
                console.log('Also filtered by area');
            }
            
            if (filteredVisits.length === 0) {
                const msg = myArea ? `No visits found for ${myArea}.` : 'No visits found.';
                tbody.innerHTML = `<tr><td colspan="24" class="text-center py-8 text-gray-500">${msg} Add one to start.</td></tr>`;
                return;
            }
            
            console.log('Rendering ' + filteredVisits.length + ' visits');
            const rows = [];
            filteredVisits.forEach((visit, idx) => {
                console.log(`  ${idx + 1}. Visit ${visit._id} - Property: ${visit.propertyInfo?.name || 'Unknown'}`);
                const date = new Date(visit.submittedAt).toLocaleDateString();
                const prop = visit.propertyInfo || {};
                const address = visit.address || prop.address || '-';
                const photos = visit.photos || [];
                let imgBtn = `<span class="text-xs text-gray-400">No Photos</span>`;
                if (photos.length > 0) {
                    imgBtn = `
                        <button onclick='viewGallery(${JSON.stringify(photos)})' class="flex items-center justify-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs border border-purple-100">
                            <i data-lucide="image" class="w-3 h-3"></i> View (${photos.length})
                        </button>`;
                }
                let status = `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Pending</span>`;
                if (visit.status === 'approved') {
                    status = `<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Approved</span>`;
                } else if (visit.status === 'rejected') {
                    status = `<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Rejected</span>`;
                } else if (visit.status === 'hold') {
                    status = `<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">On Hold</span>`;
                }

                // Staff Name and ID
                const staffName = visit.submittedBy || visit.staffName || '-';
                const staffId = visit.submittedById || visit.staffId || '-';

                // Nearby Location
                const nearbyLocation = visit.nearbyLocation || prop.nearbyLocation || '-';

                // Area / Locality
                const areaLocality = prop.area || visit.areaLocality || visit.area || '-';

                // Landmark
                const landmark = prop.landmark || visit.landmark || '-';

                // Owner Name
                const ownerName = prop.ownerName || visit.ownerName || '-';

                // Owner Contact
                const ownerContact = prop.contactPhone || visit.contactPhone || '-';
                const ownerEmail = prop.ownerEmail || visit.ownerEmail || '-';
                const masked = maskPhone(ownerContact);

                // Gender
                const gender = visit.gender || prop.gender || '-';

                // Build amenities short list
                const amList = (visit.amenities || []).slice(0,3).join(', ');
                const photoCount = (visit.photos || []).length;
                const geoStatus = (visit.latitude && visit.longitude) ? 'Verified' : 'Not Verified';
                const visitDateTime = new Date(visit.submittedAt).toLocaleString();
                rows.push(`
                    <tr class="hover:bg-gray-50 border-b border-gray-100">
                        <td class="text-xs font-mono">${visit._id}</td>
                        <td class="text-sm text-gray-600">${visitDateTime}</td>
                        <td class="text-sm text-gray-600">${staffName}</td>
                        <td class="text-sm text-gray-600">${staffId}</td>
                        <td class="font-bold text-slate-700">${prop.name || visit.propertyName || '-'}</td>
                        <td class="text-sm text-gray-600">${prop.propertyType || visit.propertyType || '-'}</td>
                        <td class="text-sm text-gray-600 max-w-xs truncate" title="${address}">${address}</td>
                        <td class="text-sm text-gray-600">${areaLocality}</td>
                        <td class="text-sm text-gray-600">${nearbyLocation}</td>
                        <td class="text-sm text-gray-600">${landmark}</td>
                        <td class="text-sm text-gray-600 text-center">${ownerName}</td>
                        <td class="text-sm text-gray-600 text-center">${masked}</td>
                        <td class="text-sm text-gray-600 text-center">${ownerEmail}</td>
                        <td class="text-sm text-gray-600">${gender}</td>
                        <td class="text-center py-3 bg-amber-50 border-x border-amber-200">
                            <div class="flex items-center justify-center gap-1">
                                <span class="text-lg font-bold text-amber-600">${visit.studentReviewsRating ? `${'\u2605'.repeat(Math.floor(visit.studentReviewsRating))}${'\u2606'.repeat(5-Math.floor(visit.studentReviewsRating))}` : '-'}</span>
                            </div>
                        </td>
                        <td class="text-center py-3 bg-emerald-50 border-x border-emerald-200">
                            <div class="flex items-center justify-center gap-1">
                                <span class="text-lg font-bold text-emerald-600">${visit.employeeRating ? `${'\u2605'.repeat(Math.floor(visit.employeeRating))}${'\u2606'.repeat(5-Math.floor(visit.employeeRating))}` : '-'}</span>
                            </div>
                        </td>
                        <td class="text-sm text-gray-600">${amList || '-'}</td>
                        <td class="text-sm text-gray-600 text-center">${visit.cleanlinessRating || '-'}</td>
                        <td class="text-sm text-gray-600 text-center">${visit.ownerBehaviourPublic || '-'}</td>
                        <td class="text-center">${photoCount}</td>
                        <td class="text-center">${(visit.professionalPhotos && visit.professionalPhotos.length>0) ? `<div class="inline-flex items-center gap-2"><img src='${visit.professionalPhotos[0]}' class='w-12 h-12 object-cover rounded-full border' alt='Professional Photo'><span class="text-xs text-gray-600">(${visit.professionalPhotos.length})</span></div>` : (visit.status==='approved' ? `<button onclick=\"openStaffPhotoModal('${visit._id}')\" class=\"text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded\">Upload</button>` : '<span class="text-gray-400">-</span>')}</td>
                        <td class="text-center">${geoStatus}</td>
                        <td class="text-center"><button onclick="viewMap('${visit._id}')" class="text-slate-600 hover:bg-slate-50 p-1 rounded text-xs">View Map</button></td>
                        <td class="text-center">${status}</td>
                        <td class="text-center flex items-center justify-center gap-1">
                           <button ${visit.status==='approved' ? 'disabled' : ''} onclick="editVisit('${visit._id}')" class="text-slate-600 hover:bg-slate-50 p-1 rounded"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                           <button ${visit.status==='approved' ? 'disabled' : ''} onclick="deleteVisit('${visit._id}')" class="text-red-500 hover:bg-red-50 p-1 rounded"><i data-lucide="trash" class="w-4 h-4"></i></button>
                        </td>
                    </tr>`);
            });
            // Single DOM write keeps rendering stable even for 1000+ rows.
            tbody.innerHTML = rows.join('');
            lucide.createIcons();
        }

        function viewGallery(photos) {
            const grid = document.getElementById('galleryGrid');
            grid.innerHTML = '';
            photos.forEach(src => {
                grid.innerHTML += `<img src="${src}" class="w-full h-48 object-cover rounded-lg border border-gray-600">`;
            });
            document.getElementById('galleryModal').classList.remove('hidden');
            document.getElementById('galleryModal').classList.add('flex');
        }

        function viewMap(visitId) {
            // ðŸ” Search both localStorage and sessionStorage
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            let v = visits.find(x=>x._id===visitId);
            if (!v && sessionVisits.length > 0) v = sessionVisits.find(x=>x._id===visitId);
            if (!v) return alert('Visit not found');
            const lat = v.latitude; const lng = v.longitude;
            if (!lat || !lng) return alert('No geo coordinates available for this visit.');
            // show modal
            document.getElementById('mapModal').classList.remove('hidden');
            // init map
            setTimeout(()=>{
                try {
                    document.getElementById('mapContainer').innerHTML = '';
                    const map = L.map('mapContainer').setView([lat, lng], 16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                    const marker = L.marker([lat, lng]).addTo(map);
                    const meta = `${v.propertyInfo && v.propertyInfo.area ? v.propertyInfo.area : ''} - ${new Date(v.submittedAt).toLocaleString()}`;
                    marker.bindPopup(`<b>${v.propertyInfo && v.propertyInfo.name ? v.propertyInfo.name : 'Property'}</b><br>${meta}`).openPopup();
                    document.getElementById('mapMeta').innerText = meta;
                } catch (err) { console.warn(err); }
            }, 100);
        }

        function closeMap(){ document.getElementById('mapModal').classList.add('hidden'); document.getElementById('mapContainer').innerHTML=''; }

        // Camera capture logic
        let _cameraStream = null;
        let _cameraTargetField = null; // field id to save
        let _currentFacingMode = 'user'; // Track current facing mode
        let _cameraPreviousModalState = null; // restore add modal after camera closes
        const capturedPhotos = { extra: [] };

        // Auto-generate property id helper
        function generatePropertyId() {
            try {
                const loc = (document.getElementById('locationCode') && document.getElementById('locationCode').value) || (document.getElementById('areaLocality') && document.getElementById('areaLocality').value) || 'XX';
                const suffix = Math.random().toString(36).substring(2,8).toUpperCase();
                const id = `PROP-${loc}-${suffix}`;
                const el = document.getElementById('propertyId');
                if (el) el.value = id;
                return id;
            } catch (e) { console.warn('Generate propertyId failed', e); return 'PROP-' + Date.now(); }
        }

        async function openCamera(fieldId) {
            _cameraTargetField = fieldId;
            _currentFacingMode = 'user'; // Reset to front camera
            _currentCapturedPhoto = null; // Reset captured photo
            const modal = document.getElementById('cameraModal');
            const video = document.getElementById('cameraVideo');
            const loading = document.getElementById('cameraLoading');
            const errorDiv = document.getElementById('cameraError');
            const addModal = document.getElementById('addModal');
            if (!modal || !video) return alert('Camera element not found');

            if (addModal) {
                _cameraPreviousModalState = {
                    hadFlex: addModal.classList.contains('flex'),
                    wasHidden: addModal.classList.contains('hidden')
                };
                addModal.classList.remove('flex');
                addModal.classList.add('hidden');
            }
            document.body.style.overflow = 'hidden';

            // Show capture view, hide preview view
            document.getElementById('cameraCaptureView').classList.remove('hidden');
            document.getElementById('cameraPreviewView').classList.add('hidden');

            // Show full-screen camera and loading state
            modal.classList.remove('hidden');
            if (loading) loading.style.display = 'flex';
            if (errorDiv) errorDiv.style.display = 'none';

            await initCamera();
        }

        async function initCamera() {
            const video = document.getElementById('cameraVideo');
            const loading = document.getElementById('cameraLoading');
            const errorDiv = document.getElementById('cameraError');
            
            // Close existing stream before opening new one
            if (_cameraStream) {
                const tracks = _cameraStream.getTracks();
                tracks.forEach(t => t.stop());
                _cameraStream = null;
            }

            if (loading) loading.style.display = 'flex';
            if (errorDiv) errorDiv.style.display = 'none';

            try {
                    // Auto-detect and show location during capture
                    if (navigator.geolocation) {
                        const setLocationText = (text) => {
                            const locEl = document.getElementById('cameraLocationText');
                            const wrap = document.getElementById('cameraLocation');
                            if (locEl) locEl.innerText = text;
                            if (wrap) wrap.style.display = 'block';
                        };

                        const tryGeo = (opts, fallback) => {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                const lat = pos.coords.latitude.toFixed(6);
                                const lng = pos.coords.longitude.toFixed(6);
                                const locText = `${lat}, ${lng}`;
                                setLocationText(locText);
                                const latField = document.getElementById('latitude');
                                const lngField = document.getElementById('longitude');
                                if (latField && !latField.value) latField.value = pos.coords.latitude;
                                if (lngField && !lngField.value) lngField.value = pos.coords.longitude;
                            }, (err) => {
                                console.warn('Geo error during capture:', err && (err.message || err.name));
                                if (err && err.code === err.TIMEOUT && fallback) {
                                    // retry with lower accuracy and longer timeout
                                    tryGeo({ enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }, false);
                                    return;
                                }
                                setLocationText('Location unavailable');
                            }, opts);
                        };

                        tryGeo({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, true);
                    }

                // Request camera with specific constraints
                const constraints = {
                    video: {
                        facingMode: _currentFacingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                };

                _cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                // Set video stream and wait for it to load
                video.srcObject = _cameraStream;
                
                // Wait for video to be ready
                await new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        video.play().catch(e => console.warn('Video play warning:', e));
                        if (loading) loading.style.display = 'none';
                        resolve();
                    };
                    // Timeout in case onloadedmetadata doesn't fire
                    setTimeout(() => {
                        if (loading) loading.style.display = 'none';
                        resolve();
                    }, 3000);
                });
            } catch (err) {
                console.error('Camera open failed', err);
                if (loading) loading.style.display = 'none';
                if (errorDiv) {
                    let msg = 'Cannot access camera.';
                    if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access.';
                    else if (err.name === 'NotFoundError') msg = 'No camera found on this device.';
                    else if (err.name === 'NotReadableError') msg = 'Camera is already in use.';
                    errorDiv.innerText = msg;
                    errorDiv.style.display = 'block';
                }
            }
        }

        async function toggleCamera() {
            _currentFacingMode = _currentFacingMode === 'user' ? 'environment' : 'user';
            await initCamera();
        }

        function closeCamera() {
            const modal = document.getElementById('cameraModal');
            const video = document.getElementById('cameraVideo');
            const loading = document.getElementById('cameraLoading');
            const errorDiv = document.getElementById('cameraError');
            const addModal = document.getElementById('addModal');

            // Stop all video tracks
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(t => {
                    console.log('Stopping track:', t.kind);
                    t.stop();
                });
                video.srcObject = null;
            }

            // Hide camera and clear states
            if (modal) {
                modal.classList.add('hidden');
            }
            if (loading) loading.style.display = 'none';
            if (errorDiv) errorDiv.style.display = 'none';
            if (document.getElementById('cameraLocation')) document.getElementById('cameraLocation').style.display = 'none';
            if (document.getElementById('previewLocation')) document.getElementById('previewLocation').style.display = 'none';

            // Restore visit form modal automatically
            if (addModal && _cameraPreviousModalState && _cameraPreviousModalState.hadFlex && !_cameraPreviousModalState.wasHidden) {
                addModal.classList.remove('hidden');
                addModal.classList.add('flex');
            }
            document.body.style.overflow = '';

            _cameraStream = null;
            _cameraTargetField = null;
            _cameraPreviousModalState = null;
        }

        function capturePhoto() {
            const video = document.getElementById('cameraVideo');
            const canvas = document.getElementById('cameraCanvas');
            if (!video || !canvas) return alert('Camera elements not found');
            
            // Check if video is playing
            if (video.paused || video.ended || !video.srcObject) {
                alert('Camera stream not ready. Please wait and try again.');
                return;
            }

            try {
                canvas.width = video.videoWidth || 1280;
                canvas.height = video.videoHeight || 720;
                
                if (canvas.width === 0 || canvas.height === 0) {
                    alert('Camera not fully loaded. Please wait a moment and try again.');
                    return;
                }

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL('image/jpeg', 0.85);
                
                // Store the captured photo for preview
                _currentCapturedPhoto = dataURL;
                
                // Close video stream but keep modal open for preview
                if (video && video.srcObject) {
                    const tracks = video.srcObject.getTracks();
                    tracks.forEach(t => t.stop());
                    video.srcObject = null;
                }
                
                // Show preview view and hide capture view
                document.getElementById('cameraCaptureView').classList.add('hidden');
                document.getElementById('cameraPreviewView').classList.remove('hidden');
                
                // Display captured image in preview
                const previewImg = document.getElementById('capturedPreviewImage');
                if (previewImg) previewImg.src = dataURL;
                
                // Copy location from capture view if available
                const captureLocDiv = document.getElementById('cameraLocation');
                const previewLocDiv = document.getElementById('previewLocation');
                const previewLocText = document.getElementById('previewLocationText');
                if (captureLocDiv && captureLocDiv.style.display !== 'none' && previewLocText) {
                    const locText = document.getElementById('cameraLocationText');
                    if (locText) previewLocText.innerText = locText.innerText;
                    previewLocDiv.style.display = 'block';
                }
            } catch (err) {
                console.error('Capture failed:', err);
                alert('Failed to capture photo. Please try again.');
            }
        }

        function deleteCapture() {
            _currentCapturedPhoto = null;
            // Reset modal to camera view
            document.getElementById('cameraCaptureView').classList.remove('hidden');
            document.getElementById('cameraPreviewView').classList.add('hidden');
            // Restart camera
            initCamera();
        }

        function recapturePhoto() {
            _currentCapturedPhoto = null;
            // Reset modal to camera view
            document.getElementById('cameraCaptureView').classList.remove('hidden');
            document.getElementById('cameraPreviewView').classList.add('hidden');
            // Restart camera
            initCamera();
        }

        function confirmCapture() {
            const dataURL = _currentCapturedPhoto;
            if (!dataURL) return alert('No photo to save');
            
            // Store in captured photos collection
            if (_cameraTargetField === 'photo_extra') {
                capturedPhotos.extra = capturedPhotos.extra || [];
                if (capturedPhotos.extra.length >= 11) { alert('Maximum 11 extra photos'); closeCamera(); return; }
                capturedPhotos.extra.push(dataURL);
                updatePreviewExtra();
            } else {
                // For mandatory fields, allow up to 5 captures
                if (!capturedPhotos[_cameraTargetField]) capturedPhotos[_cameraTargetField] = [];
                if (capturedPhotos[_cameraTargetField].length >= 5) { alert('Maximum 5 captures per field'); closeCamera(); return; }
                capturedPhotos[_cameraTargetField].push(dataURL);
                updateCarousel(_cameraTargetField);
                updatePreviewFromSelection(_cameraTargetField);
            }
            updateFileCountUI();
            closeCamera();
        }

        function updateCarousel(fieldId) {
            const captures = capturedPhotos[fieldId] || [];
            const carousel = document.getElementById(`carousel_${fieldId}`);
            const counter = document.getElementById(`count_${fieldId}`);
            if (!carousel) return;
            carousel.innerHTML = '';
            captures.forEach((dataURL, idx) => {
                const thumb = document.createElement('img');
                thumb.src = dataURL;
                thumb.className = 'w-10 h-10 rounded border-2 border-gray-200 cursor-pointer hover:border-purple-500 flex-shrink-0';
                thumb.onclick = () => selectCapture(fieldId, idx);
                carousel.appendChild(thumb);
            });
            if (counter) counter.innerText = `${captures.length}/5 captures`;
        }

        function selectCapture(fieldId, idx) {
            const captures = capturedPhotos[fieldId] || [];
            if (idx >= 0 && idx < captures.length) {
                capturedPhotos[`${fieldId}_selected`] = idx;
                updatePreviewFromSelection(fieldId);
            }
        }

        function updatePreviewFromSelection(fieldId) {
            const captures = capturedPhotos[fieldId] || [];
            const selectedIdx = capturedPhotos[`${fieldId}_selected`] || 0;
            const preview = document.getElementById(`preview_${fieldId}`);
            const hidden = document.getElementById(`captured_${fieldId}`);
            if (captures.length > 0) {
                const selected = captures[selectedIdx];
                if (preview) preview.innerHTML = `<img src="${selected}" class="w-full h-full object-cover rounded">`;
                if (hidden) hidden.value = selected;
                // highlight selected thumb
                const carousel = document.getElementById(`carousel_${fieldId}`);
                if (carousel) {
                    carousel.querySelectorAll('img').forEach((t, i) => {
                        t.classList.toggle('border-purple-500', i === selectedIdx);
                        t.classList.toggle('border-gray-200', i !== selectedIdx);
                    });
                }
            }
        }

        function updatePreviewExtra() {
            const container = document.getElementById('preview_photo_extra');
            container.innerHTML = '';
            (capturedPhotos.extra || []).forEach((d, i) => {
                const el = document.createElement('div');
                el.className = 'w-20 h-14 bg-gray-100 rounded overflow-hidden border border-gray-200';
                el.innerHTML = `<img src="${d}" class="w-full h-full object-cover">`;
                container.appendChild(el);
            });
            const hidden = document.getElementById('captured_photo_extra');
            if (hidden) hidden.value = JSON.stringify(capturedPhotos.extra || []);
        }

        function updateFileCountUI() {
            const requiredKeys = ['photo_building','photo_room','photo_bathroom','photo_bed'];
            let newCount = 0;
            requiredKeys.forEach(k => { 
                if (capturedPhotos[k] && capturedPhotos[k].length > 0) newCount++; 
            });
            const extras = (capturedPhotos.extra || []).length;
            // include existing photos when editing
            const editingId = document.getElementById('editingId') ? document.getElementById('editingId').value : '';
            let existing = 0;
            if (editingId && originalPhotosMap[editingId]) existing = (originalPhotosMap[editingId] || []).length;
            document.getElementById('fileCount').innerText = `${newCount} mandatory (with captures) + ${extras} extra + ${existing} existing = ${newCount + extras + existing} total`;
        }

        function deleteVisit(id) {
            // ðŸ” Search both localStorage and sessionStorage
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            let idx = visits.findIndex(v=>v._id===id);
            let useSession = false;
            if (idx === -1 && sessionVisits.length > 0) {
                idx = sessionVisits.findIndex(v=>v._id===id);
                if (idx !== -1) { visits = sessionVisits; useSession = true; }
            }
            if (idx === -1) return alert('Visit not found');
            if (visits[idx].status === 'approved') return alert('Cannot delete an approved visit.');
            if (!confirm('Delete report?')) return;
            visits.splice(idx,1);
            if (window.safeStorage && typeof window.safeStorage.setVisits === 'function') {
                window.safeStorage.setVisits(visits);
            } else {
                try { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch(e){ console.error('Failed saving visits:', e); }
            }
            // Also sync to sessionStorage if it was the source
            if (useSession) {
                try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch(e){ console.error('Failed syncing to sessionStorage:', e); }
            }
            loadVisits();
        }

        // Edit visit
        function editVisit(id) {
            // ðŸ” Search both localStorage and sessionStorage
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            let v = visits.find(x => x._id === id);
            if (!v && sessionVisits.length > 0) v = sessionVisits.find(x => x._id === id);
            if (!v) return alert('Visit not found');
            const setValueIfExists = (fieldId, value) => {
                const field = document.getElementById(fieldId);
                if (field) field.value = value;
            };

            setValueIfExists('formMode', 'edit');
            setValueIfExists('editingId', id);
            setValueIfExists('visitId', v._id || '');
            setValueIfExists('visitDateDisplay', v.submittedAt ? new Date(v.submittedAt).toLocaleString() : '');
            setValueIfExists('staffName', v.submittedBy || document.getElementById('staffName')?.value || '');
            setValueIfExists('staffId', v.submittedById || document.getElementById('staffId')?.value || '');
            const prop = v.propertyInfo || {};
            setValueIfExists('propertyId', prop.propertyId || prop.id || v.propertyId || '');
            setValueIfExists('propertyType', prop.propertyType || v.propertyType || '');
            setValueIfExists('propertyName', prop.name || v.propertyName || '');
            setValueIfExists('address', prop.address || v.address || '');
            setValueIfExists('ownerName', prop.ownerName || v.ownerName || '');
            setValueIfExists('contactPhone', prop.contactPhone || v.contactPhone || '');
            setValueIfExists('ownerEmail', prop.ownerEmail || v.ownerEmail || '');
            setValueIfExists('areaLocality', prop.area || v.areaLocality || myArea || '');
            setValueIfExists('landmark', prop.landmark || v.landmark || '');
            setValueIfExists('nearbyLocation', prop.nearbyLocation || v.nearbyLocation || '');
            setValueIfExists('gender', v.gender || '');
            setValueIfExists('cleanlinessRating', v.cleanlinessRating || '');
            setValueIfExists('ownerBehaviourPublic', v.ownerBehaviourPublic || '');
            // amenities
            const amenities = v.amenities || [];
            document.querySelectorAll('#visitForm input[name="amenities"]').forEach(chk => chk.checked = amenities.includes(chk.value));
            // rent & charges
            setValueIfExists('monthlyRent', v.monthlyRent || '');
            setValueIfExists('deposit', v.deposit || '');
            setValueIfExists('electricityCharges', v.electricityCharges || '');
            setValueIfExists('foodCharges', v.foodCharges || '');
            setValueIfExists('maintenanceCharges', v.maintenanceCharges || '');
            setValueIfExists('minStay', v.minStay || '');
            // house rules
            setValueIfExists('entryExit', v.entryExit || '');
            setValueIfExists('visitorsAllowed', v.visitorsAllowed || 'Yes');
            setValueIfExists('cookingAllowed', v.cookingAllowed || 'Yes');
            setValueIfExists('smokingAllowed', v.smokingAllowed || 'No');
            setValueIfExists('petsAllowed', v.petsAllowed || 'No');
            // Restore toggle button states
            if (v.visitorsAllowed) document.querySelectorAll('#visitorsAllowed').forEach(e => e.parentElement.parentElement.querySelectorAll('button').forEach(b => b.innerText === v.visitorsAllowed && setToggle('visitorsAllowed', v.visitorsAllowed, b)));
            if (v.cookingAllowed) document.querySelectorAll('#cookingAllowed').forEach(e => e.parentElement.parentElement.querySelectorAll('button').forEach(b => b.innerText === v.cookingAllowed && setToggle('cookingAllowed', v.cookingAllowed, b)));
            if (v.smokingAllowed) document.querySelectorAll('#smokingAllowed').forEach(e => e.parentElement.parentElement.querySelectorAll('button').forEach(b => b.innerText === v.smokingAllowed && setToggle('smokingAllowed', v.smokingAllowed, b)));
            if (v.petsAllowed) document.querySelectorAll('#petsAllowed').forEach(e => e.parentElement.parentElement.querySelectorAll('button').forEach(b => b.innerText === v.petsAllowed && setToggle('petsAllowed', v.petsAllowed, b)));
            // internal
            setValueIfExists('internalRemarks', v.internalRemarks || '');
            setValueIfExists('cleanlinessNote', v.cleanlinessNote || '');
            setValueIfExists('ownerBehaviour', v.ownerBehaviour || '');
            // Restore star rating
            if (v.cleanlinessRating) {
                const stars = document.querySelectorAll('#cleanlinessStars .star');
                stars.forEach((s, i) => {
                    s.classList.toggle('text-yellow-400', i < v.cleanlinessRating);
                    s.classList.toggle('text-gray-300', i >= v.cleanlinessRating);
                });
                document.getElementById('cleanlinessLabel').innerText = `Rating: ${v.cleanlinessRating}/5 \u2605`;
            }
            // Restore owner behaviour button
            if (v.ownerBehaviourPublic) {
                document.querySelectorAll('button').forEach(b => {
                    if (b.parentElement.id === 'ownerBehaviourPublic' || (b.parentElement.parentElement && b.parentElement.parentElement.querySelector('#ownerBehaviourPublic'))) {
                        if (b.innerText.includes(v.ownerBehaviourPublic)) setOwnerBehaviour(v.ownerBehaviourPublic, b);
                    }
                });
            }
            // store original photos
            originalPhotosMap[id] = v.photos || [];
            document.getElementById('fileCount').innerText = `${(originalPhotosMap[id] || []).length} existing photos`;
            // show modal
            document.getElementById('addModal').classList.remove('hidden');
            document.getElementById('addModal').classList.add('flex');
            // Ensure modal is visible and scroll to top
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden'; // Prevent body scroll when modal is open
            // Reinitialize lucide icons in modal
            setTimeout(() => lucide.createIcons(), 100);
        }

        // Submit handler: create or edit
        document.getElementById('visitForm').addEventListener('submit', async (e) => {
            try {
                e.preventDefault();
                const form = e.target;
                const fd = new FormData(form);
                const mode = document.getElementById('formMode').value || 'create';
                const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');
                const assignedArea = (user && user.area) ? user.area : (user && (user.areaName || user.location) ? (user.areaName || user.location) : 'Unassigned');

                console.log('ðŸ“‹ Form submission started. Mode:', mode, 'User:', user?.name);

                // Ensure geolocation captured (optional now - can submit without GPS)
                const latVal = document.getElementById('latitude').value;
                const lngVal = document.getElementById('longitude').value;
                if (!latVal || !lngVal) {
                    console.warn('âš ï¸ GPS coordinates not available - submitting without location data');
                }

                // Validate mandatory photos from capturedPhotos or original (for edits)
                const editingId = document.getElementById('editingId').value;
                let existingCount = 0;
                if (mode === 'edit' && editingId && originalPhotosMap[editingId]) existingCount = (originalPhotosMap[editingId] || []).length;
                const requiredKeys = ['photo_building','photo_room','photo_bathroom','photo_bed'];
                let newMandatoryCount = 0;
                requiredKeys.forEach(k => { if (capturedPhotos[k] && capturedPhotos[k].length > 0) newMandatoryCount++; });
                console.log('ðŸ“¸ Photo validation. New mandatory:', newMandatoryCount, 'Existing:', existingCount, 'Extra:', (capturedPhotos.extra || []).length);
                if (mode === 'create' && newMandatoryCount < 4) return alert('Please capture all 4 mandatory photos (at least one per field).');
                if (mode === 'edit' && (newMandatoryCount + existingCount) < 4) return alert('Please ensure there are 4 mandatory photos total (capture missing ones or keep existing).');

            // extras collected via capturedPhotos.extra
            const extras = capturedPhotos.extra || [];
            // total count
            const totalCount = newMandatoryCount + extras.length + (mode === 'edit' ? existingCount : 0);
            if (totalCount > 15) return alert('Maximum 15 photos allowed (including existing).');

            // Prepare dataURLs to watermark (new captures only - use selected one per mandatory field)
            const newDataURLs = [];
            requiredKeys.forEach(k => { 
                if (capturedPhotos[k] && capturedPhotos[k].length > 0) {
                    const selectedIdx = capturedPhotos[`${k}_selected`] || 0;
                    newDataURLs.push(capturedPhotos[k][selectedIdx]);
                }
            });
            extras.forEach(d => newDataURLs.push(d));

            // Watermark all new dataURLs
            const areaName = myArea || (user && (user.areaName || user.location || user.area)) || 'Area';
            const visitDate = new Date().toLocaleString();
            const watermarked = [];
            for (const d of newDataURLs) {
                const data = await watermarkDataURL(d, areaName, visitDate);
                watermarked.push(data);
            }

            // Compose visit object
            const submittedLocCode = fd.get('locationCode') || fd.get('locationCode');
            if (mode === 'create') {
                const newVisit = {
                                        address: fd.get('address') || '',
                                        gender: fd.get('gender') || '',
                    _id: fd.get('visitId') || ('v_' + Date.now()),
                    submittedAt: new Date().toISOString(),
                    submittedBy: user ? (user.name || user.login || 'Unknown') : 'Unknown',
                    submittedById: user ? (user._id || user.id || '') : '',
                    submittedByLoginId: user ? (user.loginId || user.login || '') : '',
                    staffName: user ? (user.name || user.login || 'Unknown') : 'Unknown',
                    staffId: user ? (user._id || user.id || user.loginId || user.login || '') : '',
                    ownerLoginId: user ? (user.loginId || user.login || user._id || '') : '',  // ✅ ADD OWNER LOGIN ID
                    propertyArea: assignedArea,
                    verifiedByCompany: true,
                    latitude: fd.get('latitude') || document.getElementById('latitude').value || '',
                    longitude: fd.get('longitude') || document.getElementById('longitude').value || '',
                    propertyInfo: {
                        propertyId: fd.get('propertyId'),
                        propertyType: fd.get('propertyType'),
                        name: fd.get('name'),
                        ownerName: fd.get('ownerName'),
                        contactPhone: fd.get('contactPhone'),
                        ownerEmail: fd.get('ownerEmail'),
                        area: assignedArea,
                        landmark: fd.get('landmark'),
                        locationCode: submittedLocCode || '',
                        nearbyLocation: fd.get('nearbyLocation') || ''
                    },
                    ownerEmail: fd.get('ownerEmail'),
                    nearbyLocation: fd.get('nearbyLocation') || '',
                    cleanlinessRating: fd.get('cleanlinessRating'),
                    ownerBehaviourPublic: fd.get('ownerBehaviourPublic'),
                    studentReviewsRating: fd.get('studentReviewsRating'),
                    studentReviews: fd.get('studentReviews'),
                    employeeRating: fd.get('employeeRating'),
                    gender: fd.get('gender'),
                    furnishing: fd.get('furnishing'),
                    ventilation: fd.get('ventilation'),
                    amenities: fd.getAll ? fd.getAll('amenities') : Array.from(form.querySelectorAll('input[name="amenities"]:checked')).map(i=>i.value),
                    monthlyRent: fd.get('monthlyRent'),
                    deposit: fd.get('deposit'),
                    electricityCharges: fd.get('electricityCharges'),
                    foodCharges: fd.get('foodCharges'),
                    maintenanceCharges: fd.get('maintenanceCharges'),
                    minStay: fd.get('minStay'),
                    entryExit: fd.get('entryExit'),
                    visitorsAllowed: fd.get('visitorsAllowed'),
                    cookingAllowed: fd.get('cookingAllowed'),
                    smokingAllowed: fd.get('smokingAllowed'),
                    petsAllowed: fd.get('petsAllowed'),
                    internalRemarks: fd.get('internalRemarks'),
                    cleanlinessNote: fd.get('cleanlinessNote'),
                    ownerBehaviour: fd.get('ownerBehaviour'),
                    photos: (function(){
                            // combine watermarked new photos + any existing originals (shouldn't be for create)
                            return watermarked.slice();
                        })(),
                    professionalPhotos: (createProfessionalPhotos && createProfessionalPhotos.length>0) ? createProfessionalPhotos.slice() : (Array.isArray(staffPhotoDataURLs) && staffPhotoDataURLs.length>0 ? staffPhotoDataURLs.slice() : []),
                    status: 'submitted'
                };
                const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                visits.push(newVisit);
                console.log('ðŸ“ New visit created:', newVisit._id, 'Total visits:', visits.length);
                console.log('ðŸ” Visit data:', newVisit);
                
                // Try to save with cleanup on failure
                let saveSuccess = false;
                if (window.safeStorage && typeof window.safeStorage.setVisits === 'function') {
                    try {
                        window.safeStorage.setVisits(visits);
                        console.log('✅ Visit saved via safeStorage');
                        saveSuccess = true;
                    } catch (e) {
                        if (e.name === 'QuotaExceededError') {
                            console.warn('âš ï¸ Storage quota exceeded. Attempting cleanup...');
                            // Remove old photos to make space
                            const cleaned = visits.map((v, idx) => {
                                if (idx < visits.length - 5) {
                                    return {...v, photos: [], professionalPhotos: []};
                                }
                                return v;
                            });
                            try {
                                window.safeStorage.setVisits(cleaned);
                                localStorage.setItem('roomhy_visits', JSON.stringify(cleaned));
                                console.log('✅ Visit saved after cleanup');
                                saveSuccess = true;
                            } catch (e2) {
                                console.error('âŒ Still failed after cleanup:', e2.message);
                                alert('âŒ Storage quota full. Contact admin to clear old data.');
                            }
                        } else {
                            console.error('âŒ safeStorage error:', e.message);
                        }
                    }
                } else {
                    try { 
                        localStorage.setItem('roomhy_visits', JSON.stringify(visits));
                        console.log('✅ Visit saved to localStorage');
                        // Verify it was saved
                        const check = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                        console.log('ðŸ” localStorage verification - visits count:', check.length);
                        saveSuccess = true;
                    } catch(e) { 
                        if (e.name === 'QuotaExceededError') {
                            console.error('âš ï¸ QuotaExceededError:', e.message);
                            console.warn('Attempting cleanup and retry...');
                            try {
                                const cleaned = visits.map((v, idx) => {
                                    if (idx < visits.length - 5) {
                                        return {...v, photos: [], professionalPhotos: []};
                                    }
                                    return v;
                                });
                                localStorage.setItem('roomhy_visits', JSON.stringify(cleaned));
                                console.log('✅ Visit saved after cleanup');
                                saveSuccess = true;
                            } catch (e2) {
                                console.error('âŒ Still failed after cleanup:', e2.message);
                                alert('âŒ Storage quota full. Please contact admin to clear old data.');
                            }
                        } else {
                            console.error('âŒ Failed saving visits:', e.message);
                            alert('âŒ Failed to save visit: ' + e.message);
                        }
                    }
                }
                
                if (!saveSuccess) {
                    console.warn('⚠️ Visit may not have been saved locally. Continuing with backend sync...');
                }
                // Also save to backend database (even if local storage failed)
                console.log('?? Attempting to save visit to backend...');
                try {
                    let token = '';
                    try {
                        token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
                    } catch (tokenErr) {
                        console.warn('?? Could not read token from storage:', tokenErr.message);
                    }
                    const backendRes = await fetch(API_URL + '/api/visits', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': token } : {})
                        },
                        body: JSON.stringify(mode === 'create' ? newVisit : visits[idx])
                    });
                    if (backendRes.ok) {
                        console.log('? Visit saved to backend database');
                    } else {
                        console.warn('?? Backend save failed:', backendRes.status);
                    }
                } catch (err) {
                    console.warn('?? Could not save to backend:', err.message);
                }
                // Rooms are now added only by property owners in their dashboard
            } else {
                // edit
                const editId = document.getElementById('editingId').value;
                let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
                let idx = visits.findIndex(v=>v._id===editId);
                let useSession = false;
                if (idx === -1 && sessionVisits.length > 0) {
                    idx = sessionVisits.findIndex(v=>v._id===editId);
                    if (idx !== -1) { visits = sessionVisits; useSession = true; }
                }
                if (idx === -1) return alert('Visit not found');
                const v = visits[idx];
                // update allowed fields
                v.propertyInfo = v.propertyInfo || {};
                v.propertyInfo.propertyId = fd.get('propertyId');
                v.propertyInfo.propertyType = fd.get('propertyType');
                v.propertyInfo.name = fd.get('name');
                v.propertyInfo.ownerName = fd.get('ownerName');
                v.propertyInfo.contactPhone = fd.get('contactPhone');
                v.propertyInfo.ownerEmail = fd.get('ownerEmail');
                v.propertyInfo.area = assignedArea;
                v.propertyInfo.landmark = fd.get('landmark');
                v.ownerEmail = fd.get('ownerEmail');
                v.latitude = fd.get('latitude') || document.getElementById('latitude').value || v.latitude;
                v.longitude = fd.get('longitude') || document.getElementById('longitude').value || v.longitude;
                v.cleanlinessRating = fd.get('cleanlinessRating');
                v.ownerBehaviourPublic = fd.get('ownerBehaviourPublic');
                v.studentReviewsRating = fd.get('studentReviewsRating');
                v.studentReviews = fd.get('studentReviews');
                v.employeeRating = fd.get('employeeRating');
                v.gender = fd.get('gender');
                v.furnishing = fd.get('furnishing');
                v.ventilation = fd.get('ventilation');
                v.amenities = fd.getAll ? fd.getAll('amenities') : Array.from(form.querySelectorAll('input[name="amenities"]:checked')).map(i=>i.value);
                v.monthlyRent = fd.get('monthlyRent');
                v.deposit = fd.get('deposit');
                v.electricityCharges = fd.get('electricityCharges');
                v.foodCharges = fd.get('foodCharges');
                v.maintenanceCharges = fd.get('maintenanceCharges');
                v.minStay = fd.get('minStay');
                v.entryExit = fd.get('entryExit');
                v.visitorsAllowed = fd.get('visitorsAllowed');
                v.cookingAllowed = fd.get('cookingAllowed');
                v.smokingAllowed = fd.get('smokingAllowed');
                v.petsAllowed = fd.get('petsAllowed');
                v.internalRemarks = fd.get('internalRemarks');
                v.cleanlinessNote = fd.get('cleanlinessNote');
                v.ownerBehaviour = fd.get('ownerBehaviour');
                // if new photos provided, append to existing watermarked array
                v.photos = (v.photos || []).concat(watermarked);
                // do not change status here; Super Admin only
                visits[idx] = v;
                if (window.safeStorage && typeof window.safeStorage.setVisits === 'function') {
                    window.safeStorage.setVisits(visits);
                } else {
                    try { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch(e) { console.error('Failed saving visits:', e); }
                }
                // Also sync to sessionStorage in case data was loaded from there
                try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch(e){ console.error('Failed syncing to sessionStorage:', e); }
            }

            // close and reset
            closeModal();
            form.reset();
            capturedPhotos.extra = [];
            requiredKeys.forEach(k => { capturedPhotos[k] = null; });
            document.getElementById('fileCount').innerText = '0 selected';
            
            // Show success message
            alert('✅ Visit report submitted successfully!');
            
            // Verify data in storage before reloading table
            const verification = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            console.log('ðŸ” Before loadVisits - storage count:', verification.length);
            console.log('ðŸ“‹ Last visit saved:', verification[verification.length - 1]);
            
            // Reload visits table
            loadVisits();
            console.log('✅ Visit submitted and table reloaded');
            } catch (error) {
                console.error('âŒ Form submission error:', error);
                console.error('Error stack:', error.stack);
                alert('âŒ Error submitting form: ' + error.message + '\n\nPlease check browser console for details.');
            }
        });

        // Staff professional photo handlers
        function openStaffPhotoModal(visitId) {
            editingStaffPhotoId = visitId;
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const v = visits.find(x => x._id === visitId);
            const preview = document.getElementById('staffPhotoPreview');
            const placeholder = document.getElementById('staffPhotoPlaceholder');
            const input = document.getElementById('staffPhotoInput');
            staffPhotoDataURL = null;
            staffPhotoDataURLs = [];
            // If opening for existing visit, load its photos. If visitId === 'NEW', leave empty for creating.
            if (visitId !== 'NEW' && v && Array.isArray(v.professionalPhotos) && v.professionalPhotos.length > 0) {
                staffPhotoDataURLs = v.professionalPhotos.slice();
            }
            updateStaffPhotoPreview();
            if (input) input.value = '';
            document.getElementById('staffPhotoModal').classList.remove('hidden');
            document.getElementById('staffPhotoModal').classList.add('flex');
        }

        function handleStaffPhotoInput(el) {
            const files = Array.from(el.files || []);
            if (!files || files.length === 0) return;
            const remaining = 10 - staffPhotoDataURLs.length;
            if (remaining <= 0) return alert('Maximum 10 photos allowed');
            const toRead = files.slice(0, remaining);
            let readCount = 0;
            toRead.forEach(file => {
                const reader = new FileReader();
                reader.onload = () => {
                    // Compress the image to reduce size
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const maxW = 800; // Max width
                        const maxH = 600; // Max height
                        let { width, height } = img;
                        if (width > maxW) {
                            height = (height * maxW) / width;
                            width = maxW;
                        }
                        if (height > maxH) {
                            width = (width * maxH) / height;
                            height = maxH;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
                        staffPhotoDataURLs.push(compressed);
                        readCount++;
                        if (readCount === toRead.length) updateStaffPhotoPreview();
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            });
        }

        function updateStaffPhotoPreview() {
            const preview = document.getElementById('staffPhotoPreview');
            const placeholder = document.getElementById('staffPhotoPlaceholder');
            if (!preview) return;
            preview.innerHTML = '';
            if (staffPhotoDataURLs.length === 0) {
                preview.innerHTML = `<div class="col-span-4 text-xs text-gray-400">No photos selected</div>`;
                return;
            }
            staffPhotoDataURLs.forEach((d, i) => {
                const div = document.createElement('div');
                div.className = 'w-full h-24 overflow-hidden rounded';
                div.innerHTML = `
                    <div class="relative w-full h-24">
                        <img src="${d}" class="w-full h-full object-cover rounded">
                        <button onclick="removeStaffPhoto(${i})" class="absolute top-1 right-1 bg-white/80 text-red-600 rounded-full p-1 text-xs">✕</button>
                    </div>`;
                preview.appendChild(div);
            });
            // Also update form preview
            updateProfPhotoFormPreview();
        }

        function updateProfPhotoFormPreview() {
            const formPreview = document.getElementById('profPhotoPreviewContainer');
            if (!formPreview) return;
            if (createProfessionalPhotos && createProfessionalPhotos.length > 0) {
                formPreview.innerHTML = `<div class="flex gap-2 flex-wrap w-full">
                    ${createProfessionalPhotos.map((p, i) => `<div class="relative"><img src="${p}" class="w-16 h-16 object-cover rounded border border-blue-300"><span class="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">${i+1}</span></div>`).join('')}
                </div>`;
                // count element may not exist yet; get after setting innerHTML
                const countElAfter = document.getElementById('profPhotoCount');
                if (countElAfter) countElAfter.textContent = `${createProfessionalPhotos.length} professional photo(s) selected`;
            } else {
                formPreview.innerHTML = '<p class="text-xs text-gray-400" id="profPhotoCount">No professional photos selected yet</p>';
            }
        }

        function removeStaffPhoto(index) {
            staffPhotoDataURLs.splice(index, 1);
            updateStaffPhotoPreview();
        }

        function saveStaffPhoto() {
            if (!editingStaffPhotoId) return alert('No visit selected');
            if (!Array.isArray(staffPhotoDataURLs) || staffPhotoDataURLs.length === 0) return alert('Please choose at least one photo');
            // If editing an existing visit, save into that visit. If creating a new visit (editingStaffPhotoId === 'NEW'), store temporarily.
            if (editingStaffPhotoId === 'NEW') {
                createProfessionalPhotos = staffPhotoDataURLs.slice();
                closeStaffPhotoModal();
                updateProfPhotoFormPreview();
                alert('Professional photos saved for this new visit. Click Submit Report to complete.');
                return;
            }
            // ðŸ” Search both localStorage and sessionStorage
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            let idx = visits.findIndex(v => v._id === editingStaffPhotoId);
            let useSession = false;
            if (idx === -1 && sessionVisits.length > 0) {
                idx = sessionVisits.findIndex(v => v._id === editingStaffPhotoId);
                if (idx !== -1) { visits = sessionVisits; useSession = true; }
            }
            if (idx === -1) return alert('Visit not found');
            visits[idx].professionalPhotos = staffPhotoDataURLs.slice();
            if (window.safeStorage && typeof window.safeStorage.setVisits === 'function') {
                window.safeStorage.setVisits(visits);
            } else {
                try { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch(e) { console.error('Failed saving visits:', e); }
            }
            // Also sync to sessionStorage if it was the source
            if (useSession) {
                try { sessionStorage.setItem('roomhy_visits', JSON.stringify(visits)); } catch(e){ console.error('Failed syncing to sessionStorage:', e); }
            }
            closeStaffPhotoModal();
            loadVisits();
            editingStaffPhotoId = null;
            staffPhotoDataURL = null;
            staffPhotoDataURLs = [];
        }

        function closeStaffPhotoModal() {
            const modal = document.getElementById('staffPhotoModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            const input = document.getElementById('staffPhotoInput');
            if (input) input.value = '';
            const preview = document.getElementById('staffPhotoPreview');
            if (preview) preview.innerHTML = `<div class="col-span-4 text-xs text-gray-400">No photos selected</div>`;
            editingStaffPhotoId = null;
            staffPhotoDataURL = null;
            staffPhotoDataURLs = [];
        }

        // Open chat with property owner from visit
        function openOwnerChat(ownerName, ownerContact, visitId) {
            const user = JSON.parse(sessionStorage.getItem('manager_user') || localStorage.getItem('user') || '{}');
            
            // Get all approved owners for area chat
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            let allVisits = [...visits, ...sessionVisits];
            
            // Filter approved visits only
            let approvedOwners = allVisits
                .filter(v => v.status === 'approved' && v.ownerName && v.contactPhone)
                .map(v => ({
                    id: v._id || v.id,
                    name: v.ownerName || v.propertyInfo?.ownerName || 'Owner',
                    phone: v.contactPhone || v.propertyInfo?.contactPhone || '',
                    type: 'owner',
                    visitId: v._id,
                    propertyName: v.propertyName || v.propertyInfo?.name || ''
                }))
                .filter((owner, idx, self) => self.findIndex(o => o.id === owner.id) === idx); // Remove duplicates
            
            // Store for area chat
            sessionStorage.setItem('chatContext', JSON.stringify({
                managerId: user._id || user.id || user.loginId || '',
                managerName: user.name || 'Area Manager',
                approvedOwners: approvedOwners,
                currentChat: {
                    id: ownerName.toLowerCase().replace(/\s+/g, '_'),
                    name: ownerName,
                    phone: ownerContact,
                    type: 'owner',
                    visitId: visitId
                }
            }));
            
            // Store owner contact for chat
            let contacts = JSON.parse(localStorage.getItem('roomhy_chat_contacts') || '[]');
            if (!contacts.find(c => c.name === ownerName && c.phone === ownerContact)) {
                contacts.push({
                    id: ownerName.toLowerCase().replace(/\s+/g, '_'),
                    name: ownerName,
                    phone: ownerContact,
                    type: 'owner',
                    visitId: visitId
                });
                localStorage.setItem('roomhy_chat_contacts', JSON.stringify(contacts));
            }
            
            // Open chat
            window.open('areachat?owner=' + encodeURIComponent(ownerName) + '&visit=' + visitId, 'roomhy_area_chat', 'width=1000,height=700');
        }

