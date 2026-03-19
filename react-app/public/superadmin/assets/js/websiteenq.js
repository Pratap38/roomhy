lucide.createIcons();

        let allEnquiries = [];
        let filteredEnquiries = [];
        let managers = [];

        // Load enquiries from MongoDB via API
        async function loadEnquiries() {
            try {
                const response = await fetch(API_URL + '/api/website-enquiry/all');
                const result = await response.json();

                if (result.success) {
                    allEnquiries = result.enquiries.map(e => ({
                        id: e.enquiry_id,
                        property_type: e.property_type,
                        property_name: e.property_name,
                        city: e.city,
                        locality: e.locality,
                        address: e.address,
                        pincode: e.pincode,
                        description: e.description,
                        amenities: e.amenities,
                        gender_suitability: e.gender_suitability,
                        rent: e.rent,
                        deposit: e.deposit,
                        owner_name: e.owner_name,
                        owner_email: e.owner_email,
                        owner_phone: e.owner_phone,
                        contact_name: e.contact_name,
                        country: e.country,
                        tenants_managed: e.tenants_managed,
                        additional_message: e.additional_message,
                        status: e.status,
                        assigned_to: e.assigned_to,
                        assigned_to_loginId: e.assigned_to_loginId,
                        assigned_email: e.assigned_email,
                        assigned_area: e.assigned_area,
                        notes: e.notes,
                        created_at: e.created_at
                    }));
                    console.log('Enquiries loaded:', allEnquiries);
                } else {
                    console.error('Failed to fetch enquiries:', result.message);
                    allEnquiries = [];
                }
            } catch (error) {
                console.error('Error loading enquiries:', error);
                // Load default sample data if API fails
                allEnquiries = [
                    {
                        id: 'sample_1',
                        property_type: 'pg',
                        property_name: 'Sample PG in Kota',
                        city: 'kota',
                        locality: 'North Campus',
                        address: '123 Main Street',
                        pincode: '324001',
                        description: 'Sample property for testing',
                        amenities: ['WiFi', 'AC'],
                        gender_suitability: 'male',
                        rent: 5000,
                        deposit: 10000,
                        owner_name: 'John Doe',
                        owner_email: 'john@example.com',
                        owner_phone: '9876543210',
                        status: 'pending',
                        assigned_to: null,
                        assigned_area: null,
                        notes: '',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'sample_2',
                        property_type: 'hostel',
                        property_name: 'Sample Hostel in Indore',
                        city: 'indore',
                        locality: 'City Center',
                        address: '456 Hostel Lane',
                        pincode: '452001',
                        description: 'Another sample property',
                        amenities: ['Food', 'Laundry'],
                        gender_suitability: 'female',
                        rent: 4000,
                        deposit: 8000,
                        owner_name: 'Jane Smith',
                        owner_email: 'jane@example.com',
                        owner_phone: '9876543211',
                        status: 'assigned',
                        assigned_to: 'Rajesh Kumar',
                        assigned_area: 'Indore',
                        notes: 'Assigned for follow-up',
                        created_at: new Date().toISOString()
                    }
                ];
            }

            await loadManagers();
            updateStats();
            filterEnquiries();
        }

        // Load employees from backend (Marketing Team) with cache fallback
        async function loadManagers() {
            managers = [];
            try {
                const response = await fetch(`${API_URL}/api/website-enquiry/employees/marketing`);
                const result = await response.json();
                if (response.ok && result.success) {
                    managers = (result.employees || []).map(e => ({
                        id: e.loginId,
                        loginId: e.loginId,
                        name: e.name,
                        email: e.email || '',
                        phone: e.phone || '',
                        role: e.role || 'Marketing Team',
                        area: e.area || e.locationCode || 'Unassigned',
                        city: e.city || ''
                    }));
                }
            } catch (err) {
                console.warn('Failed to load marketing employees from backend:', err.message);
            }

            if (!managers.length) {
                const cachedEmployees = JSON.parse(localStorage.getItem('roomhy_employees_cache') || '[]');
                managers = cachedEmployees
                    .filter(e => (e.role || '').toLowerCase() === 'marketing team')
                    .map(e => ({
                        id: e.loginId || e.id,
                        loginId: e.loginId || e.id,
                        name: e.name,
                        email: e.email || '',
                        phone: e.phone || '',
                        role: e.role || 'Marketing Team',
                        area: e.area || e.locationCode || 'Unassigned',
                        city: e.city || ''
                    }));
            }

            const select = document.getElementById('manager-select');
            select.innerHTML = '<option value="">Choose Employee...</option>';
            managers.forEach(m => {
                const option = document.createElement('option');
                option.value = m.loginId || m.id;
                option.textContent = `${m.name} | ${m.loginId} | ${m.area || '-'} | ${m.city || '-'}`;
                select.appendChild(option);
            });

            const cityFilter = document.getElementById('city-filter');
            cityFilter.innerHTML = '<option value="">All Cities</option>';
            const cities = [...new Set(allEnquiries.map(e => e.city))];
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city.charAt(0).toUpperCase() + city.slice(1);
                cityFilter.appendChild(option);
            });
        }

        // Update statistics
        function updateStats() {
            const total = allEnquiries.length;
            const pending = allEnquiries.filter(e => e.status === 'pending').length;
            const assigned = allEnquiries.filter(e => e.status === 'assigned').length;
            const cities = new Set(allEnquiries.map(e => e.city)).size;

            document.getElementById('total-enquiries').textContent = total;
            document.getElementById('pending-enquiries').textContent = pending;
            document.getElementById('assigned-enquiries').textContent = assigned;
            document.getElementById('total-cities').textContent = cities;
        }

        // Filter enquiries
        function filterEnquiries() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const cityFilter = document.getElementById('city-filter').value;

            filteredEnquiries = allEnquiries.filter(e => {
                const matchSearch = !searchTerm || 
                    e.property_name.toLowerCase().includes(searchTerm) ||
                    e.owner_name.toLowerCase().includes(searchTerm) ||
                    (e.locality && e.locality.toLowerCase().includes(searchTerm));
                
                const matchStatus = !statusFilter || e.status === statusFilter;
                const matchCity = !cityFilter || e.city === cityFilter;

                return matchSearch && matchStatus && matchCity;
            });

            renderEnquiries();
        }

        // Render enquiries grouped by city
        function renderEnquiries() {
            const container = document.getElementById('enquiries-container');
            
            if (filteredEnquiries.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-8">No enquiries found.</p>';
                return;
            }

            const grouped = {};
            filteredEnquiries.forEach(e => {
                if (!grouped[e.city]) grouped[e.city] = [];
                grouped[e.city].push(e);
            });

            let html = '';
            Object.keys(grouped).sort().forEach(city => {
                html += `
                    <div class="area-section">
                        <div class="area-header">
                            <h2 class="text-lg font-semibold flex items-center gap-2">
                                <i data-lucide="map-pin" class="w-5 h-5"></i>
                                ${city.charAt(0).toUpperCase() + city.slice(1)}
                            </h2>
                            <p class="text-sm opacity-90 mt-1">${grouped[city].length} enquiries</p>
                        </div>
                        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table class="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Owner</th>
                                        <th>Locality</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${grouped[city].map(e => `
                                        <tr>
                                            <td><strong>${e.property_name}</strong></td>
                                            <td>${e.owner_name}</td>
                                            <td>${e.locality || '-'}</td>
                                            <td>
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    ${(e.property_type || 'Other').toUpperCase()}
                                                </span>
                                            </td>
                                            <td><small>${new Date(e.created_at).toLocaleDateString()}</small></td>
                                            <td>
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    e.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }">
                                                    ${e.status === 'pending' ? 'Pending' : 'Assigned to ' + (e.assigned_to || '?')}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="flex gap-2">
                                                    <button onclick="viewDetails('${e.id}')" class="text-blue-600 hover:text-blue-800 p-1" title="View Details">
                                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                                    </button>
                                                    ${e.status === 'pending' ? `
                                                        <button onclick="openAssignmentModal('${e.id}')" class="text-purple-600 hover:text-purple-800 p-1" title="Assign">
                                                            <i data-lucide="user-check" class="w-4 h-4"></i>
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            lucide.createIcons();
        }

        // View details
        function viewDetails(id) {
            const enquiry = allEnquiries.find(e => e.id === id);
            if (!enquiry) return;

            const content = document.getElementById('details-content');
            content.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-600">Property Name</p>
                            <p class="font-semibold">${enquiry.property_name}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Property Type</p>
                            <p class="font-semibold">${enquiry.property_type || 'N/A'}</p>
                        </div>
                    </div>
                    <hr>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-600">Owner Name</p>
                            <p class="font-semibold">${enquiry.owner_name}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Owner Email</p>
                            <p class="font-semibold">${enquiry.owner_email || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Owner Phone</p>
                            <p class="font-semibold">${enquiry.owner_phone}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Contact Name</p>
                            <p class="font-semibold">${enquiry.contact_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Submitted Date</p>
                            <p class="font-semibold">${new Date(enquiry.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <hr>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-600">City</p>
                            <p class="font-semibold">${enquiry.city.toUpperCase()}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Country</p>
                            <p class="font-semibold">${enquiry.country || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Locality</p>
                            <p class="font-semibold">${enquiry.locality || 'N/A'}</p>
                        </div>
                        <div class="col-span-2">
                            <p class="text-xs text-gray-600">Full Address</p>
                            <p class="font-semibold">${enquiry.address}, ${enquiry.pincode}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Gender Suitability</p>
                            <p class="font-semibold capitalize">${enquiry.gender_suitability || 'Any'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Starting Price</p>
                            <p class="font-semibold">?${(enquiry.rent || 0).toLocaleString()}/month</p>
                        </div>
                    </div>
                    <hr>
                    <div>
                        <p class="text-xs text-gray-600">Amenities</p>
                        <div class="flex flex-wrap gap-2 mt-2">
                            ${(enquiry.amenities || []).map(a => `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${a}</span>`).join('')}
                        </div>
                    </div>
                    ${enquiry.description ? `
                        <div>
                            <p class="text-xs text-gray-600">Description</p>
                            <p class="text-sm">${enquiry.description}</p>
                        </div>
                    ` : ''}
                    <div>
                        <p class="text-xs text-gray-600">Tenants Managed</p>
                        <p class="text-sm">${enquiry.tenants_managed || 0}</p>
                    </div>
                    ${enquiry.additional_message ? `
                        <div>
                            <p class="text-xs text-gray-600">Additional Message</p>
                            <p class="text-sm">${enquiry.additional_message}</p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('details-modal').classList.remove('hidden');
        }

        function closeDetailsModal() {
            document.getElementById('details-modal').classList.add('hidden');
        }

        // Assignment functions
        function openAssignmentModal(id) {
            document.getElementById('modal-enquiry-id').value = id;
            document.getElementById('assignment-modal').classList.remove('hidden');
        }

        function closeAssignmentModal() {
            document.getElementById('assignment-modal').classList.add('hidden');
            document.getElementById('modal-enquiry-id').value = '';
            document.getElementById('manager-select').value = '';
        }

        async function confirmAssignment() {
            const enquiryId = document.getElementById('modal-enquiry-id').value;
            const managerId = document.getElementById('manager-select').value;

            if (!managerId) {
                alert('Please select an employee');
                return;
            }

            const enquiry = allEnquiries.find(e => e.id === enquiryId);
            const manager = managers.find(m => String(m.loginId || m.id) === String(managerId));

            if (enquiry && manager) {
                try {
                    const response = await fetch(`${API_URL}/api/website-enquiry/assign/${encodeURIComponent(enquiryId)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'assigned',
                        assigned_to: manager.name,
                        assigned_to_loginId: manager.loginId || manager.id,
                        assigned_area: manager.area
                    })
                });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        closeAssignmentModal();
                        await loadEnquiries();
                        const mailMsg = result.email && result.email.attempted
                            ? (result.email.sent ? ' Employee email notification sent.' : ' Employee assigned, but email notification failed.')
                            : ' Employee has no email configured.';
                        alert(`Assigned to ${manager.name} successfully!${mailMsg}`);
                    } else {
                        alert('Error assigning enquiry: ' + (result.message || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error assigning enquiry:', error);
                    alert('Error assigning enquiry. Please try again.');
                }
            }
        }

        // Event listeners
        document.getElementById('search-input').addEventListener('input', filterEnquiries);
        document.getElementById('status-filter').addEventListener('change', filterEnquiries);
        document.getElementById('city-filter').addEventListener('change', filterEnquiries);

        // Mobile menu functionality
        function toggleMobileMenu() {
            const mobileSidebar = document.querySelector('aside');
            const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
            
            if (mobileSidebar.classList.contains('hidden')) {
                mobileSidebar.classList.remove('hidden');
                mobileSidebar.classList.add('fixed', 'inset-y-0', 'left-0');
                mobileOverlay.classList.remove('hidden');
            } else {
                mobileSidebar.classList.add('hidden');
                mobileSidebar.classList.remove('fixed', 'inset-y-0', 'left-0');
                mobileOverlay.classList.add('hidden');
            }
        }

        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);

        // Initial load
        loadEnquiries();
