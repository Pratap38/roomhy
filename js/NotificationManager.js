/**
 * NotificationManager.js
 * Handles panel-to-panel notifications with sound and email for owner
 * Supports: Booking Requests, Chat Messages, Complaints
 */

class NotificationManager {
    constructor() {
        this.API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://roomhy-backend-wqwo.onrender.com';
        
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.notificationSound = this.initializeSound();
        this.pollingInterval = null;
        this.pollingFrequency = 5000; // 5 seconds
        this.unreadCounts = {
            bookingRequests: 0,
            chatMessages: 0,
            complaints: 0
        };
        this.lastCheckedTimestamps = {
            bookingRequests: this.getStoredTimestamp('lastBookingCheck') || new Date(),
            chatMessages: this.getStoredTimestamp('lastChatCheck') || new Date(),
            complaints: this.getStoredTimestamp('lastComplaintCheck') || new Date()
        };
        
        this.notificationCallbacks = {};
        
        // Initialize audio context for autoplay restrictions
        this.initializeAudioContext();
        
        // Add page interaction listener to enable audio
        document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
    }
    
    /**
     * Initialize audio context early to prepare for user interaction
     */
    initializeAudioContext() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🎵 Audio context initialized, state:', this.notificationSound.state);
            }
        } catch (e) {
            console.warn('Could not initialize audio context:', e.message);
        }
    }

    /**
     * Initialize notification sound - Create audio context
     */
    initializeSound() {
        try {
            // Create audio context for notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            return audioContext;
        } catch (e) {
            console.log('Audio context not available, will use HTML5 audio');
            return null;
        }
    }

    /**
     * Play notification sound - Multiple methods with persistence for minimized windows
     */
    playSound() {
        console.log('🔔 Playing notification sound...');
        
        // Resume audio context if suspended (important for user interaction requirement)
        this.resumeAudioContext();
        
        // Play multiple times for emphasis (helps with minimized windows)
        this.playSoundSequence(0);
    }

    /**
     * Play sound in sequence for persistence
     */
    playSoundSequence(attempt = 0) {
        if (attempt < 3) { // Play 3 times for emphasis
            this.playSoundDirect();
            
            // Schedule next attempt
            setTimeout(() => {
                this.playSoundSequence(attempt + 1);
            }, 400); // 400ms between attempts
        }
    }

    /**
     * Resume audio context to handle browser autoplay restrictions
     */
    resumeAudioContext() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.notificationSound.state === 'suspended') {
                console.log('⏸️ Audio context suspended, attempting to resume...');
                this.notificationSound.resume().then(() => {
                    console.log('✅ Audio context resumed');
                }).catch(e => {
                    console.warn('Could not resume audio context:', e.message);
                });
            }
        } catch (e) {
            console.warn('Audio context resume failed:', e.message);
        }
    }

    /**
     * Play sound using Web Audio API - Direct method
     */
    playSoundDirect() {
        try {
            // Try Web Audio API first
            this.playSoundWebAudio();
        } catch (e1) {
            console.warn('Web Audio failed, trying HTML5...', e1.message);
            try {
                // Fallback to HTML5 Audio with beep
                this.playSoundHTML5Beep();
            } catch (e2) {
                console.warn('HTML5 beep failed, trying data URI...', e2.message);
                this.playSoundDataURI();
            }
        }
    }

    /**
     * Play sound using Web Audio API with oscillator
     */
    playSoundWebAudio() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume context if suspended
            if (this.notificationSound.state === 'suspended') {
                this.notificationSound.resume();
            }

            const ctx = this.notificationSound;
            const now = ctx.currentTime;
            
            // Create nodes
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Connect
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Configuration - higher frequency and volume for alarm effect
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
            
            // Volume envelope - start loud, fade out
            gain.gain.setValueAtTime(1.0, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            // Play for 250ms
            osc.start(now);
            osc.stop(now + 0.25);
            
            console.log('✅ Web Audio sound played successfully');
        } catch (e) {
            throw new Error('Web Audio API failed: ' + e.message);
        }
    }

    /**
     * Play sound using HTML5 Audio element
     */
    playSoundHTML5Beep() {
        try {
            // Create audio context and buffer for beep
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = audioContext.sampleRate;
            const duration = 0.25; // 250ms
            const samples = sampleRate * duration;
            
            // Create audio buffer
            const buffer = audioContext.createAudioBuffer(1, samples, sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate high-pitched beep
            for (let i = 0; i < samples; i++) {
                const t = i / sampleRate;
                // 1000Hz tone with exponential decay
                data[i] = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 4);
            }
            
            // Play buffer
            const source = audioContext.createBufferSource();
            const gain = audioContext.createGain();
            
            source.buffer = buffer;
            gain.gain.setValueAtTime(1.0, audioContext.currentTime);
            
            source.connect(gain);
            gain.connect(audioContext.destination);
            source.start(0);
            
            console.log('✅ HTML5 Audio beep played');
        } catch (e) {
            throw new Error('HTML5 Audio failed: ' + e.message);
        }
    }

    /**
     * Play sound using data URI (final fallback)
     */
    playSoundDataURI() {
        try {
            // High-quality beep in data URI format
            const beepUrl = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==';
            
            const audio = new Audio(beepUrl);
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.warn('Fallback audio failed:', err);
            });
            
            console.log('✅ Fallback audio element played');
        } catch (e) {
            console.warn('Fallback audio failed:', e.message);
        }
    }

    /**
     * Generate notification tone (legacy - now using multiple methods)
     */
    generateNotificationTone() {
        try {
            // This is kept for backward compatibility
            // Return a simple beep sound data URI
            return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==';
        } catch (e) {
            console.log('Could not generate notification tone:', e);
            return null;
        }
    }

    /**
     * Get timestamp from localStorage
     */
    getStoredTimestamp(key) {
        const stored = localStorage.getItem(key);
        return stored ? new Date(stored) : null;
    }

    /**
     * Update timestamp in localStorage
     */
    updateStoredTimestamp(key) {
        localStorage.setItem(key, new Date().toISOString());
    }

    /**
     * Register callback for specific notification type
     */
    onNotification(type, callback) {
        if (!this.notificationCallbacks[type]) {
            this.notificationCallbacks[type] = [];
        }
        this.notificationCallbacks[type].push(callback);
    }

    /**
     * Trigger notification callbacks
     */
    triggerNotification(type, data) {
        if (this.notificationCallbacks[type]) {
            this.notificationCallbacks[type].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Notification callback error:', e);
                }
            });
        }
    }

    /**
     * Start polling for notifications
     */
    startPolling() {
        if (this.pollingInterval) return; // Already polling
        
        console.log('🔔 Notification polling started');
        this.checkNotifications(); // Check immediately
        
        this.pollingInterval = setInterval(() => {
            this.checkNotifications();
        }, this.pollingFrequency);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('🔔 Notification polling stopped');
        }
    }

    /**
     * Check all notification types
     */
    async checkNotifications() {
        if (!this.user) return;
        
        try {
            await Promise.all([
                this.checkBookingRequests(),
                this.checkChatMessages(),
                this.checkComplaints()
            ]);
        } catch (e) {
            console.error('Error checking notifications:', e);
        }
    }

    /**
     * Check for new booking requests
     */
    async checkBookingRequests() {
        try {
            const response = await fetch(`${this.API_URL}/api/bookings?ownerId=${this.user.loginId}&new=true`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Skip if endpoint doesn't exist (404)
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('ℹ️ Booking notifications endpoint not available');
                }
                return;
            }
            
            const data = await response.json();
            const newBookings = Array.isArray(data) ? data : data.bookings || [];
                
                if (newBookings.length > 0) {
                    const count = newBookings.length;
                    this.unreadCounts.bookingRequests = count;
                    
                    // Only notify if there's new data since last check
                    if (new Date(newBookings[0].createdAt) > this.lastCheckedTimestamps.bookingRequests) {
                        this.playSound();
                        this.sendEmailNotification('Booking Request', 
                            `You have ${count} new booking request(s)`, 
                            newBookings[0]);
                        this.triggerNotification('bookingRequests', {
                            count: count,
                            data: newBookings[0]
                        });
                        this.updateStoredTimestamp('lastBookingCheck');
                    }
                }
        } catch (e) {
            console.log('Error checking booking requests:', e.message);
        }
    }

    /**
     * Check for new chat messages
     */
    async checkChatMessages() {
        try {
            const response = await fetch(`${this.API_URL}/api/messages?receiverId=${this.user.loginId}&unread=true`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Skip if endpoint doesn't exist (404)
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('ℹ️ Chat messages endpoint not available');
                }
                return;
            }
            
            const data = await response.json();
            const unreadMessages = Array.isArray(data) ? data : data.messages || [];
                
                if (unreadMessages.length > 0) {
                    const count = unreadMessages.length;
                    this.unreadCounts.chatMessages = count;
                    
                    if (new Date(unreadMessages[0].timestamp) > this.lastCheckedTimestamps.chatMessages) {
                        this.playSound();
                        this.sendEmailNotification('New Chat Message', 
                            `You have ${count} new message(s)`, 
                            unreadMessages[0]);
                        this.triggerNotification('chatMessages', {
                            count: count,
                            data: unreadMessages[0]
                        });
                        this.updateStoredTimestamp('lastChatCheck');
                    }
                }
        } catch (e) {
            console.log('Error checking chat messages:', e.message);
        }
    }

    /**
     * Check for new complaints
     */
    async checkComplaints() {
        try {
            const response = await fetch(`${this.API_URL}/api/complaints?ownerId=${this.user.loginId}&new=true`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const newComplaints = Array.isArray(data) ? data : data.complaints || [];
                
                if (newComplaints.length > 0) {
                    const count = newComplaints.length;
                    this.unreadCounts.complaints = count;
                    
                    if (new Date(newComplaints[0].createdAt) > this.lastCheckedTimestamps.complaints) {
                        this.playSound();
                        this.sendEmailNotification('New Complaint', 
                            `You have ${count} new complaint(s)`, 
                            newComplaints[0]);
                        this.triggerNotification('complaints', {
                            count: count,
                            data: newComplaints[0]
                        });
                        this.updateStoredTimestamp('lastComplaintCheck');
                    }
                }
            }
        } catch (e) {
            console.log('Error checking complaints:', e.message);
        }
    }

    /**
     * Send email notification to owner
     */
    async sendEmailNotification(subject, message, data) {
        try {
            const response = await fetch(`${this.API_URL}/api/notifications/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ownerEmail: this.user.email || localStorage.getItem('ownerEmail'),
                    subject: `🔔 RoomHy Alert: ${subject}`,
                    message: message,
                    data: data,
                    type: subject
                })
            });
            
            if (response.ok) {
                console.log('📧 Email notification sent');
            }
        } catch (e) {
            console.log('Error sending email notification:', e.message);
        }
    }

    /**
     * Show browser notification (if permitted)
     */
    showBrowserNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '../img/logo.png',
                badge: '../img/logo.png',
                ...options
            });
        }
    }

    /**
     * Get unread counts
     */
    getUnreadCounts() {
        return this.unreadCounts;
    }

    /**
     * Mark as read
     */
    markAsRead(type) {
        if (this.unreadCounts[type] !== undefined) {
            this.unreadCounts[type] = 0;
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    /**
     * Update polling frequency
     */
    setPollingFrequency(ms) {
        this.pollingFrequency = ms;
        if (this.pollingInterval) {
            this.stopPolling();
            this.startPolling();
        }
    }

    /**
     * Manual trigger notification for testing
     */
    testNotification(type) {
        console.log(`🔔 Test notification: ${type}`);
        this.playSound();
        this.showBrowserNotification(`RoomHy ${type} Alert`, {
            body: 'This is a test notification',
            tag: `roomhy-${type}-test`
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
