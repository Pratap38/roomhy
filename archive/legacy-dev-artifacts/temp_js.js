        lucide.createIcons();

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

        function loadWebsite() {
            const tbody = document.getElementById('websiteBody');
            
            // ðŸ“Š Load from both localStorage and sessionStorage
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            
            // ðŸ”„ If sessionStorage has more data (localStorage quota exceeded), use that
            if (sessionVisits.length > visits.length) {
                visits = sessionVisits;
            } else if (sessionVisits.length > 0) {
                // Merge both sources to avoid data loss
                const ids = new Set(visits.map(v => v._id));
                visits = [...visits, ...sessionVisits.filter(v => !ids.has(v._id))];
            }
            
            // ðŸ” Filter for approved and online/offline based on current filter
            visits = visits.filter(v => v.status === 'approved' && ((currentWebsiteFilter === 'online' && v.isLiveOnWebsite === true) || (currentWebsiteFilter === 'offline' && v.isLiveOnWebsite === false)));

            if(visits.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" class="px-6 py-12 text-center text-gray-400">No live properties found.</td></tr>';
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
                    <td class="px-4 py-3 font-mono text-xs text-gray-600">${v._id ? v._id.slice(-8).toUpperCase() : '-'}</td>
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
                        <button onclick="toggleWebStatus('${v._id}')" class="px-3 py-1 rounded text-xs font-medium transition-all ${v.isLiveOnWebsite ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                            ${v.isLiveOnWebsite ? 'â— ONLINE' : 'â— OFFLINE'}
                        </button>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            ${allPhotos.length > 0 ? `<button onclick='viewGallery(${JSON.stringify(allPhotos)})' class="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition" title="View Photos"><i data-lucide="images" class="w-4 h-4"></i></button>` : ''}
                            <button onclick="deleteProperty('${v._id}')" class="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition" title="Delete Property"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
            lucide.createIcons();
            updateStats(visits);
            updateTabCounts();
        }

        function updateStats(visits) {
            document.getElementById('totalCount').innerText = visits.length;
            const withProf = visits.filter(v => v.professionalPhotos && v.professionalPhotos.length > 0).length;
            document.getElementById('profCount').innerText = withProf;
            document.getElementById('noProfCount').innerText = visits.length - withProf;
        }

        function updateTabCounts() {
            // ðŸ“Š Load from both sources
            let visitsAll = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            
            // ðŸ”„ Merge if needed
            if (sessionVisits.length > visitsAll.length) {
                visitsAll = sessionVisits;
            } else if (sessionVisits.length > 0) {
                const ids = new Set(visitsAll.map(v => v._id));
                visitsAll = [...visitsAll, ...sessionVisits.filter(v => !ids.has(v._id))];
            }
            
            visitsAll = visitsAll.filter(v => v.status === 'approved');
            const online = visitsAll.filter(v => v.isLiveOnWebsite === true).length;
            const offline = visitsAll.filter(v => !v.isLiveOnWebsite).length;
            const onlineBtn = document.getElementById('tabOnline');
            const offlineBtn = document.getElementById('tabOffline');
            if (onlineBtn) onlineBtn.innerText = `Online (${online})`;
            if (offlineBtn) offlineBtn.innerText = `Offline (${offline})`;
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
                
                // Store the Cloudinary URL in localStorage
                storeImageUrl('roomhy_website_photo', cloudinaryUrl);
                
                // Show preview
                displayWebsitePhotoPreview(cloudinaryUrl);
                alert('Website banner photo uploaded to Cloudinary successfully!');
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
            console.log('Website photo uploaded and saved to Cloudinary');
        }

        function removeWebsitePhoto() {
            localStorage.removeItem('roomhy_website_photo');
            document.getElementById('websitePhotoPreview').classList.add('hidden');
            document.getElementById('websitePhotoInput').value = '';
        }

        // Load existing website photo on page load
        function loadWebsitePhoto() {
            const storedData = localStorage.getItem('roomhy_website_photo');
            if (storedData) {
                try {
                    const data = JSON.parse(storedData);
                    displayWebsitePhotoPreview(data.url);
                } catch (e) {
                    // Fallback for old format (direct URL or data URL)
                    displayWebsitePhotoPreview(storedData);
                }
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

        function toggleWebStatus(id) {
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const idx = visits.findIndex(v => v._id === id);
            if(idx !== -1) {
                visits[idx].isLiveOnWebsite = !visits[idx].isLiveOnWebsite;
                if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
                // reload current tab
                loadWebsite();
                const msg = visits[idx].isLiveOnWebsite ? "Property is now ONLINE." : "Property is now OFFLINE.";
                alert(msg);
            }
        }

        function deleteProperty(id) {
            if(!confirm("Are you sure you want to delete this property permanently? This action cannot be undone.")) return;
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const idx = visits.findIndex(v => v._id === id);
            if(idx !== -1) {
                const prop = visits[idx].propertyInfo || {};
                visits.splice(idx, 1);
                if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
                loadWebsite();
                alert(`Property "${prop.name}" has been deleted.`);
            }
        }

        function takeOffline(id) {
            if(!confirm("Are you sure you want to take this property offline?")) return;
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const idx = visits.findIndex(v => v._id === id);
            if(idx !== -1) {
                visits[idx].isLiveOnWebsite = false;
                if (window.safeStorage) { window.safeStorage.setVisits(visits); } else { localStorage.setItem('roomhy_visits', JSON.stringify(visits)); }
                loadWebsite();
                alert('Property taken offline.');
            }
        }

        function exportToExcel() {
            // ðŸ“Š Load from both sources
            let visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            let sessionVisits = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
            
            // ðŸ”„ Merge if needed
            if (sessionVisits.length > visits.length) {
                visits = sessionVisits;
            } else if (sessionVisits.length > 0) {
                const ids = new Set(visits.map(v => v._id));
                visits = [...visits, ...sessionVisits.filter(v => !ids.has(v._id))];
            }
            
            visits = visits.filter(v => v.status === 'approved' && ((currentWebsiteFilter === 'online' && v.isLiveOnWebsite === true) || (currentWebsiteFilter === 'offline' && v.isLiveOnWebsite === false)));
            
            if(!visits.length) return alert('No data to export');
            
            let csv = 'Visit ID,Date,Property Name,Type,Area,Owner,Contact,Rent,Prof Photos,Status\n';
            visits.forEach(v => {
                const prop = v.propertyInfo || {};
                const profPhotos = (v.professionalPhotos || []).length;
                csv += `"${v._id}","${v.submittedAt}","${prop.name}","${prop.propertyType}","${prop.area}","${prop.ownerName}","${prop.contactPhone}","${v.monthlyRent}","${profPhotos}","ONLINE"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'website-properties.csv';
            a.click();
        }

        document.addEventListener('DOMContentLoaded', function(){ 
            setWebsiteFilter('online');
            loadWebsitePhoto();
        });

        // Mobile menu functionality
        function toggleMobileMenu() {
            const mobileSidebar = document.querySelector('aside');
            const mobileOverlay = document.getElementById('mobile-overlay');
            
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