async function loadAreaStats() {
            const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');
            const areaCode = user?.areaCode || user?.area || '';
            if (!areaCode) return;

            // Declare elements outside try block
            const elTotal = document.getElementById('totalPropertiesCountArea');
            const elPending = document.getElementById('pendingApprovalsCountArea');
            const elOwners = document.getElementById('activeOwnersCountArea');

            try {
                const backendHost = API_URL;
                const url = `${backendHost}/api/admin/stats?areaCode=${encodeURIComponent(areaCode)}`;

                // Add a timeout to fetch so UI does not hang indefinitely
                const controller = new AbortController();
                const timeout = setTimeout(() => {
                    console.warn('Area stats request timed out after 15 seconds');
                    controller.abort();
                }, 15000); // Increased timeout from 8s to 15s

                let res;
                try {
                    res = await fetch(url, { signal: controller.signal });
                } catch (fetchError) {
                    // Handle abort and network errors
                    if (fetchError.name === 'AbortError') {
                        console.error('Area stats request was aborted (timeout)');
                        throw new Error('Request timeout - backend may be slow or unavailable');
                    }
                    throw fetchError;
                } finally {
                    clearTimeout(timeout);
                }

                if (!res || !res.ok) throw new Error('Stats fetch failed or returned non-OK: ' + (res && res.status));
                const stats = await res.json();
                if (elTotal) elTotal.innerText = stats.totalProperties || 0;
                if (elPending) elPending.innerText = stats.pendingApprovals || stats.enquiryCount || 0;
                if (elOwners) elOwners.innerText = stats.activeOwners || 0;
            } catch (err) {
                console.error('Failed to load area stats:', err && (err.message || err.name || String(err)));
                if (elOwners) elOwners.innerText = 'N/A';
            }
        }

        document.addEventListener('DOMContentLoaded', () => { loadAreaStats(); });