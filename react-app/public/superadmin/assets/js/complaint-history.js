lucide.createIcons();
        let allComplaints = [];
        let displayedComplaints = [];

        // Sidebar submenu toggle
        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadAllComplaints();
        });

        function loadAllComplaints() {
            try {
                allComplaints = JSON.parse(localStorage.getItem('roomhy_complaints') || '[]');
                displayedComplaints = allComplaints;
                renderComplaints(displayedComplaints);
                updateStats();
            } catch (e) {
                console.error('Error loading complaints:', e);
                document.getElementById('complaints-list').innerHTML = '<div class="text-center py-12 text-red-600">Error loading complaints</div>';
            }
        }

        function renderComplaints(complaints) {
            const container = document.getElementById('complaints-list');
            
            if (complaints.length === 0) {
                container.innerHTML = '<div class="p-12 text-center text-gray-500"><i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i><p>No complaints found</p></div>';
                return;
            }

            container.innerHTML = complaints.map(c => {
                const statusClass = c.status === 'Open' ? 'status-open' : (c.status === 'Taken' ? 'status-taken' : (c.status === 'Resolved' ? 'status-resolved' : 'status-rejected'));
                const createdDate = new Date(c.createdAt).toLocaleDateString();
                const resolvedDate = c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '"”';

                return `
                    <div class="complaint-row">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h3 class="text-base font-semibold text-gray-800">${c.description}</h3>
                                <p class="text-xs text-gray-400 mt-1">Ticket ID: ${c.id}</p>
                            </div>
                            <span class="status-badge ${statusClass}">${c.status}</span>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                            <div><strong>Category:</strong> ${c.category}</div>
                            <div><strong>Priority:</strong> ${c.priority}</div>
                            <div><strong>Tenant:</strong> ${c.tenantName}</div>
                            <div><strong>Property:</strong> ${c.property}</div>
                            <div><strong>Room:</strong> ${c.roomNo}${c.bedNo ? ' ('+c.bedNo+')' : '"”'}</div>
                            <div><strong>Reported:</strong> ${createdDate}</div>
                            ${c.resolvedAt ? '<div><strong>Resolved:</strong> ' + resolvedDate + '</div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }

        function updateStats() {
            const stats = {
                total: allComplaints.length,
                open: allComplaints.filter(c => c.status === 'Open').length,
                taken: allComplaints.filter(c => c.status === 'Taken').length,
                resolved: allComplaints.filter(c => c.status === 'Resolved').length,
                rejected: allComplaints.filter(c => c.status === 'Rejected').length
            };
            document.getElementById('stat-total').textContent = stats.total;
            document.getElementById('stat-open').textContent = stats.open;
            document.getElementById('stat-taken').textContent = stats.taken;
            document.getElementById('stat-resolved').textContent = stats.resolved;
            document.getElementById('stat-rejected').textContent = stats.rejected;
        }

        function filterComplaints(status) {
            displayedComplaints = status === 'all' ? allComplaints : allComplaints.filter(c => c.status === status);
            renderComplaints(displayedComplaints);
        }

        document.getElementById('search-box')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            displayedComplaints = allComplaints.filter(c => 
                c.tenantName.toLowerCase().includes(query) || 
                c.description.toLowerCase().includes(query) ||
                c.id.toLowerCase().includes(query)
            );
            renderComplaints(displayedComplaints);
        });