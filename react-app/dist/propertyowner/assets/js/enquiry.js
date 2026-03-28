lucide.createIcons();
        // Header user info logic (copied from /propertyowner/admin)
        document.addEventListener('DOMContentLoaded', async () => {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user && user.name) {
                document.getElementById('headerName').innerText = user.name;
                document.getElementById('welcomeName')?.innerText = user.name;
                document.getElementById('headerAvatar').innerText = user.name.charAt(0).toUpperCase();
                document.getElementById('headerAccountId').innerText = `Account: ${user.loginId}`;
            }
            // Logout
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.href = '..//propertyowner/index';
            });
            // Fetch and display owner enquiries
            if (!user || !user.loginId) {
                document.getElementById('enquiry-list').innerHTML = '<p class="text-red-500">Not logged in as owner.</p>';
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/owners/${encodeURIComponent(user.loginId)}/enquiries`);
                const list = res.ok ? await res.json() : [];
                const container = document.getElementById('enquiry-list');
                if (!list.length) {
                    container.innerHTML = '<p class="text-gray-500">No enquiries yet.</p>';
                    return;
                }
                
                const rows = list.map(enquiry => {
                    const propertyName = enquiry.propertyName || enquiry.propertyId || 'N/A';
                    const tenantName = enquiry.studentName || enquiry.studentId || 'N/A';
                    const email = enquiry.ownerGmail || '-';
                    const date = new Date(enquiry.ts).toLocaleString();
                    
                    let statusColor = 'bg-gray-200 text-gray-700';
                    if (enquiry.status === 'pending') statusColor = 'bg-yellow-100 text-yellow-800';
                    else if (enquiry.status === 'accepted') statusColor = 'bg-green-100 text-green-800';
                    else if (enquiry.status === 'rejected') statusColor = 'bg-red-100 text-red-700';
                    else if (enquiry.status === 'approved') statusColor = 'bg-blue-100 text-blue-800';
                    else if (enquiry.status === 'request to connect') statusColor = 'bg-purple-100 text-purple-800';
                    
                    const statusText = enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1);
                    let actionBtn = '';
                    if (enquiry.status === 'accepted' && enquiry.chatOpen) {
                        actionBtn = `<a href="/propertyowner/ownerchat?enquiryId=${enquiry._id}&studentId=${enquiry.studentId}" class="ml-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">Chat</a>`;
                    }
                    
                    return `<tr>
                        <td class="px-2 py-1">${propertyName}</td>
                        <td class="px-2 py-1">${tenantName}</td>
                        <td class="px-2 py-1">${email}</td>
                        <td class="px-2 py-1"><span class="inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor}">${statusText}</span></td>
                        <td class="px-2 py-1">${date}</td>
                        <td class="px-2 py-1">${actionBtn}</td>
                    </tr>`;
                }).join('');
                
                const table = `<table class="min-w-full text-xs text-left text-gray-700">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-2 py-1">Property</th>
                            <th class="px-2 py-1">Tenant</th>
                            <th class="px-2 py-1">Gmail</th>
                            <th class="px-2 py-1">Status</th>
                            <th class="px-2 py-1">Date</th>
                            <th class="px-2 py-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;
                
                container.innerHTML = table;
            } catch (e) {
                console.error('Error loading enquiries:', e);
                document.getElementById('enquiry-list').innerHTML = '<p class="text-red-500">Failed to load enquiries.</p>';
            }
        });

        // Mobile Menu Functionality
        document.getElementById('mobile-menu-open').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.remove('hidden');
        });

        document.getElementById('close-mobile-menu').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('mobile-menu-overlay').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.add('hidden');
        });