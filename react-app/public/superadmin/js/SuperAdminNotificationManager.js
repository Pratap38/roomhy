/**
 * SuperAdminNotificationManager.js
 * Unified superadmin notifications: bell dropdown, popup, sound, browser alerts, sidebar badges.
 */

class SuperAdminNotificationManager {
    constructor() {
        this.API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';

        this.notificationSound = null;
        this.pollingInterval = null;
        this.pollingFrequency = 5000;
        this.unreadCount = 0;
        this.notifications = [];
        this.notificationCallbacks = {};
        this.knownIds = new Set();

        this.initializeAudioContext();
        document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
    }

    initializeAudioContext() {
        try {
            this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio context init failed:', e.message);
        }
    }

    resumeAudioContext() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.notificationSound.state === 'suspended') {
                this.notificationSound.resume().catch(() => {});
            }
        } catch (e) {
            console.warn('Audio context resume failed:', e.message);
        }
    }

    playSound() {
        this.resumeAudioContext();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playSoundDirect(), i * 350);
        }
    }

    playSoundDirect() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this.notificationSound;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.28);
            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {
            console.warn('Notification sound failed:', e.message);
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            return false;
        }
    }

    showBrowserNotification(title, options) {
        if (Notification.permission !== 'granted') return;
        try {
            const n = new Notification(title, {
                body: options.body || '',
                icon: options.icon || '/favicon.ico',
                tag: options.tag || 'roomhy-notification',
                requireInteraction: true
            });
            n.onclick = () => {
                window.focus();
                n.close();
            };
            setTimeout(() => n.close(), 6000);
        } catch (e) {
            console.warn('Browser notification failed:', e.message);
        }
    }

    showInPagePopup(title, message) {
        const popup = document.createElement('div');
        popup.className = 'fixed top-4 right-4 z-[9999] bg-slate-900 text-white shadow-lg rounded-lg border border-slate-700 px-4 py-3 max-w-sm';
        popup.innerHTML = `
            <div class="flex items-start gap-3">
                <i data-lucide="bell-ring" class="w-5 h-5 text-yellow-300 mt-0.5"></i>
                <div>
                    <p class="text-sm font-semibold">${title}</p>
                    <p class="text-xs text-slate-200 mt-1">${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => popup.remove(), 4500);
    }

    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.fetchNotifications();
        this.pollingInterval = setInterval(() => this.fetchNotifications(), this.pollingFrequency);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async fetchNotifications() {
        try {
            const res = await fetch(`${this.API_URL}/api/notifications?unread=true&toLoginId=superadmin`);
            const payload = await res.json();
            const list = Array.isArray(payload)
                ? payload
                : (Array.isArray(payload.notifications) ? payload.notifications : []);

            const newNotifs = list.filter((n) => n && n._id && !this.knownIds.has(n._id));
            if (newNotifs.length > 0) {
                newNotifs.forEach((n) => this.knownIds.add(n._id));
                newNotifs.forEach((n) => this.handleNewNotification(n));

                const latest = newNotifs[0];
                const title = this.getNotificationTitle(latest.type);
                const body = this.getNotificationBody(latest);
                this.playSound();
                this.showBrowserNotification(title, { body, tag: `roomhy-${latest.type || 'notification'}` });
                this.showInPagePopup(title, body);
            }

            this.unreadCount = list.length;
            this.notifications = list;
            this.updateBellBadge();
            this.updateSidebarBadges();
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    handleNewNotification(notification) {
        if (this.notificationCallbacks[notification.type]) this.notificationCallbacks[notification.type](notification);
        if (this.notificationCallbacks['*']) this.notificationCallbacks['*'](notification);
        this.addNotificationToDropdown(notification);
    }

    onNotification(type, callback) {
        this.notificationCallbacks[type] = callback;
    }

    updateBellBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : String(this.unreadCount);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    addNotificationToDropdown(notification) {
        const list = document.getElementById('notificationList');
        if (!list) return;
        const ts = new Date(notification.createdAt || Date.now()).toLocaleString();
        const html = `
            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0" data-id="${notification._id}">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">${this.getNotificationIcon(notification.type)}</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900">${this.getNotificationTitle(notification.type)}</p>
                        <p class="text-xs text-gray-600 mt-1">${this.getNotificationBody(notification)}</p>
                        <p class="text-xs text-gray-400 mt-2">${ts}</p>
                    </div>
                    ${!notification.read ? '<span class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></span>' : ''}
                </div>
            </div>
        `;

        const emptyState = list.querySelector('.px-4.py-8');
        if (emptyState) emptyState.remove();
        list.insertAdjacentHTML('afterbegin', html);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const items = list.querySelectorAll('[data-id]');
        if (items.length > 20) items[items.length - 1].remove();
    }

    getNotificationIcon(type) {
        const icons = {
            new_booking: '<i data-lucide="calendar-check" class="w-5 h-5 text-blue-500"></i>',
            new_enquiry: '<i data-lucide="help-circle" class="w-5 h-5 text-green-500"></i>',
            new_signup: '<i data-lucide="user-plus" class="w-5 h-5 text-amber-500"></i>'
        };
        return icons[type] || '<i data-lucide="bell" class="w-5 h-5 text-gray-500"></i>';
    }

    getNotificationTitle(type) {
        const titles = {
            new_booking: 'New Booking',
            new_enquiry: 'New Enquiry',
            new_signup: 'New Signup'
        };
        return titles[type] || 'Notification';
    }

    getNotificationBody(notification) {
        const meta = notification.meta || {};
        if (notification.type === 'new_booking') {
            return `Property: ${meta.propertyName || 'Unknown'} | Guest: ${meta.guestName || meta.userName || 'Unknown'}`;
        }
        if (notification.type === 'new_enquiry') {
            return `${meta.userName || 'Someone'} enquired about ${meta.propertyName || 'a property'}`;
        }
        if (notification.type === 'new_signup') {
            return `${meta.firstName || meta.userName || 'A user'} signed up (${meta.email || 'no email'})`;
        }
        return notification.from || 'New notification';
    }

    updateSidebarBadges() {
        const counts = { new_booking: 0, new_enquiry: 0, new_signup: 0 };
        this.notifications.forEach((n) => {
            if (counts[n.type] !== undefined) counts[n.type] += 1;
        });
        this.upsertSidebarBadge('booking', counts.new_booking);
        this.upsertSidebarBadge('enquiry', counts.new_enquiry);
        this.upsertSidebarBadge('new_signups', counts.new_signup);
    }

    upsertSidebarBadge(hrefPart, count) {
        const links = Array.from(document.querySelectorAll('a.sidebar-link')).filter((a) =>
            (a.getAttribute('href') || '').includes(hrefPart)
        );
        links.forEach((link) => {
            let badge = link.querySelector('.sa-live-badge');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'sa-live-badge ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-500 text-white';
                    link.appendChild(badge);
                }
                badge.textContent = count > 99 ? '99+' : String(count);
            } else if (badge) {
                badge.remove();
            }
        });
    }

    async markAllAsRead() {
        try {
            await fetch(`${this.API_URL}/api/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toLoginId: 'superadmin', toRole: 'superadmin' })
            });
            this.unreadCount = 0;
            this.notifications = [];
            this.updateBellBadge();
            this.updateSidebarBadges();
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = `
                    <div class="px-4 py-8 text-center text-gray-400">
                        <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                        <p>No notifications yet</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    async clearAll() {
        try {
            await fetch(`${this.API_URL}/api/notifications/delete-read?toLoginId=superadmin`, { method: 'DELETE' });
            this.unreadCount = 0;
            this.notifications = [];
            this.updateBellBadge();
            this.updateSidebarBadges();
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = `
                    <div class="px-4 py-8 text-center text-gray-400">
                        <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                        <p>No notifications yet</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }
}

window.superAdminNotificationManager = null;

