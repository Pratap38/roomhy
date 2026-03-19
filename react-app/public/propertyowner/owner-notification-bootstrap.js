(function () {
    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function currentPage() {
        try {
            return (window.location.pathname.split('/').pop() || '').toLowerCase();
        } catch (_) {
            return '';
        }
    }

    function shouldSkip() {
        const page = currentPage();
        return page === '/propertyowner/ownerlogin' || page === '/propertyowner/index';
    }

    function scriptLoaded(srcPart) {
        return Array.from(document.scripts).some((s) => (s.src || '').includes(srcPart));
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = Array.from(document.scripts).find((s) => s.src === src);
            if (existing) {
                if (existing.dataset.loaded === '1') return resolve();
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('Script load failed: ' + src)));
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.addEventListener('load', () => {
                script.dataset.loaded = '1';
                resolve();
            });
            script.addEventListener('error', () => reject(new Error('Script load failed: ' + src)));
            document.head.appendChild(script);
        });
    }

    function ensureBellUi() {
        if (document.getElementById('notificationBellBtn') && document.getElementById('notificationDropdown')) {
            return;
        }

        let bellBtn = null;
        const bellIcon = document.querySelector('[data-lucide="bell"]');
        if (bellIcon) {
            bellBtn = bellIcon.closest('button');
        }

        if (!bellBtn) {
            const actionContainer =
                document.querySelector('header .flex.items-center.gap-4') ||
                document.querySelector('header .flex.items-center.gap-3') ||
                document.querySelector('header .flex.items-center');
            if (!actionContainer) return;

            bellBtn = document.createElement('button');
            bellBtn.className = 'p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors';
            bellBtn.innerHTML = '<i data-lucide="bell" class="w-5 h-5"></i>';
            actionContainer.insertBefore(bellBtn, actionContainer.firstChild);
        }

        bellBtn.id = 'notificationBellBtn';
        bellBtn.classList.add('relative');

        let badge = document.getElementById('notificationBadge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'notificationBadge';
            badge.className = 'hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center';
            badge.textContent = '0';
            bellBtn.appendChild(badge);
        }

        let wrapper = bellBtn.parentElement;
        if (!wrapper || !wrapper.classList.contains('relative')) {
            wrapper = document.createElement('div');
            wrapper.className = 'relative';
            bellBtn.parentElement.insertBefore(wrapper, bellBtn);
            wrapper.appendChild(bellBtn);
        }

        if (!document.getElementById('notificationDropdown')) {
            const dropdown = document.createElement('div');
            dropdown.id = 'notificationDropdown';
            dropdown.className = 'hidden absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50';
            dropdown.innerHTML = [
                '<div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">',
                '  <h3 class="font-semibold text-gray-800">Notifications</h3>',
                '  <div class="flex gap-2">',
                '    <button id="notificationSettingsBtn" class="text-xs text-gray-500 hover:text-gray-700">Settings</button>',
                '  </div>',
                '</div>',
                '<div id="notificationList" class="max-h-96 overflow-y-auto custom-scrollbar">',
                '  <div class="px-4 py-8 text-center text-gray-400">',
                '    <p>No notifications yet</p>',
                '  </div>',
                '</div>'
            ].join('');
            wrapper.appendChild(dropdown);
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    async function bootstrap() {
        if (shouldSkip()) return;

        try {
            if (typeof window.NotificationManager === 'undefined' && !scriptLoaded('/js/NotificationManager.js')) {
                await loadScript('../js/NotificationManager.js');
            }

            if (typeof window.PropertyOwnerNotifications === 'undefined' && !scriptLoaded('/js/PropertyOwnerNotifications.js')) {
                await loadScript('../js/PropertyOwnerNotifications.js');
            }

            ensureBellUi();

            if (typeof window.PropertyOwnerNotifications !== 'undefined') {
                if (window.propertyOwnerNotifications && !window.ownerNotifications) {
                    window.ownerNotifications = window.propertyOwnerNotifications;
                }
                if (!window.ownerNotifications) {
                    window.ownerNotifications = new window.PropertyOwnerNotifications();
                }
                window.propertyOwnerNotifications = window.ownerNotifications;
            }
        } catch (err) {
            console.warn('Owner notification bootstrap failed:', err && err.message ? err.message : err);
        }
    }

    onReady(bootstrap);
})();
