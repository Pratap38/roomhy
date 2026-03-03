const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api/visits' : 'https://api.roomhy.com/api/visits';
        let allVisits = [];
        let currentFilter = 'all';
        let selectedVisit = null;

        async function loadVisits() {
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();

                if (result.success) {
                    allVisits = result.visits || [];
                    filterVisits(currentFilter);
                } else {
                    document.getElementById('visitsList').innerHTML = '<div class="text-red-600">Failed to load visits</div>';
                }
            } catch (error) {
                console.error('Error loading visits:', error);
                document.getElementById('visitsList').innerHTML = '<div class="text-red-600">Error: ' + error.message + '</div>';
            }
        }

        function filterVisits(filter) {
            currentFilter = filter;
            let filtered = allVisits;

            if (filter !== 'all') {
                filtered = allVisits.filter(v => v.status === filter);
            }

            displayVisits(filtered);
        }

        function displayVisits(visits) {
            const container = document.getElementById('visitsList');

            if (visits.length === 0) {
                container.innerHTML = '<div class="bg-white rounded-lg p-6 text-center text-gray-500">No visits found</div>';
                return;
            }

            container.innerHTML = visits.map(visit => `
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">${visit.propertyName}</h3>
                            <p class="text-gray-600">${visit.city}, ${visit.area || ''}</p>
                            <p class="text-sm text-gray-500">ID: ${visit.visitId}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-white font-semibold ${getStatusColor(visit.status)}">
                            ${visit.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <p class="font-semibold text-gray-700">Visitor</p>
                            <p>${visit.visitorName}</p>
                            <p class="text-gray-500">${visit.visitorPhone}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-700">Owner</p>
                            <p>${visit.ownerName}</p>
                            <p class="text-gray-500">${visit.ownerPhone}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-700">Property Type</p>
                            <p>${visit.propertyType}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-700">Monthly Rent</p>
                            <p>₹${visit.monthlyRent || 'N/A'}</p>
                        </div>
                    </div>

                    <button onclick="showDetails('${visit.visitId}')" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                        View Details & Approve
                    </button>
                </div>
            `).join('');
        }

        function getStatusColor(status) {
            switch (status) {
                case 'submitted':
                case 'pending_review':
                    return 'bg-yellow-500';
                case 'approved':
                    return 'bg-green-500';
                case 'rejected':
                    return 'bg-red-500';
                default:
                    return 'bg-gray-500';
            }
        }

        async function showDetails(visitId) {
            const visit = allVisits.find(v => v.visitId === visitId);
            if (!visit) return;

            selectedVisit = visit;
            const modal = document.getElementById('detailsModal');
            const content = document.getElementById('detailsContent');

            content.innerHTML = `
                <div class="space-y-4">
                    <!-- Visitor Info -->
                    <div>
                        <h4 class="font-bold text-gray-800 mb-2">Visitor Information</h4>
                        <div class="bg-gray-50 p-3 rounded">
                            <p><strong>Name:</strong> ${visit.visitorName}</p>
                            <p><strong>Email:</strong> ${visit.visitorEmail}</p>
                            <p><strong>Phone:</strong> ${visit.visitorPhone}</p>
                        </div>
                    </div>

                    <!-- Property Info -->
                    <div>
                        <h4 class="font-bold text-gray-800 mb-2">Property Information</h4>
                        <div class="bg-gray-50 p-3 rounded">
                            <p><strong>Name:</strong> ${visit.propertyName}</p>
                            <p><strong>Type:</strong> ${visit.propertyType}</p>
                            <p><strong>Address:</strong> ${visit.address || 'N/A'}</p>
                            <p><strong>City:</strong> ${visit.city}</p>
                            <p><strong>Area:</strong> ${visit.area || 'N/A'}</p>
                            <p><strong>Pincode:</strong> ${visit.pincode || 'N/A'}</p>
                            <p><strong>Description:</strong> ${visit.description || 'N/A'}</p>
                            <p><strong>Monthly Rent:</strong> ₹${visit.monthlyRent || 'N/A'}</p>
                            <p><strong>Deposit:</strong> ${visit.deposit || 'N/A'}</p>
                            <p><strong>Gender Suitability:</strong> ${visit.genderSuitability || 'N/A'}</p>
                            <p><strong>Amenities:</strong> ${(visit.amenities || []).join(', ') || 'N/A'}</p>
                        </div>
                    </div>

                    <!-- Owner Info -->
                    <div>
                        <h4 class="font-bold text-gray-800 mb-2">Owner Information</h4>
                        <div class="bg-gray-50 p-3 rounded">
                            <p><strong>Name:</strong> ${visit.ownerName}</p>
                            <p><strong>Email:</strong> ${visit.ownerEmail}</p>
                            <p><strong>Phone:</strong> ${visit.ownerPhone}</p>
                            <p><strong>City:</strong> ${visit.ownerCity}</p>
                        </div>
                    </div>

                    <!-- Photos -->
                    ${visit.photos && visit.photos.length > 0 ? `
                        <div>
                            <h4 class="font-bold text-gray-800 mb-2">Regular Photos</h4>
                            <div class="photo-grid">
                                ${visit.photos.map((photo, idx) => `
                                    <img src="${photo}" alt="Photo ${idx + 1}" onclick="showLightbox('${photo}')">
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${visit.professionalPhotos && visit.professionalPhotos.length > 0 ? `
                        <div>
                            <h4 class="font-bold text-gray-800 mb-2">Professional Photos</h4>
                            <div class="photo-grid">
                                ${visit.professionalPhotos.map((photo, idx) => `
                                    <img src="${photo}" alt="Pro Photo ${idx + 1}" onclick="showLightbox('${photo}')">
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Submitted Date -->
                    <div class="text-sm text-gray-500">
                        Submitted: ${new Date(visit.submittedAt).toLocaleString()}
                    </div>
                </div>
            `;

            // Set approval buttons based on status
            const buttonsDiv = document.getElementById('approvalButtons');
            if (visit.status === 'submitted' || visit.status === 'pending_review') {
                buttonsDiv.innerHTML = `
                    <textarea id="approvalNotes" placeholder="Approval notes..." class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
                    <button onclick="approveVisit()" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        ✓ Approve
                    </button>
                    <button onclick="rejectVisit()" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                        ✗ Reject
                    </button>
                `;
            } else if (visit.status === 'approved') {
                buttonsDiv.innerHTML = `
                    <p class="text-green-600 font-semibold">✓ This property has been approved</p>
                    <p class="text-sm text-gray-600">${visit.approvalNotes || 'No notes'}</p>
                    <button onclick="rejectVisit()" class="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                        Undo Approval
                    </button>
                `;
            } else if (visit.status === 'rejected') {
                buttonsDiv.innerHTML = `
                    <p class="text-red-600 font-semibold">✗ This property has been rejected</p>
                    <p class="text-sm text-gray-600">${visit.approvalNotes || 'No notes'}</p>
                    <button onclick="approveVisit()" class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        Approve Again
                    </button>
                `;
            }

            modal.classList.add('active');
        }

        async function approveVisit() {
            if (!selectedVisit) return;

            const notes = document.getElementById('approvalNotes')?.value || '';
            const admin = prompt('Enter admin name:');
            if (!admin) return;

            try {
                const response = await fetch(`${API_BASE_URL}/${selectedVisit.visitId}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        approvalNotes: notes,
                        approvedBy: admin
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('✓ Property approved successfully! Data saved to approved properties.');
                    closeModal();
                    loadVisits();
                } else {
                    alert('✗ Error: ' + (result.message || 'Failed to approve'));
                }
            } catch (error) {
                alert('✗ Error: ' + error.message);
            }
        }

        async function rejectVisit() {
            if (!selectedVisit) return;

            const notes = prompt('Reason for rejection:');
            if (notes === null) return;

            const admin = prompt('Enter admin name:');
            if (!admin) return;

            try {
                const response = await fetch(`${API_BASE_URL}/${selectedVisit.visitId}/reject`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        approvalNotes: notes,
                        approvedBy: admin
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('✓ Property rejected.');
                    closeModal();
                    loadVisits();
                } else {
                    alert('✗ Error: ' + (result.message || 'Failed to reject'));
                }
            } catch (error) {
                alert('✗ Error: ' + error.message);
            }
        }

        function closeModal() {
            document.getElementById('detailsModal').classList.remove('active');
            selectedVisit = null;
        }

        function showLightbox(imageSrc) {
            document.getElementById('lightboxImage').src = imageSrc;
            document.getElementById('photoLightbox').classList.add('active');
        }

        function closeLightbox() {
            document.getElementById('photoLightbox').classList.remove('active');
        }

        // Load visits on page load
        window.addEventListener('load', loadVisits);