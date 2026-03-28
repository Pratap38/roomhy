const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api/visits' : 'https://api.roomhy.com/api/visits';
        let allEnquiries = [];
        let currentEnquiryId = null;

        // Initialize
        async function init() {
            showTab('pending');
        }

        // Tab switching
        function showTab(tab) {
            // Hide all tabs
            document.getElementById('pendingTab').classList.add('hidden');
            document.getElementById('reviewTab').classList.add('hidden');
            document.getElementById('approvedTab').classList.add('hidden');
            document.getElementById('allTab').classList.add('hidden');

            // Reset buttons
            document.getElementById('pendingTabBtn').classList.add('bg-gray-300', 'text-gray-700');
            document.getElementById('pendingTabBtn').classList.remove('bg-blue-600', 'text-white');
            document.getElementById('reviewTabBtn').classList.add('bg-gray-300', 'text-gray-700');
            document.getElementById('reviewTabBtn').classList.remove('bg-blue-600', 'text-white');
            document.getElementById('approvedTabBtn').classList.add('bg-gray-300', 'text-gray-700');
            document.getElementById('approvedTabBtn').classList.remove('bg-blue-600', 'text-white');
            document.getElementById('allTabBtn').classList.add('bg-gray-300', 'text-gray-700');
            document.getElementById('allTabBtn').classList.remove('bg-blue-600', 'text-white');

            // Show selected tab
            const tabElements = {
                'pending': 'pendingTab',
                'review': 'reviewTab',
                'approved': 'approvedTab',
                'all': 'allTab'
            };

            const buttonElements = {
                'pending': 'pendingTabBtn',
                'review': 'reviewTabBtn',
                'approved': 'approvedTabBtn',
                'all': 'allTabBtn'
            };

            document.getElementById(tabElements[tab]).classList.remove('hidden');
            document.getElementById(buttonElements[tab]).classList.remove('bg-gray-300', 'text-gray-700');
            document.getElementById(buttonElements[tab]).classList.add('bg-blue-600', 'text-white');

            // Load data based on tab
            if (tab === 'pending') fetchEnquiries('pending');
            else if (tab === 'review') fetchEnquiries('pending_review');
            else if (tab === 'approved') fetchEnquiries('approved');
            else if (tab === 'all') fetchAllEnquiries();
        }

        // Fetch enquiries from MongoDB
        async function fetchEnquiries(status) {
            try {
                let endpoint;
                if (status === 'pending') {
                    endpoint = `${API_BASE_URL}/pending`;
                } else if (status === 'approved') {
                    endpoint = `${API_BASE_URL}/approved`;
                } else {
                    endpoint = `${API_BASE_URL}/all`;
                }

                const response = await fetch(endpoint);
                const result = await response.json();

                const container = {
                    'pending': 'pendingContainer',
                    'pending_review': 'reviewContainer',
                    'approved': 'approvedContainer'
                }[status] || 'pendingContainer';

                const noMessage = {
                    'pending': 'noPending',
                    'pending_review': 'noReview',
                    'approved': 'noApproved'
                }[status] || 'noPending';

                const spinner = {
                    'pending': 'pendingLoadingSpinner',
                    'pending_review': 'reviewLoadingSpinner',
                    'approved': 'approvedLoadingSpinner'
                }[status] || 'pendingLoadingSpinner';

                if (document.getElementById(spinner)) {
                    document.getElementById(spinner).style.display = 'none';
                }

                if (result.success && result.visits && result.visits.length > 0) {
                    document.getElementById(noMessage).classList.add('hidden');
                    document.getElementById(container).innerHTML = '';

                    result.visits.forEach(enquiry => {
                        displayEnquiryCard(enquiry, container, status);
                    });
                } else {
                    document.getElementById(container).innerHTML = '';
                    document.getElementById(noMessage).classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error fetching enquiries:', error);
                alert('Error loading enquiries: ' + error.message);
            }
        }

        // Fetch all enquiries
        async function fetchAllEnquiries() {
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();

                if (result.success && result.visits && result.visits.length > 0) {
                    allEnquiries = result.visits;
                    document.getElementById('noAll').classList.add('hidden');
                    displayAllEnquiriesTable(allEnquiries);
                } else {
                    document.getElementById('allTableBody').innerHTML = '';
                    document.getElementById('noAll').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error fetching all enquiries:', error);
                alert('Error loading enquiries: ' + error.message);
            }
        }

        // Display enquiry card
        function displayEnquiryCard(enquiry, container, status) {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition';

            card.innerHTML = `
                <div class="mb-3">
                    <h3 class="text-lg font-bold text-gray-800">${enquiry.propertyName || 'N/A'}</h3>
                    <p class="text-sm text-gray-600">${enquiry.propertyType || ''} • ${enquiry.city || ''}</p>
                </div>
                <div class="mb-3 space-y-1 text-sm">
                    <p><strong>Owner:</strong> ${enquiry.ownerName || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${enquiry.ownerPhone || 'N/A'}</p>
                    <p><strong>Rent:</strong> ₹${enquiry.monthlyRent || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${enquiry.status || 'submitted'}">${enquiry.status || 'submitted'}</span></p>
                </div>
                <div class="flex gap-2">
                    <button onclick="viewDetails('${enquiry.visitId}')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">
                        View
                    </button>
                    <button onclick="openApprovalModal('${enquiry.visitId}')" class="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">
                        Approve
                    </button>
                </div>
            `;

            document.getElementById(container).appendChild(card);
        }

        // Display all enquiries table
        function displayAllEnquiriesTable(enquiries) {
            const tbody = document.getElementById('allTableBody');
            tbody.innerHTML = '';

            enquiries.forEach(enquiry => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${enquiry.propertyName || 'N/A'}</td>
                    <td class="px-4 py-3">${enquiry.city || 'N/A'}</td>
                    <td class="px-4 py-3">${enquiry.ownerName || 'N/A'}</td>
                    <td class="px-4 py-3"><span class="status-badge status-${enquiry.status || 'submitted'}">${enquiry.status || 'submitted'}</span></td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="viewDetails('${enquiry.visitId}')" class="text-blue-600 hover:underline">View</button>
                        ${enquiry.status === 'submitted' ? `<button onclick="openApprovalModal('${enquiry.visitId}')" class="ml-2 text-green-600 hover:underline">Approve</button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Filter enquiries in table
        function filterEnquiries() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filtered = allEnquiries.filter(enquiry =>
                enquiry.propertyName?.toLowerCase().includes(searchTerm) ||
                enquiry.city?.toLowerCase().includes(searchTerm) ||
                enquiry.ownerName?.toLowerCase().includes(searchTerm)
            );
            displayAllEnquiriesTable(filtered);
        }

        // View details
        async function viewDetails(enquiryId) {
            try {
                const response = await fetch(`${API_BASE_URL}/${enquiryId}`);
                const result = await response.json();

                if (result.success && result.visit) {
                    const enquiry = result.visit;
                    const content = document.getElementById('detailsModalContent');
                    content.innerHTML = `
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">${enquiry.propertyName}</h2>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div><strong>Type:</strong> ${enquiry.propertyType || 'N/A'}</div>
                            <div><strong>City:</strong> ${enquiry.city || 'N/A'}</div>
                            <div><strong>Area:</strong> ${enquiry.area || 'N/A'}</div>
                            <div><strong>Address:</strong> ${enquiry.address || 'N/A'}</div>
                            <div><strong>Rent:</strong> ₹${enquiry.monthlyRent || 'N/A'}</div>
                            <div><strong>Deposit:</strong> ${enquiry.deposit || 'N/A'}</div>
                            <div><strong>Status:</strong> <span class="status-badge status-${enquiry.status}">${enquiry.status}</span></div>
                            <div><strong>Submitted:</strong> ${new Date(enquiry.submittedAt).toLocaleDateString()}</div>
                        </div>
                        <div class="mb-6">
                            <h3 class="font-bold mb-2">Owner Details</h3>
                            <p><strong>Name:</strong> ${enquiry.ownerName || 'N/A'}</p>
                            <p><strong>Email:</strong> ${enquiry.ownerEmail || 'N/A'}</p>
                            <p><strong>Phone:</strong> ${enquiry.ownerPhone || 'N/A'}</p>
                        </div>
                        <div class="mb-6">
                            <h3 class="font-bold mb-2">Visitor Details</h3>
                            <p><strong>Name:</strong> ${enquiry.visitorName || 'N/A'}</p>
                            <p><strong>Email:</strong> ${enquiry.visitorEmail || 'N/A'}</p>
                            <p><strong>Phone:</strong> ${enquiry.visitorPhone || 'N/A'}</p>
                        </div>
                        ${enquiry.description ? `<div class="mb-6"><h3 class="font-bold mb-2">Description</h3><p>${enquiry.description}</p></div>` : ''}
                        ${enquiry.amenities && enquiry.amenities.length > 0 ? `<div class="mb-6"><h3 class="font-bold mb-2">Amenities</h3><p>${enquiry.amenities.join(', ')}</p></div>` : ''}
                    `;
                    document.getElementById('detailsModal').classList.add('show');
                }
            } catch (error) {
                console.error('Error fetching details:', error);
                alert('Error loading details: ' + error.message);
            }
        }

        // Open approval modal
        async function openApprovalModal(enquiryId) {
            try {
                currentEnquiryId = enquiryId;
                const response = await fetch(`${API_BASE_URL}/${enquiryId}`);
                const result = await response.json();

                if (result.success && result.visit) {
                    const enquiry = result.visit;
                    const content = document.getElementById('approvalModalContent');
                    content.innerHTML = `
                        <div class="space-y-4 mb-6">
                            <div><strong>Property:</strong> ${enquiry.propertyName}</div>
                            <div><strong>Owner:</strong> ${enquiry.ownerName}</div>
                            <div><strong>City:</strong> ${enquiry.city}</div>
                            <div><strong>Rent:</strong> ₹${enquiry.monthlyRent}</div>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Approval Notes</label>
                            <textarea id="approvalNotes" placeholder="Add any notes for approval..." rows="4"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    `;
                    document.getElementById('approvalModal').classList.add('show');
                }
            } catch (error) {
                console.error('Error opening approval modal:', error);
                alert('Error loading visit: ' + error.message);
            }
        }

        // Submit approval
        async function submitApproval() {
            try {
                const approvalData = {
                    status: 'approved',
                    approvalNotes: document.getElementById('approvalNotes').value,
                    approvedBy: 'Super Admin' // You can make this dynamic
                };

                const response = await fetch(`${API_BASE_URL}/${currentEnquiryId}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(approvalData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('✓ Visit approved and stored in MongoDB!');
                    closeApprovalModal();
                    fetchEnquiries('pending');
                    fetchEnquiries('approved'); // Refresh approved tab too
                } else {
                    alert('✗ Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error approving visit:', error);
                alert('✗ Error approving visit: ' + error.message);
            }
        }

        // Reject enquiry
        async function rejectEnquiry() {
            const reason = prompt('Enter reason for rejection:');
            if (!reason) return;

            try {
                const response = await fetch(`${API_BASE_URL}/${currentEnquiryId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'rejected',
                        notes: reason
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('✓ Enquiry rejected and updated in MongoDB!');
                    closeApprovalModal();
                    fetchEnquiries('pending');
                } else {
                    alert('✗ Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error rejecting enquiry:', error);
                alert('✗ Error rejecting enquiry: ' + error.message);
            }
        }

        // Close modals
        function closeApprovalModal() {
            document.getElementById('approvalModal').classList.remove('show');
            currentEnquiryId = null;
        }

        function closeDetailsModal() {
            document.getElementById('detailsModal').classList.remove('show');
        }

        // Initialize on page load
        window.addEventListener('DOMContentLoaded', init);