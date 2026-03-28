lucide.createIcons();

        // Mock Data for Initial Load
        const mockComplaints = [
            {
                id: 'CMP-2025-001',
                category: 'Plumbing',
                desc: 'Bathroom tap is leaking continuously since morning.',
                date: '27 Nov 2025',
                status: 'Open',
                priority: 'Medium'
            },
            {
                id: 'REQ-2025-042',
                category: 'Internet',
                desc: 'WiFi signal is very weak in Room 203.',
                date: '25 Nov 2025',
                status: 'In Progress',
                priority: 'High'
            },
            {
                id: 'REQ-2025-030',
                category: 'Electrical',
                desc: 'Tube light replacement required.',
                date: '10 Nov 2025',
                status: 'Resolved',
                priority: 'Low'
            }
        ];

        document.addEventListener('DOMContentLoaded', () => {
            // Check if user is logged in (check both tenant_user and user keys)
            const user = JSON.parse(localStorage.getItem('tenant_user') || localStorage.getItem('user') || 'null');
            if (!user || user.role !== 'tenant') {
                document.getElementById('complaints-list').innerHTML = '<div class="text-center py-12 text-red-600">Please login as tenant first</div>';
                return;
            }

            // Populate header avatar
            document.getElementById('headerAvatar').innerText = user.name.charAt(0).toUpperCase();

            loadTenantComplaints(user.tenantId || user.loginId);
        });

        async function loadTenantComplaints(tenantId) {
            try {
                const apiUrl = API_URL;

                const response = await fetch(`${apiUrl}/api/complaints/tenant/${tenantId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const complaints = data.complaints || data;
                    renderComplaints(complaints.map(c => ({
                        id: c._id,
                        category: c.category,
                        desc: c.description,
                        date: new Date(c.createdAt).toLocaleDateString(),
                        status: c.status,
                        priority: c.priority
                    })));
                } else {
                    console.error('Failed to load complaints:', response.status);
                    renderComplaints([]);
                }
            } catch (e) {
                console.error('Error loading complaints:', e);
                renderComplaints(mockComplaints); // Fallback to mock
            }
        }

        function renderComplaints(data) {
            const container = document.getElementById('complaints-list');
            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <i data-lucide="check-circle-2" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
                        <h3 class="text-lg font-medium text-slate-600">No Active Requests</h3>
                        <p class="text-sm text-slate-400 mt-1">You haven't raised any complaints yet.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            data.forEach(item => {
                let statusClass = '';
                let icon = '';
                
                if(item.status === 'Open') { statusClass = 'status-open'; icon = 'alert-circle'; }
                else if(item.status === 'In Progress') { statusClass = 'status-progress'; icon = 'loader-2'; }
                else { statusClass = 'status-resolved'; icon = 'check-circle'; }

                const card = document.createElement('div');
                card.className = 'complaint-card p-5 flex flex-col md:flex-row justify-between gap-4';
                card.innerHTML = `
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                ${item.category}
                            </span>
                            <span class="text-xs text-slate-400">"¢ ${item.date}</span>
                            ${item.priority === 'High' ? '<span class="text-[10px] text-red-600 font-bold flex items-center"><i data-lucide="flame" class="w-3 h-3 mr-0.5"></i> High Priority</span>' : ''}
                        </div>
                        <h3 class="text-base font-semibold text-slate-800 mb-1">
                            ${item.desc}
                        </h3>
                        <p class="text-xs text-slate-400 font-mono">Ticket ID: ${item.id}</p>
                    </div>
                    
                    <div class="flex items-center justify-between md:justify-end gap-4 min-w-[140px]">
                        <span class="flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusClass}">
                            <i data-lucide="${icon}" class="w-3.5 h-3.5 mr-1.5"></i> ${item.status}
                        </span>
                        <button class="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors" title="View Details">
                            <i data-lucide="chevron-right" class="w-5 h-5"></i>
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
            lucide.createIcons();
        }

        // --- Modal Logic ---
        function openComplaintModal() {
            const modal = document.getElementById('complaintModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeModal(id) {
            const modal = document.getElementById(id);
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        async function submitComplaint(e) {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('tenant_user') || localStorage.getItem('user') || 'null');

            if (!user || user.role !== 'tenant') {
                alert('Error: User not properly logged in');
                return;
            }

            const category = document.getElementById('category').value;
            const description = document.getElementById('description').value;
            const priority = document.querySelector('input[name="priority"]:checked').value;

            // Create complaint object
            const complaint = {
                tenantId: user.tenantId || user.loginId,
                tenantName: user.name || user.username || 'Tenant',
                tenantPhone: user.phone || 'N/A',
                category: category,
                description: description,
                priority: priority
            };

            try {
                const apiUrl = API_URL;

                const response = await fetch(`${apiUrl}/api/complaints`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    body: JSON.stringify(complaint)
                });

                if (response.ok) {
                    const result = await response.json();
                    // Display confirmation
                    document.getElementById('newComplaintForm').reset();
                    closeModal('complaintModal');
                    alert("Complaint Raised Successfully! Ticket ID: " + (result.complaint?._id || result._id || 'N/A'));

                    // Reload tenant complaints
                    loadTenantComplaints(user.tenantId || user.loginId);
                } else {
                    const error = await response.json();
                    alert('Error submitting complaint: ' + (error.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error submitting complaint:', error);
                alert('Error submitting complaint. Please try again.');
            }
        }