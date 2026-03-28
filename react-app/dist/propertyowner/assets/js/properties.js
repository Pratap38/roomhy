lucide.createIcons();
        
        // === API Configuration ===
        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';

        // --- Auth Guard ---
        const user = JSON.parse(sessionStorage.getItem('owner_session') || sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
        if (!user || (!user.role || (user.role !== 'owner' && user.role !== 'property_owner'))) {
            // Only redirect if no user or completely invalid role
            if (!user) {
                window.location.href = '/propertyowner/ownerlogin';
            }
        }
        
        const ownerId = (user.ownerId || user.loginId || '').toUpperCase();
        let allProperties = [];

        // --- Header Population & Data Load ---
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

            // Load properties (backend first)
            loadProperties();
            
            // Setup bidding form handler (if section enabled in future)
            const biddingForm = document.getElementById('biddingFilterForm');
            if (biddingForm) biddingForm.addEventListener('submit', handleBiddingFormSubmit);
            
            // Setup property search
            document.getElementById('searchProperties').addEventListener('input', filterProperties);
        });

        // Load and display properties (MongoDB backend + local fallback)
        async function loadProperties() {
            let backendProperties = [];
            try {
                const res = await fetch(`${API_URL}/api/owners/${encodeURIComponent(ownerId)}/properties`);
                if (res.ok) {
                    const data = await res.json();
                    backendProperties = Array.isArray(data?.properties) ? data.properties : [];
                }
            } catch (e) {
                console.warn('Failed to fetch backend owner properties:', e);
            }

            // Fallback/merge from local cache for older data
            const localProperties = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
            const localOwnerProperties = localProperties.filter(p =>
                String(p.ownerId || p.ownerLoginId || '').toUpperCase() === ownerId
            );

            // owner.html-compatible source: visits (backend)
            let visitProperties = [];
            try {
                const vres = await fetch(`${API_URL}/api/visits`);
                if (vres.ok) {
                    const vdata = await vres.json();
                    const visits = Array.isArray(vdata?.visits) ? vdata.visits : [];
                    visitProperties = visits
                        .filter(v => String(v?.generatedCredentials?.loginId || '').toUpperCase() === ownerId)
                        .map(v => {
                            const p = v.propertyInfo || {};
                            return {
                                _id: p._id || v.propertyId || '',
                                title: p.name || v.propertyName || p.title || 'Untitled',
                                name: p.name || v.propertyName || p.title || 'Untitled',
                                ownerName: p.ownerName || v.ownerName || user.name || 'Owner',
                                city: p.city || v.city || '',
                                area: p.area || v.area || '',
                                address: p.address || v.address || '',
                                description: p.description || '',
                                locationCode: p.locationCode || user.locationCode || user.area || ''
                            };
                        });
                }
            } catch (e) {
                console.warn('Failed to fetch properties from visits API:', e);
            }

            // owner.html-compatible source: visits (local fallback)
            try {
                const localVisits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                const localVisitProps = localVisits
                    .filter(v => String(v?.generatedCredentials?.loginId || '').toUpperCase() === ownerId)
                    .map(v => {
                        const p = v.propertyInfo || {};
                        return {
                            _id: p._id || v.propertyId || '',
                            title: p.name || v.propertyName || p.title || 'Untitled',
                            name: p.name || v.propertyName || p.title || 'Untitled',
                            ownerName: p.ownerName || v.ownerName || user.name || 'Owner',
                            city: p.city || v.city || '',
                            area: p.area || v.area || '',
                            address: p.address || v.address || '',
                            description: p.description || '',
                            locationCode: p.locationCode || user.locationCode || user.area || ''
                        };
                    });
                visitProperties = [...visitProperties, ...localVisitProps];
            } catch (_) {}

            const merged = [];
            const seen = new Set();
            [...backendProperties, ...localOwnerProperties, ...visitProperties].forEach((p) => {
                const key = String(
                    p._id
                    || p.id
                    || p.propertyId
                    || (String(p.title || p.name || '').toLowerCase() + '::' + String(p.area || p.city || '').toLowerCase() + '::' + ownerId)
                );
                if (!seen.has(key)) {
                    seen.add(key);
                    merged.push(p);
                }
            });

            // If none in backend but owner context has a property name, keep a virtual row
            if (merged.length === 0 && window.__ownerContext?.propertyName) {
                merged.push({
                    _id: '',
                    title: window.__ownerContext.propertyName,
                    name: window.__ownerContext.propertyName,
                    area: window.__ownerContext.area || window.__ownerContext.locationCode || '',
                    city: window.__ownerContext.propertyLocation || '',
                    ownerLoginId: ownerId
                });
            }

            allProperties = merged;
            renderPropertiesTable(merged);
            document.getElementById('propertyCount').textContent = `(Total of ${merged.length} ${merged.length === 1 ? 'property' : 'properties'})`;
        }

        // Render properties table
        function renderPropertiesTable(properties) {
            const tbody = document.getElementById('propertiesTableBody');
            const cards = document.getElementById('propertiesCards');
            
            if (!properties || properties.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-6 text-center text-gray-500">No properties found.</td></tr>`;
                if (cards) cards.innerHTML = `<div class="bg-white rounded-xl shadow p-4 text-sm text-gray-500">No properties found.</div>`;
                return;
            }

            const allRooms = JSON.parse(localStorage.getItem('roomhy_rooms') || '[]');
            if (cards) {
                cards.innerHTML = properties.map(p => {
                    const pid = p._id || p.id || p.propertyId || '';
                    const pTitle = p.title || p.name || p.propertyName || 'Untitled';
                    const roomCount = allRooms.filter(r =>
                        (pid && String(r.propertyId) === String(pid)) ||
                        (!pid && String(r.propertyTitle || '').toLowerCase().includes(String(pTitle).toLowerCase()))
                    ).length;
                    return `
                        <div class="bg-white rounded-xl shadow p-4">
                            <div class="font-semibold text-gray-900">${pTitle}</div>
                            <div class="text-xs text-gray-500 mt-1">${p.area || p.city || p.locationCode || '-'}</div>
                            <div class="text-xs text-gray-600 mt-2">Owner: ${p.ownerName || user.name || 'Owner'}</div>
                            <div class="text-xs text-gray-600">Rooms: ${roomCount}</div>
                            <a href="/propertyowner/rooms?propertyId=${pid}&propertyTitle=${encodeURIComponent(pTitle)}" class="inline-block mt-3 text-xs font-medium text-purple-700 border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-50">Manage Rooms</a>
                        </div>
                    `;
                }).join('');
            }
            tbody.innerHTML = properties.map(p => {
                const pid = p._id || p.id || p.propertyId || '';
                const pTitle = p.title || p.name || p.propertyName || 'Untitled';
                const roomCount = allRooms.filter(r =>
                    (pid && String(r.propertyId) === String(pid)) ||
                    (!pid && String(r.propertyTitle || '').toLowerCase().includes(String(pTitle).toLowerCase()))
                ).length;
                return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <img class="h-10 w-10 rounded-lg object-cover" src="${p.image || 'https://via.placeholder.com/80'}" alt="${pTitle}">
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${pTitle}</div>
                                <div class="text-xs text-gray-500">Rooms: ${roomCount}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-4">${p.ownerName || user.name || 'Owner'}</td>
                    <td class="px-4 py-4">${p.city || p.location || p.locationCode || '-'}</td>
                    <td class="px-4 py-4">${p.area || '-'}</td>
                    <td class="px-4 py-4">${p.size || p.propertySize || '-'}</td>
                    <td class="px-4 py-4 max-w-xs truncate">${p.description || '-'}</td>
                    <td class="px-4 py-4">${p.address || '-'}</td>
                    <td class="px-4 py-4 text-right">
                        <a href="/propertyowner/rooms?propertyId=${pid}&propertyTitle=${encodeURIComponent(pTitle)}" class="text-purple-600 hover:text-purple-800 text-xs font-medium border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-50 transition-colors">
                            Manage Rooms
                        </a>
                    </td>
                </tr>
            `;
            }).join('');
        }

        // Filter properties
        function filterProperties() {
            const searchTerm = document.getElementById('searchProperties').value.toLowerCase();
            const myProperties = allProperties.filter(p => {
                const title = (p.title || p.name || p.propertyName || '').toLowerCase();
                const city = (p.city || p.location || p.locationCode || '').toLowerCase();
                const area = (p.area || '').toLowerCase();
                return title.includes(searchTerm) || city.includes(searchTerm) || area.includes(searchTerm);
            });
            renderPropertiesTable(myProperties);
        }

        // Handle bidding form submission
        async function handleBiddingFormSubmit(e) {
            e.preventDefault();
            
            const formMessage = document.getElementById('formMessage');
            
            try {
                // Validate required fields
                const contactName = document.getElementById('contactName').value.trim();
                const contactPhone = document.getElementById('contactPhone').value.trim();
                const contactEmail = document.getElementById('contactEmail').value.trim();
                
                if (!contactName || !contactPhone || !contactEmail) {
                    showMessage('Please fill in all contact information', 'error', formMessage);
                    return;
                }

                // Collect form data
                const biddingData = {
                    userId: user.loginId || user.ownerId,
                    userName: user.name,
                    propertyType: document.getElementById('propertyType').value,
                    city: document.getElementById('city').value,
                    minRent: parseFloat(document.getElementById('minRent').value) || 0,
                    maxRent: parseFloat(document.getElementById('maxRent').value) || 0,
                    preferredArea: document.getElementById('preferredArea').value,
                    bhk: document.getElementById('bhk').value,
                    moveInDate: document.getElementById('moveInDate').value,
                    leaseDuration: document.getElementById('leaseDuration').value,
                    specialRequirements: document.getElementById('specialRequirements').value,
                    contactName: contactName,
                    contactPhone: contactPhone,
                    contactEmail: contactEmail,
                    submittedAt: new Date().toISOString(),
                    status: 'pending',
                    responses: []
                };

                // Save to MongoDB via API
                const response = await fetch(`${API_URL}/api/bidding-requests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(biddingData)
                });

                if (!response.ok) {
                    throw new Error('Failed to submit bidding request');
                }

                const result = await response.json();
                
                // Save bidding request ID locally
                const biddingRequests = JSON.parse(localStorage.getItem('my_bidding_requests') || '[]');
                biddingRequests.push(biddingData);
                localStorage.setItem('my_bidding_requests', JSON.stringify(biddingRequests));

                showMessage('✅ Bidding request sent successfully to matching properties!', 'success', formMessage);
                document.getElementById('biddingFilterForm').reset();
                
                // Auto-hide message after 3 seconds
                setTimeout(() => {
                    formMessage.classList.add('hidden');
                }, 3000);

            } catch (error) {
                console.error('Error submitting bidding request:', error);
                showMessage('❌ Error submitting request. Please try again.', 'error', formMessage);
            }
        }

        // Show message in form
        function showMessage(message, type, element) {
            element.textContent = message;
            element.classList.remove('hidden');
            element.className = element.className.replace('hidden', '');
            element.className += ` ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
        }
        
        // --- Logout Handler ---
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('owner_session');
            window.location.href = '/propertyowner/ownerlogin';
        });
        
        // Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const closeMobileMenuButton = document.getElementById('close-mobile-menu');

        const openMenu = () => mobileMenu.classList.remove('hidden');
        const closeMenu = () => mobileMenu.classList.add('hidden');

        mobileMenuButton.addEventListener('click', openMenu);
        closeMobileMenuButton.addEventListener('click', closeMenu);
        mobileMenuOverlay.addEventListener('click', closeMenu);

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Profile Dropdown Toggle
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
                 setTimeout(() => {
                    profileDropdown.classList.add('hidden');
                 }, 200); 
            }
        });

        document.addEventListener('click', (event) => {
            if (profileButton && !profileButton.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
                 if(!profileDropdown.classList.contains('hidden')) {
                     profileDropdown.classList.add('scale-95', 'opacity-0');
                     setTimeout(() => {
                        profileDropdown.classList.add('hidden');
                    }, 200);
                 }
            }
        });

        function addNewAccount() {
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            window.location.href = '/propertyowner/index';
        }

        function loadAccounts() {
            const accountsList = document.getElementById('accounts-list');
            const ownerAccounts = JSON.parse(localStorage.getItem('owner_accounts') || '[]');
            const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
            
            if (ownerAccounts.length === 0) {
                accountsList.innerHTML = '<div class="text-xs text-gray-500 text-center py-2">No accounts</div>';
                return;
            }
            
            accountsList.innerHTML = ownerAccounts.map(account => {
                const isActive = currentUser && currentUser.loginId === account.loginId;
                return `
                    <div class="account-item ${isActive ? 'bg-blue-700' : 'bg-gray-700'} rounded-lg p-2 cursor-pointer hover:bg-opacity-80 transition-colors" onclick="switchAccount('${account.loginId}')">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-medium text-white truncate">${account.name || 'Owner'}</div>
                                <div class="text-xs text-gray-300 truncate">${account.loginId}</div>
                            </div>
                            ${isActive ? '<div class="w-2 h-2 bg-green-400 rounded-full ml-2"></div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function switchAccount(loginId) {
            const ownerAccounts = JSON.parse(localStorage.getItem('owner_accounts') || '[]');
            const account = ownerAccounts.find(acc => acc.loginId === loginId);
            
            if (account) {
                localStorage.setItem('user', JSON.stringify(account));
                sessionStorage.setItem('owner_session', JSON.stringify(account));
                window.location.reload();
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadAccounts();
        });