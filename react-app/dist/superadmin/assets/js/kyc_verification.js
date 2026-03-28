lucide.createIcons();

        // Sidebar Submenu
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

        // Mobile Menu
        function toggleMobileMenu() {
            const mobileSidebar = document.getElementById('mobile-sidebar');
            const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
            const isClosed = mobileSidebar.classList.contains('-translate-x-full');
            
            if (isClosed) {
                mobileSidebar.classList.remove('-translate-x-full');
                mobileOverlay.classList.remove('hidden');
            } else {
                mobileSidebar.classList.add('-translate-x-full');
                mobileOverlay.classList.add('hidden');
            }
        }
        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);
        document.getElementById('mobile-menu-close')?.addEventListener('click', toggleMobileMenu);

        // Modal Logic
        function toggleModal(modalID){
            const modal = document.getElementById(modalID);
            if(modal.classList.contains('hidden')){
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        // Main Tab Switcher Logic
        function switchMainTab(type) {
            const ownersSection = document.getElementById('ownersTableSection');
            const tenantsSection = document.getElementById('tenantsTableSection');
            const buttons = document.querySelectorAll('.tab-btn');

            buttons.forEach(btn => btn.classList.remove('active', 'text-gray-600', 'bg-gray-100'));
            
            if (type === 'owners') {
                ownersSection.classList.remove('hidden');
                tenantsSection.classList.add('hidden');
                buttons[0].classList.add('active');
            } else {
                ownersSection.classList.add('hidden');
                tenantsSection.classList.remove('hidden');
                buttons[1].classList.add('active');
            }
        }

        // Load KYC docs from localStorage and show in Owners table (demo support)
        document.addEventListener('DOMContentLoaded', () => {
            try {
                const docs = JSON.parse(localStorage.getItem('roomhy_kyc_docs') || '[]');
                if (!docs.length) return;

                const tbody = document.querySelector('#ownersTableSection table tbody');
                // Clear existing sample rows
                tbody.innerHTML = '';

                docs.forEach((entry, index) => {
                    // Try to find owner name/phone from saved profiles or visits
                    const profiles = JSON.parse(localStorage.getItem('roomhy_owner_profiles') || '{}');
                    const ownerProfile = profiles[entry.loginId] || {};

                    // fallback to visits
                    const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                    const visit = visits.find(v => v.generatedCredentials && v.generatedCredentials.loginId === entry.loginId);

                    const name = ownerProfile.name || (visit && visit.propertyInfo && visit.propertyInfo.name) || ('Owner ' + entry.loginId);
                    const phone = ownerProfile.phone || (visit && visit.areaManager && visit.areaManager.phone) || '';

                    const aadharMasked = entry.aadhar ? entry.aadhar.replace(/(\d{4})(\d{4})(\d{4})/, 'XXXX-XXXX-$3') : '----';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="font-mono text-xs text-gray-500">KYC-OWN-${String(index+1).padStart(3,'0')}</span></td>
                        <td>
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs mr-3">${(name||' ')[0] || 'O'}</div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${name}</p>
                                    <p class="text-xs text-gray-500">${phone}</p>
                                </div>
                            </div>
                        </td>
                        <td class="font-mono text-xs text-gray-600">${aadharMasked}</td>
                        <td class="font-mono text-xs text-gray-600">-</td>
                        <td>
                            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                <i data-lucide="files" class="w-3 h-3 mr-1"></i> ${entry.files.length} Files
                            </span>
                        </td>
                        <td>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                        </td>
                        <td class="text-right">
                            <button onclick="openKycReview(${index})" class="text-purple-600 hover:text-purple-800 text-xs font-medium border border-purple-200 px-3 py-1 rounded hover:bg-purple-50 transition-colors">Review</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                lucide.createIcons();
            } catch (e) {
                console.error('KYC load error', e);
            }
        });

        function openKycReview(idx) {
            const docs = JSON.parse(localStorage.getItem('roomhy_kyc_docs') || '[]');
            const entry = docs[idx];
            if (!entry) return alert('No docs found');

            // Fill modal with files
            const modal = document.getElementById('documentModal');
            const img = modal.querySelector('img');
            const nameEls = modal.querySelectorAll('.lg\:col-span-1 .space-y-2 span:nth-child(2)');
            // Show first file by default
            const file = entry.files[0];
            if (file && file.data) img.src = file.data;

            // Fill applicant details
            modal.querySelector('.lg\:col-span-1 .text-sm.font-mono')?.remove();
            modal.querySelector('.lg\:col-span-1 .space-y-2').innerHTML = `
                <div class="flex justify-between"><span class="text-xs text-gray-500">Name</span><span class="text-xs font-medium text-gray-800">${entry.loginId}</span></div>
                <div class="flex justify-between"><span class="text-xs text-gray-500">Phone</span><span class="text-xs font-medium text-gray-800">-</span></div>
                <div class="border-t border-purple-200 my-2 pt-2">
                    <div class="flex flex-col mb-2"><span class="text-xs text-gray-500">Aadhaar Number</span><span class="text-sm font-mono font-medium text-gray-800 tracking-wide">${entry.aadhar}</span></div>
                </div>`;

            toggleModal('documentModal');
        }

        // Approve / Reject handlers for tenants (demo localStorage fallback)
        function approveKycLocal(loginId) {
            if (!confirm('Approve KYC for ' + loginId + '?')) return;
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const idx = tenants.findIndex(t => t.loginId === loginId || t.id === loginId);
            if (idx > -1) {
                tenants[idx].kycStatus = 'verified';
                tenants[idx].kycVerifiedAt = Date.now();
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                alert('KYC approved (local)');
                // reload tenants section
                loadPendingTenantKyc();
            } else {
                alert('Tenant not found in localStorage');
            }
        }

        function rejectKycLocal(loginId) {
            if (!confirm('Reject KYC for ' + loginId + '?')) return;
            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
            const idx = tenants.findIndex(t => t.loginId === loginId || t.id === loginId);
            if (idx > -1) {
                tenants[idx].kycStatus = 'rejected';
                tenants[idx].kycRejectedAt = Date.now();
                localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                alert('KYC rejected (local)');
                loadPendingTenantKyc();
            } else {
                alert('Tenant not found in localStorage');
            }
        }

        /**
         * LOAD SIGNUP DATA FROM New Signups TABLE
         * This is the source of truth for user login verification
         */
        function loadSignupRecordsFromKYC() {
            try {
                const kycTableKey = 'roomhy_kyc_verification'; // Central New Signups table
                const signupUsers = JSON.parse(localStorage.getItem(kycTableKey) || '[]');
                
                const tbody = document.querySelector('#tenantsTableSection tbody');
                if (!tbody) return;
                
                tbody.innerHTML = '';

                if (signupUsers.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500 text-sm">No signup records found</td></tr>`;
                    return;
                }

                signupUsers.forEach((user, index) => {
                    const tr = document.createElement('tr');
                    
                    // Determine status color
                    const statusColor = user.status === 'verified' ? 'bg-green-100 text-green-800' : 
                                       user.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                       'bg-yellow-100 text-yellow-800';
                    
                    const initials = ((user.firstName || '').charAt(0) + (user.lastName || '').charAt(0)).toUpperCase();
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    
                    tr.innerHTML = `
                        <td><span class="font-mono text-xs text-gray-500">${user.id || 'KYC-' + index}</span></td>
                        <td>
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3">${initials}</div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${fullName}</p>
                                    <p class="text-xs text-gray-500">${user.email}</p>
                                </div>
                            </div>
                        </td>
                        <td class="font-mono text-xs text-gray-600">"�</td>
                        <td class="font-mono text-xs text-gray-600">"�</td>
                        <td>
                            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                <i data-lucide="user" class="w-3 h-3 mr-1"></i> Signup
                            </span>
                        </td>
                        <td>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                                ${(user.status || 'pending').charAt(0).toUpperCase() + (user.status || 'pending').slice(1)}
                            </span>
                        </td>
                        <td class="text-right">
                            <div class="flex gap-2 justify-end">
                                ${user.status !== 'verified' ? `<button onclick="approveSignup('${user.email}')" class="text-green-600 hover:text-green-800 text-xs font-medium border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition-colors">Verify</button>` : ''}
                                ${user.status !== 'rejected' && user.status !== 'verified' ? `<button onclick="rejectSignup('${user.email}')" class="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors">Reject</button>` : ''}
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                lucide.createIcons();
                console.log(`✓ Loaded ${signupUsers.length} signup records from KYC table`);
            } catch (e) { 
                console.error('loadSignupRecordsFromKYC error:', e); 
            }
        }

        /**
         * APPROVE SIGNUP - VERIFY USER
         * Updates New Signups table
         */
        function approveSignup(email) {
            if (!confirm(`Verify account for ${email}?`)) return;

            try {
                const kycTableKey = 'roomhy_kyc_verification';
                const signupUsers = JSON.parse(localStorage.getItem(kycTableKey) || '[]');
                
                const userIndex = signupUsers.findIndex(u => u.email === email);
                if (userIndex === -1) {
                    alert('User not found in New Signups table');
                    return;
                }

                // Update user status to verified
                signupUsers[userIndex].status = 'verified';
                signupUsers[userIndex].verifiedAt = new Date().toISOString();
                signupUsers[userIndex].kycStatus = 'verified';

                localStorage.setItem(kycTableKey, JSON.stringify(signupUsers));
                
                // Also update tenant table for backward compatibility
                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                const tenantIdx = tenants.findIndex(t => t.email === email);
                if (tenantIdx > -1) {
                    tenants[tenantIdx].kycStatus = 'verified';
                    tenants[tenantIdx].status = 'verified';
                    localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                }

                alert('✓ User verified successfully!');
                loadSignupRecordsFromKYC(); // Refresh table
            } catch (e) {
                console.error('approveSignup error:', e);
                alert('Error verifying user');
            }
        }

        /**
         * REJECT SIGNUP - DENY USER
         * Updates New Signups table
         */
        function rejectSignup(email) {
            if (!confirm(`Reject signup for ${email}?`)) return;

            try {
                const kycTableKey = 'roomhy_kyc_verification';
                const signupUsers = JSON.parse(localStorage.getItem(kycTableKey) || '[]');
                
                const userIndex = signupUsers.findIndex(u => u.email === email);
                if (userIndex === -1) {
                    alert('User not found in New Signups table');
                    return;
                }

                // Update user status to rejected
                signupUsers[userIndex].status = 'rejected';
                signupUsers[userIndex].rejectedAt = new Date().toISOString();
                signupUsers[userIndex].kycStatus = 'rejected';

                localStorage.setItem(kycTableKey, JSON.stringify(signupUsers));

                // Also update tenant table for backward compatibility
                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                const tenantIdx = tenants.findIndex(t => t.email === email);
                if (tenantIdx > -1) {
                    tenants[tenantIdx].kycStatus = 'rejected';
                    tenants[tenantIdx].status = 'rejected';
                    localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
                }

                alert('✗ User rejected!');
                loadSignupRecordsFromKYC(); // Refresh table
            } catch (e) {
                console.error('rejectSignup error:', e);
                alert('Error rejecting user');
            }
        }

        // Populate Tenants table with pending KYC (localStorage fallback)
        function loadPendingTenantKyc() {
            try {
                const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]').filter(t => t.kycStatus === 'submitted');
                const tbody = document.querySelector('#tenantsTableSection tbody');
                if (!tbody) return;
                tbody.innerHTML = '';
                tenants.forEach(t => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="font-mono text-xs text-gray-500">${t.requestId || t.id || ''}</span></td>
                        <td><div class="flex items-center"><div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs mr-3">${(t.name||'').split(' ').map(n=>n[0]||'').slice(0,2).join('')}</div><div><p class="text-sm font-medium text-gray-900">${t.name}</p><p class="text-xs text-gray-500">${t.property || ''} · ${t.roomNo || ''}</p></div></div></td>
                        <td class="font-mono text-xs text-gray-600">${t.aadhaar || '"�'}</td>
                        <td class="font-mono text-xs text-gray-600">${t.pan || '"�'}</td>
                        <td><span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">${(t.documents||[]).length} Files</span></td>
                        <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span></td>
                        <td class="text-right">
                            <button onclick="approveKycLocal('${t.loginId || t.id}')" class="text-green-600 text-xs px-2 py-1 rounded border border-green-100 mr-2">Approve</button>
                            <button onclick="rejectKycLocal('${t.loginId || t.id}')" class="text-red-600 text-xs px-2 py-1 rounded border border-red-100">Reject</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                lucide.createIcons();
            } catch (e) { console.error('loadPendingTenantKyc', e); }
        }

        // run tenant loader on DOM ready
        document.addEventListener('DOMContentLoaded', () => {
            loadSignupRecordsFromKYC(); // Load signup data from New Signups table
        });