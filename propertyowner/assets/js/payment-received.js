const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';

        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#\?/, ''));
        const rentId = params.get('rentId') || hashParams.get('rentId') || '';
        const ownerLoginId = (params.get('ownerLoginId') || hashParams.get('ownerLoginId') || '').toUpperCase();

        const statusBox = document.getElementById('statusBox');
        const receivedBtn = document.getElementById('receivedBtn');

        function setStatus(message, type) {
            statusBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-yellow-100', 'text-yellow-800');
            if (type === 'success') statusBox.classList.add('bg-green-100', 'text-green-800');
            else if (type === 'error') statusBox.classList.add('bg-red-100', 'text-red-800');
            else statusBox.classList.add('bg-yellow-100', 'text-yellow-800');
            statusBox.textContent = message;
        }

        function fillDetails(rent) {
            document.getElementById('tenantName').textContent = rent.tenantName || '-';
            document.getElementById('tenantLoginId').textContent = rent.tenantLoginId || '-';
            document.getElementById('tenantEmail').textContent = rent.tenantEmail || '-';
            document.getElementById('propertyName').textContent = rent.propertyName || '-';
            document.getElementById('roomNumber').textContent = rent.roomNumber || '-';
            document.getElementById('amount').textContent = `INR ${Number(rent.totalDue || rent.rentAmount || 0).toLocaleString('en-IN')}`;
            document.getElementById('status').textContent = rent.cashRequestStatus || rent.paymentStatus || 'pending';
        }

        async function loadRentDetails() {
            if (!rentId || !ownerLoginId) {
                setStatus('Invalid link. rentId or ownerLoginId missing.', 'error');
                receivedBtn.disabled = true;
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/rents/${encodeURIComponent(rentId)}`);
                const data = await res.json();
                if (!res.ok || !data.success || !data.rent) {
                    throw new Error(data.error || 'Unable to load payment details');
                }
                const rent = data.rent;
                fillDetails(rent);
                if ((rent.ownerLoginId || '').toUpperCase() !== ownerLoginId) {
                    setStatus('This link is not authorized for this owner.', 'error');
                    receivedBtn.disabled = true;
                    return;
                }
                if (rent.cashRequestStatus === 'paid' || rent.paymentStatus === 'paid') {
                    setStatus('This payment is already marked as paid.', 'success');
                    receivedBtn.disabled = true;
                }
            } catch (err) {
                setStatus(err.message || 'Failed to load details', 'error');
                receivedBtn.disabled = true;
            }
        }

        receivedBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            receivedBtn.disabled = true;
            setStatus('Sending OTP to tenant Gmail...', 'info');
            try {
                const res = await fetch(`${API_URL}/api/rents/cash/owner-received`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rentId, ownerLoginId })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to mark as received');
                }
                setStatus('OTP sent to tenant Gmail successfully.', 'success');
                await loadRentDetails();
            } catch (err) {
                setStatus(err.message || 'Failed to send OTP', 'error');
                receivedBtn.disabled = false;
            }
        });

        loadRentDetails();
