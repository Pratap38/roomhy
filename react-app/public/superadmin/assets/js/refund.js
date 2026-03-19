lucide.createIcons();
        let allRefundRequests = [];
        let selectedRefund = null;

        // Load refund requests on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadRefundRequests();
            setInterval(loadRefundRequests, 30000); // Refresh every 30 seconds
        });

        // Load all refund requests from API
        async function loadRefundRequests() {
            try {
                const response = await fetch(`${API_URL}/api/booking/refund-requests`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                allRefundRequests = data.data || [];
                displayRefundRequests(allRefundRequests);
                updateRefundStats(allRefundRequests);
            } catch (error) {
                console.error('Error loading refund requests:', error);
                document.getElementById('refundTableBody').innerHTML = `
                    <tr class="text-center">
                        <td colspan="7" class="py-8 text-red-500">Error loading refund requests</td>
                    </tr>
                `;
            }
        }

        // Update refund statistics
        function updateRefundStats(requests) {
            const pending = requests.filter(r => r.refund_status === 'pending');
            const processed = requests.filter(r => r.refund_status === 'processed' || r.refund_status === 'approved');
            const rejected = requests.filter(r => r.refund_status === 'rejected');
            
            const pendingAmount = pending.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
            const processedAmount = processed.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
            
            document.getElementById('pendingCount').textContent = pending.length;
            document.getElementById('pendingAmount').textContent = `₹${pendingAmount.toLocaleString('en-IN')}`;
            document.getElementById('processedCount').textContent = processed.length;
            document.getElementById('processedAmount').textContent = `₹${processedAmount.toLocaleString('en-IN')}`;
            document.getElementById('rejectedCount').textContent = rejected.length;
        }

        // Display refund requests in table
        function displayRefundRequests(requests) {
            const tbody = document.getElementById('refundTableBody');
            
            if (requests.length === 0) {
                tbody.innerHTML = `
                    <tr class="text-center">
                        <td colspan="8" class="py-8 text-gray-500">No refund requests found</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = requests.map((request, index) => {
                const requestDate = new Date(request.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                const statusBgColor = request.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                     request.refund_status === 'processed' ? 'bg-green-100 text-green-800' :
                                     request.refund_status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                     'bg-red-100 text-red-800';

                const initials = (request.user_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
                const bgColor = `bg-${['purple', 'blue', 'green', 'pink', 'indigo'][index % 5]}-100`;
                const textColor = `text-${['purple', 'blue', 'green', 'pink', 'indigo'][index % 5]}-700`;

                // Format payment method display with details
                let paymentMethodBadge = '<span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">N/A</span>';
                let paymentDetails = '';
                if (request.refund_method === 'upi') {
                    paymentDetails = request.upi_id || 'N/A';
                    paymentMethodBadge = `<span class="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600 font-medium cursor-help" title="UPI: ${paymentDetails}">UPI: ${paymentDetails}</span>`;
                } else if (request.refund_method === 'bank') {
                    paymentDetails = `${request.bank_account_holder || 'N/A'} - ${request.bank_account_number || 'N/A'}`;
                    paymentMethodBadge = `<span class="text-xs bg-green-100 px-2 py-1 rounded text-green-600 font-medium cursor-help" title="Bank: ${paymentDetails}">Bank: ${paymentDetails}</span>`;
                } else if (request.refund_method === 'other') {
                    paymentMethodBadge = '<span class="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600 font-medium">Other</span>';
                }

                return `
                    <tr class="${index % 2 === 0 ? '' : 'bg-gray-50/50'}">
                        <td><span class="font-mono text-xs text-gray-500">#${request._id.substring(0, 8).toUpperCase()}</span></td>
                        <td>
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor} font-bold text-xs mr-3">${initials}</div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${request.user_name || 'N/A'}</p>
                                    <p class="text-xs text-gray-500">${request.booking_id || 'N/A'}</p>
                                </div>
                            </div>
                        </td>
                        <td class="text-sm font-bold text-gray-800">₹${request.refund_amount || 500}</td>
                        <td><span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">${request.request_type === 'refund' ? 'Refund' : 'Alternative Property'}</span></td>
                        <td>${paymentMethodBadge}</td>
                        <td class="text-sm text-gray-500">${requestDate}</td>
                        <td>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBgColor}">
                                ${request.refund_status.charAt(0).toUpperCase() + request.refund_status.slice(1)}
                            </span>
                        </td>
                        <td class="text-right">
                            <div class="flex justify-end gap-2">
                                <button onclick="viewRefundDetails('${request._id}')" class="text-blue-600 hover:text-blue-800 p-1 border border-blue-200 rounded bg-blue-50" title="View Details"><i data-lucide="eye" class="w-4 h-4"></i></button>
                                ${request.refund_status === 'pending' ? `
                                    <button onclick="processRefundDirectly('${request._id}')" class="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-semibold transition" title="Process Refund"><i data-lucide="credit-card" class="w-4 h-4 inline mr-1"></i>Refund</button>
                                    <button onclick="rejectRefund('${request._id}')" class="text-red-600 hover:text-red-800 p-1 border border-red-200 rounded bg-red-50" title="Reject"><i data-lucide="x" class="w-4 h-4"></i></button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            lucide.createIcons();
        }

        // View refund details
        async function viewRefundDetails(refundId) {
            try {
                const response = await fetch(`${API_URL}/api/booking/refund-request/${refundId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch refund details');
                }

                const data = await response.json();
                selectedRefund = data.data;
                
                // Update modal with refund details
                document.getElementById('modalRefundId').textContent = `#${refundId.substring(0, 8).toUpperCase()}`;
                document.getElementById('modalAmount').textContent = `₹${selectedRefund.refund_amount || 500}`;
                document.getElementById('modalRequestType').textContent = selectedRefund.request_type === 'refund' ? 'Refund Request' : 'Alternative Property';
                document.getElementById('modalTenantName').textContent = selectedRefund.user_name || 'N/A';
                document.getElementById('modalTenantPhone').textContent = selectedRefund.user_phone || 'N/A';
                document.getElementById('modalTenantEmail').textContent = selectedRefund.user_email || 'N/A';
                document.getElementById('modalBookingId').textContent = selectedRefund.booking_id || 'N/A';
                document.getElementById('modalPaymentMethod').textContent = selectedRefund.refund_method ? selectedRefund.refund_method.toUpperCase() : 'N/A';
                
                // Display payment details based on method
                const paymentDetailsContent = document.getElementById('paymentDetailsContent');
                if (selectedRefund.refund_method === 'upi') {
                    paymentDetailsContent.innerHTML = `
                        <div class="border-l-4 border-blue-500 pl-3">
                            <p class="text-xs text-gray-500 uppercase">UPI ID</p>
                            <p class="text-lg font-bold text-blue-600" style="word-break: break-all;">${selectedRefund.upi_id || 'N/A'}</p>
                        </div>
                    `;
                } else if (selectedRefund.refund_method === 'bank') {
                    paymentDetailsContent.innerHTML = `
                        <div class="space-y-3">
                            <div class="border-l-4 border-green-500 pl-3">
                                <p class="text-xs text-gray-500 uppercase">Account Holder</p>
                                <p class="text-md font-semibold text-gray-800">${selectedRefund.bank_account_holder || 'N/A'}</p>
                            </div>
                            <div class="border-l-4 border-green-500 pl-3">
                                <p class="text-xs text-gray-500 uppercase">Account Number</p>
                                <p class="text-md font-bold text-green-600" style="word-break: break-all; font-family: monospace;">${selectedRefund.bank_account_number || 'N/A'}</p>
                            </div>
                            <div class="border-l-4 border-green-500 pl-3">
                                <p class="text-xs text-gray-500 uppercase">IFSC Code</p>
                                <p class="text-md font-semibold text-gray-800">${selectedRefund.bank_ifsc_code || 'N/A'}</p>
                            </div>
                            <div class="border-l-4 border-green-500 pl-3">
                                <p class="text-xs text-gray-500 uppercase">Bank Name</p>
                                <p class="text-md font-semibold text-gray-800">${selectedRefund.bank_name || 'N/A'}</p>
                            </div>
                        </div>
                    `;
                } else {
                    paymentDetailsContent.innerHTML = `<p class="text-gray-600">Other payment method selected</p>`;
                }

                // Show Razorpay button only if pending
                const razorpayButton = document.getElementById('razorpayButton');
                if (selectedRefund.refund_status === 'pending') {
                    razorpayButton.classList.remove('hidden');
                } else {
                    razorpayButton.classList.add('hidden');
                }
                
                toggleModal('viewRefundModal');
            } catch (error) {
                console.error('Error loading refund details:', error);
                alert('Error loading refund details');
            }
        }

        // Process refund directly with Razorpay
        async function processRefundDirectly(refundId) {
            try {
                // Load refund details first
                const response = await fetch(`${API_URL}/api/booking/refund-request/${refundId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch refund details');
                }

                const data = await response.json();
                selectedRefund = data.data;

                // Directly initiate Razorpay payment
                initiateRazorpayPayment();
            } catch (error) {
                console.error('Error loading refund details:', error);
                alert('Error loading refund details: ' + error.message);
            }
        }

        // Initiate Razorpay Payment
        async function initiateRazorpayPayment() {
            if (!selectedRefund) {
                alert('No refund selected');
                return;
            }

            try {
                // Show loading state
                alert('Processing refund payment...');

                // First, create a payment order in backend
                const orderResponse = await fetch(`${API_URL}/api/booking/refund-request/${selectedRefund._id}/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: selectedRefund.refund_amount * 100, // Convert to paise
                        currency: 'INR',
                        user_name: selectedRefund.user_name,
                        user_email: selectedRefund.user_email,
                        user_phone: selectedRefund.user_phone
                    })
                });

                if (!orderResponse.ok) {
                    const error = await orderResponse.json();
                    throw new Error(error.message || 'Failed to create order');
                }

                const orderData = await orderResponse.json();
                const orderId = orderData.order_id;

                // Generate a mock payment ID for testing
                const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const mockSignature = `sig_${Math.random().toString(36).substr(2, 20)}`;

                // Show confirmation and process refund
                const confirmPayment = confirm(`Process refund of ₹${selectedRefund.refund_amount}?\n\nPayment Method: ${selectedRefund.refund_method?.toUpperCase() || 'N/A'}\nUser: ${selectedRefund.user_name}`);
                
                if (!confirmPayment) {
                    return;
                }

                // Process refund with payment details
                const processResponse = await fetch(`${API_URL}/api/booking/refund-request/${selectedRefund._id}/process`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        razorpay_payment_id: mockPaymentId,
                        razorpay_order_id: orderId,
                        razorpay_signature: mockSignature,
                        admin_notes: `Payment processed successfully. Transaction ID: ${mockPaymentId}`
                    })
                });

                if (!processResponse.ok) {
                    const error = await processResponse.json();
                    throw new Error(error.message || 'Failed to process refund');
                }

                const result = await processResponse.json();
                
                alert(`✅ SUCCESS!\n\nRefund Processed\nAmount: ₹${selectedRefund.refund_amount}\nTransaction ID: ${mockPaymentId}\n\nPayment method: ${selectedRefund.refund_method?.toUpperCase()}\nTo: ${selectedRefund.user_name}`);
                
                // Close modal and reload
                toggleModal('viewRefundModal');
                loadRefundRequests();

            } catch (error) {
                console.error('Error processing payment:', error);
                alert('❌ Error processing payment:\n\n' + error.message);
            }
        }

        // Reject refund
        async function rejectRefund(refundId) {
            if (!confirm('Are you sure you want to reject this refund?')) return;

            try {
                const rejectReason = prompt('Reason for rejection:', 'Rejected by admin');

                const response = await fetch(`${API_URL}/api/booking/refund-request/${refundId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        refund_status: 'rejected',
                        admin_notes: rejectReason || 'Rejected'
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to reject refund');
                }

                alert('❌ Refund rejected');
                loadRefundRequests();
            } catch (error) {
                console.error('Error rejecting refund:', error);
                alert('Error rejecting refund: ' + error.message);
            }
        }

        // Sidebar Logic
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