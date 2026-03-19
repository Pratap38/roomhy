lucide.createIcons();

        // Change API_URL to your backend URL
        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';

        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            if (submenu.classList.contains('open')) submenu.classList.remove('open');
            else submenu.classList.add('open');
        }

        let currentWebsiteFilter = 'online';

        function setWebsiteFilter(f) {
            currentWebsiteFilter = f;
            document.getElementById('tabOnline').classList.toggle('bg-purple-600', f === 'online');
            document.getElementById('tabOnline').classList.toggle('text-white', f === 'online');
            document.getElementById('tabOnline').classList.toggle('bg-gray-100', f !== 'online');
            document.getElementById('tabOnline').classList.toggle('text-gray-700', f !== 'online');

            document.getElementById('tabOffline').classList.toggle('bg-purple-600', f === 'offline');
            document.getElementById('tabOffline').classList.toggle('text-white', f === 'offline');
            document.getElementById('tabOffline').classList.toggle('bg-gray-100', f !== 'offline');
            document.getElementById('tabOffline').classList.toggle('text-gray-700', f !== 'offline');

            loadWebsite();
        }

        async function loadWebsite() {
            const tbody = document.getElementById('websiteBody');
            
            try {
                const response = await fetch(`${API_URL}/api/website-property-data/all`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                let visits = (await response.json()).properties || [];
                
                // Filter for approved and online/offline based on current filter
                visits = visits.filter(v => v.status === 'approved' && ((currentWebsiteFilter === 'online' && v.isLiveOnWebsite === true) || (currentWebsiteFilter === 'offline' && v.isLiveOnWebsite === false)));

                if(visits.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="12" class="px-6 py-12 text-center text-gray-400">No live properties found.</td></tr>';
                    updateStats([]);
                    return;
                }

                tbody.innerHTML = visits.map(v => {
                    const prop = v.propertyInfo || {};
                    const profPhotos = v.professionalPhotos || [];
                    const fieldPhotos = v.photos || [];
                    const allPhotos = [...profPhotos, ...fieldPhotos];

                    return `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-4 py-3 font-mono text-xs text-gray-600">${v.propertyId ? v.propertyId.slice(-8).toUpperCase() : '-'}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : '-'}</td>
                        <td class="px-4 py-3 font-semibold text-gray-800">${prop.name || '-'}</td>
                        <td class="px-4 py-3">${prop.propertyType || '-'}</td>
                        <td class="px-4 py-3">${prop.area || '-'}</td>
                        <td class="px-4 py-3">${v.gender || '-'}</td>
                        <td class="px-4 py-3">${prop.ownerName || '-'}</td>
                        <td class="px-4 py-3 text-sm">${prop.contactPhone || '-'}</td>
                        <td class="px-4 py-3 font-bold">₹${v.monthlyRent || 0}</td>
                        <td class="px-4 py-3">
                            <span class="text-[10px] font-bold ${profPhotos.length ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'} px-2 py-1 rounded">
                                ${profPhotos.length ? 'Yes (' + profPhotos.length + ')' : 'Pending'}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <button onclick="toggleWebStatus('${v.propertyId}')" class="px-3 py-1 rounded text-xs font-medium transition-all ${v.isLiveOnWebsite ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                                ${v.isLiveOnWebsite ? '● ONLINE' : '● OFFLINE'}
                            </button>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <div class="flex items-center justify-center gap-2">
                                ${allPhotos.length > 0 ? `<button onclick='viewGallery(${JSON.stringify(allPhotos)})' class="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition" title="View Photos"><i data-lucide="images" class="w-4 h-4"></i></button>` : ''}
                                <button onclick="deleteProperty('${v.propertyId}')" class="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition" title="Delete Property"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </td>
                    </tr>`;
                }).join('');
                lucide.createIcons();
                updateStats(visits);
                updateTabCounts();
            } catch (error) {
                console.error('Error loading website properties:', error);
                tbody.innerHTML = '<tr><td colspan="12" class="px-6 py-12 text-center text-red-500">Error loading properties. Please check the server connection.</td></tr>';
            }
        }

        function updateStats(visits) {
            document.getElementById('totalCount').innerText = visits.length;
            const withProf = visits.filter(v => v.professionalPhotos && v.professionalPhotos.length > 0).length;
            document.getElementById('profCount').innerText = withProf;
            document.getElementById('noProfCount').innerText = visits.length - withProf;
        }

        async function updateTabCounts() {
            try {
                const response = await fetch(`${API_URL}/api/website-property-data/all`);
                if (!response.ok) return;
                
                let visitsAll = (await response.json()).properties || [];
                visitsAll = visitsAll.filter(v => v.status === 'approved');
                const online = visitsAll.filter(v => v.isLiveOnWebsite === true).length;
                const offline = visitsAll.filter(v => !v.isLiveOnWebsite).length;
                const onlineBtn = document.getElementById('tabOnline');
                const offlineBtn = document.getElementById('tabOffline');
                if (onlineBtn) onlineBtn.innerText = `Online (${online})`;
                if (offlineBtn) offlineBtn.innerText = `Offline (${offline})`;
            } catch (error) {
                console.error('Error updating tab counts:', error);
            }
        }

        // === WEBSITE PHOTO FUNCTIONS ===
        async function handleWebsitePhotoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            try {
                // Show loading
                const preview = document.getElementById('websitePhotoPreview');
                document.getElementById('websitePhotoImg').src = '';
                preview.classList.remove('hidden');
                
                // Upload to Cloudinary
                const cloudinaryUrl = await uploadToCloudinary(file, 'website');
                
                // Save to database
                await fetch(`${API_URL}/api/website-property-data/banner/photo`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ websiteBannerPhoto: cloudinaryUrl })
                });
                
                // Show preview
                displayWebsitePhotoPreview(cloudinaryUrl);
                alert('Website banner photo uploaded successfully!');
            } catch (err) {
                alert('Error uploading photo: ' + err.message);
                console.error('Error uploading website photo:', err);
            }
        }

        function displayWebsitePhotoPreview(imageUrl) {
            const preview = document.getElementById('websitePhotoPreview');
            const img = document.getElementById('websitePhotoImg');
            img.src = imageUrl;
            preview.classList.remove('hidden');
            console.log('Website photo uploaded and saved to database');
        }

        async function removeWebsitePhoto() {
            try {
                document.getElementById('websitePhotoPreview').classList.add('hidden');
                document.getElementById('websitePhotoInput').value = '';
            } catch (error) {
                console.error('Error removing photo:', error);
            }
        }

        // Load existing website photo on page load
        async function loadWebsitePhoto() {
            try {
                const response = await fetch(`${API_URL}/api/website-property-data/banner/photo`);
                if (!response.ok) return;
                
                const data = await response.json();
                if (data.photo) {
                    displayWebsitePhotoPreview(data.photo);
                }
            } catch (error) {
                console.error('Error loading website photo:', error);
            }
        }

        function viewGallery(photos) {
            const grid = document.getElementById('galleryGrid');
            grid.innerHTML = (photos && photos.length) ? photos.map(src => `<img src="${src}" class="w-full h-48 object-cover rounded-xl shadow-lg border border-gray-200">`).join('') : '<p class="text-white text-center py-20">No images available.</p>';
            document.getElementById('imageModal').classList.remove('hidden');
            document.getElementById('imageModal').classList.add('flex');
        }

        function closeImageModal() { 
            document.getElementById('imageModal').classList.add('hidden'); 
        }

        async function toggleWebStatus(propertyId) {
            try {
                const response = await fetch(`${API_URL}/api/website-property-data/${propertyId}/toggle-live`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) throw new Error('Failed to toggle status');
                
                const data = await response.json();
                alert(data.message);
                loadWebsite();
            } catch (error) {
                console.error('Error toggling web status:', error);
                alert('Error toggling property status');
            }
        }

        async function deleteProperty(propertyId) {
            if(!confirm("Are you sure you want to delete this property permanently? This action cannot be undone.")) return;
            
            try {
                const response = await fetch(`${API_URL}/api/website-property-data/${propertyId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete property');
                
                loadWebsite();
                alert('Property has been deleted.');
            } catch (error) {
                console.error('Error deleting property:', error);
                alert('Error deleting property');
            }
        }

        async function exportToExcel() {
            try {
                const response = await fetch(`${API_URL}/api/website-property-data/all`);
                if (!response.ok) throw new Error('Failed to fetch data');
                
                let visits = (await response.json()).properties || [];
                visits = visits.filter(v => v.status === 'approved' && ((currentWebsiteFilter === 'online' && v.isLiveOnWebsite === true) || (currentWebsiteFilter === 'offline' && v.isLiveOnWebsite === false)));
                
                if(!visits.length) return alert('No data to export');
                
                let csv = 'Property ID,Date,Property Name,Type,Area,Owner,Contact,Rent,Prof Photos,Status\n';
                visits.forEach(v => {
                    const prop = v.propertyInfo || {};
                    const profPhotos = (v.professionalPhotos || []).length;
                    csv += `"${v.propertyId}","${v.submittedAt}","${prop.name}","${prop.propertyType}","${prop.area}","${prop.ownerName}","${prop.contactPhone}","${v.monthlyRent}","${profPhotos}","${v.isLiveOnWebsite ? 'ONLINE' : 'OFFLINE'}"\n`;
                });
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'website-properties.csv';
                a.click();
            } catch (error) {
                console.error('Error exporting to Excel:', error);
                alert('Error exporting data');
            }
        }

        document.addEventListener('DOMContentLoaded', function(){ 
            setWebsiteFilter('online');
            loadWebsitePhoto();
        });

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