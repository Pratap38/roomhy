lucide.createIcons();
        
        let owner = null;

        // Listen for owner context updates from ownerContextSync.js
        window.addEventListener('owner-session-updated', (event) => {
            owner = event.detail || window.__ownerContext;
            updateHeader(owner);
        });

        function updateHeader(ownerData) {
            if (!ownerData) return;
            if (document.getElementById('headerName')) {
                document.getElementById('headerName').innerText = ownerData.name;
            }
            if (document.getElementById('headerAvatar')) {
                document.getElementById('headerAvatar').innerText = ownerData.name.charAt(0).toUpperCase();
            }
            if (document.getElementById('headerAccountId')) {
                document.getElementById('headerAccountId').innerText = `Account: ${ownerData.loginId || ownerData.ownerId}`;
            }
        }

        // Auth check (prefer per-tab owner session)
        document.addEventListener('DOMContentLoaded', () => {
            if (!owner) {
                owner = window.__ownerContext || (typeof getCurrentOwner === 'function' ? getCurrentOwner() : null);
            }
            if (!owner) {
                window.location.href = '/propertyowner/ownerlogin';
                return;
            }
            updateHeader(owner);
        });

        // Mobile menu handlers
        document.getElementById('mobile-menu-open').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.remove('hidden');
        });

        document.getElementById('close-mobile-menu').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('mobile-menu-overlay').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        // Logout handler (per-tab)
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            try { sessionStorage.removeItem('owner_session'); sessionStorage.removeItem('user'); } catch(_) {}
            try { localStorage.removeItem('user'); } catch(_) {}
            window.location.href = '/propertyowner/ownerlogin';
        });