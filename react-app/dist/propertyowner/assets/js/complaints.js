lucide.createIcons();
        let currentComplaintId = null;
        let currentAction = null;
        let ownerComplaints = [];
        let user = null;

        // Listen for owner context updates from ownerContextSync.js
        window.addEventListener('owner-session-updated', (event) => {
            user = event.detail || window.__ownerContext;
            updateHeaderFromUser(user);
        });

        function updateHeaderFromUser(userData) {
            if (!userData) return;
            try {
                const displayName = userData.name || userData.displayName || userData.profileName || userData.loginId;
                if (document.getElementById('headerName')) document.getElementById('headerName').innerText = displayName;
                if (document.getElementById('headerAvatar')) document.getElementById('headerAvatar').innerText = (displayName || 'O').charAt(0).toUpperCase();
                if (document.getElementById('headerAccountId')) document.getElementById('headerAccountId').innerText = `Account: ${userData.loginId}`;
            } catch (e) { /* ignore */ }
        }

        document.addEventListener('DOMContentLoaded', () => {
            // Try to get user from window context first (set by ownerContextSync.js)
            user = user || window.__ownerContext || JSON.parse(localStorage.getItem('user') || 'null');
            
            if (!user || user.role !== 'owner') {
                document.getElementById('complaints-container').innerHTML = '<div class="text-center py-12 text-red-600">Please login as property owner first</div>';
                return;
            }

            // Populate header with owner info
            updateHeaderFromUser(user);

            // Attach logout handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user');
                    window.location.href = '/propertyowner/ownerlogin';
                });
            }

            // Prefer explicit ownerId when available
            const ownerId = user.ownerId || user.loginId;
            loadOwnerComplaints(ownerId);
        });

        function loadOwnerComplaints(ownerId) {
            try {
                const allComplaints = JSON.parse(localStorage.getItem('roomhy_complaints') || '[]');

                // Tenant records may store owner reference in different fields depending on flow
                const tenantsRaw = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
                const tenants = tenantsRaw.filter(t => {
                    return (t.ownerId && t.ownerId === ownerId) || (t.assignedBy && t.assignedBy === ownerId) || (t.propertyOwner && t.propertyOwner === ownerId);
                });

                const tenantIds = tenants.map(t => t.id || t.loginId).filter(Boolean);

                // Filter complaints from this owner's tenants
                ownerComplaints = allComplaints.filter(c => tenantIds.includes(c.tenantId));

                renderComplaints(ownerComplaints);
                updateStats();
            } catch (e) {
                console.error('Error loading complaints:', e);
                document.getElementById('complaints-container').innerHTML = '<div class="text-center py-12 text-red-600">Error loading complaints</div>';
            }
        }

        function renderComplaints(complaints) {
            const container = document.getElementById('complaints-container');
            
            if (complaints.length === 0) {
                container.innerHTML = '<div class="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300"><i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i><p class="text-gray-600">No complaints yet</p></div>';
                return;
            }

            container.innerHTML = complaints.map(c => {
                const statusClass = c.status === 'Open' ? 'status-open' : (c.status === 'Taken' ? 'status-taken' : (c.status === 'Resolved' ? 'status-resolved' : 'status-rejected'));
                const priorityClass = c.priority === 'High' ? 'priority-high' : (c.priority === 'Medium' ? 'priority-medium' : 'priority-low');
                const createdDate = new Date(c.createdAt).toLocaleDateString();

                return `
                    <div class="complaint-card">
                        <div class="flex justify-between items-start gap-4 mb-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-semibold">${c.category}</span>
                                    <span class="priority-badge ${priorityClass}">${c.priority}</span>
                                    <span class="text-xs text-gray-400">${createdDate}</span>
                                </div>
                                <h3 class="text-base font-semibold text-gray-800 mb-1">${c.description}</h3>
                                <div class="flex items-center gap-4 text-xs text-gray-600">
                                    <div><strong>Tenant:</strong> ${c.tenantName}</div>
                                    <div><strong>Room:</strong> ${c.roomNo}${c.bedNo ? ' ('+c.bedNo+')' : ''}</div>
                                    <div><strong>Phone:</strong> ${c.tenantPhone}</div>
                                </div>
                            </div>
                            <span class="status-badge ${statusClass}">${c.status}</span>
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            ${c.status === 'Open' ? `<button onclick="updateStatus('${c.id}', 'Taken')" class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium hover:bg-yellow-200">Mark as In Progress</button>` : ''}
                            ${c.status === 'Taken' ? `<button onclick="updateStatus('${c.id}', 'Resolved')" class="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200">Mark as Resolved</button><button onclick="updateStatus('${c.id}', 'Rejected')" class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">Reject</button>` : ''}
                            ${c.status === 'Open' ? `<button onclick="updateStatus('${c.id}', 'Rejected')" class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200">Reject</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }

        function updateStats() {
            const counts = {
                Open: ownerComplaints.filter(c => c.status === 'Open').length,
                Taken: ownerComplaints.filter(c => c.status === 'Taken').length,
                Resolved: ownerComplaints.filter(c => c.status === 'Resolved').length,
                Rejected: ownerComplaints.filter(c => c.status === 'Rejected').length
            };
            document.getElementById('count-open').textContent = counts.Open;
            document.getElementById('count-taken').textContent = counts.Taken;
            document.getElementById('count-resolved').textContent = counts.Resolved;
            document.getElementById('count-rejected').textContent = counts.Rejected;
        }

        function updateStatus(complaintId, newStatus) {
            currentComplaintId = complaintId;
            currentAction = newStatus;
            const complaint = ownerComplaints.find(c => c.id === complaintId);
            
            const statusText = newStatus === 'Taken' ? 'In Progress' : newStatus;
            document.getElementById('modal-content').innerHTML = `
                <p class="text-gray-600">Are you sure you want to mark this complaint as <strong>${statusText}</strong>?</p>
                <p class="text-sm text-gray-500"><strong>Complaint:</strong> ${complaint.description}</p>
            `;
            
            document.getElementById('actionModal').classList.remove('hidden');
            document.getElementById('actionModal').classList.add('flex');
        }

        function confirmAction() {
            if (!currentComplaintId || !currentAction) return;
            
            const allComplaints = JSON.parse(localStorage.getItem('roomhy_complaints') || '[]');
            const idx = allComplaints.findIndex(c => c.id === currentComplaintId);
            
            if (idx > -1) {
                allComplaints[idx].status = currentAction;
                allComplaints[idx].updatedAt = new Date().toISOString();
                if (currentAction === 'Resolved') {
                    allComplaints[idx].resolvedAt = new Date().toISOString();
                }
                localStorage.setItem('roomhy_complaints', JSON.stringify(allComplaints));
                
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                loadOwnerComplaints(user.loginId || user.ownerId);
                closeActionModal();
                alert(`Complaint status updated to ${currentAction === 'Taken' ? 'In Progress' : currentAction}`);
            }
        }

        function closeActionModal() {
            document.getElementById('actionModal').classList.add('hidden');
            document.getElementById('actionModal').classList.remove('flex');
            currentComplaintId = null;
            currentAction = null;
        }

        function filterComplaints(status) {
            const filtered = status === 'all' ? ownerComplaints : ownerComplaints.filter(c => c.status === status);
            renderComplaints(filtered);
        }

        document.getElementById('search-complaints')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = ownerComplaints.filter(c => 
                c.tenantName.toLowerCase().includes(query) || 
                c.description.toLowerCase().includes(query)
            );
            renderComplaints(filtered);
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