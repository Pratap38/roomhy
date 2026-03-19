/**
 * ChatManager.js - Chat and messaging utilities
 */

const ChatManager = {
    /**
     * Generate a website user login ID from an email address
     * @param {string} email - User email
     * @returns {string} - Generated login ID
     */
    generateWebsiteUserLoginId: function(email) {
        if (!email) return null;

        // Generate a 6-digit random number for uniqueness
        const sixDigit = Math.floor(Math.random() * 900000) + 100000;

        // Create login ID as "ROOMHYWEB" followed by 6 digits
        const loginId = `ROOMHYWEB${sixDigit}`;

        return loginId;
    },

    /**
     * Generate a property owner login ID
     * @returns {string} - Generated owner login ID
     */
    generateOwnerLoginId: function() {
        // Generate a 4-digit random number for uniqueness
        const fourDigit = Math.floor(Math.random() * 9000) + 1000;

        // Create login ID as "ROOMHY" followed by 4 digits
        const loginId = `ROOMHY${fourDigit}`;

        return loginId;
    },

    /**
     * Generate a chat room ID from participants
     * @param {array} participants - Array of participant login IDs
     * @returns {string} - Generated room ID
     */
    generateRoomId: function(participants = []) {
        if (!participants || participants.length === 0) {
            return `room_${Date.now()}`;
        }
        
        // Sort participants to ensure consistent room IDs
        const sorted = [...participants].sort();
        const combined = sorted.join('_');
        
        // Create hash of combined string
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `room_${Math.abs(hash)}`;
    },

    /**
     * Format timestamp to readable date
     * @param {number|string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted date string
     */
    formatTimestamp: function(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    },

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml: function(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Create a new chat message object
     * @param {object} options - Message options
     * @returns {object} - Message object
     */
    createMessage: function(options = {}) {
        return {
            id: options.id || `msg_${Date.now()}`,
            senderId: options.senderId || '',
            senderName: options.senderName || 'Anonymous',
            senderRole: options.senderRole || 'user',
            content: options.content || '',
            timestamp: options.timestamp || new Date().toISOString(),
            type: options.type || 'text', // text, image, file, etc.
            status: options.status || 'sent', // sent, delivered, read
            metadata: options.metadata || {}
        };
    },

    /**
     * Check if user has permission for action
     * @param {string} userRole - User's role
     * @param {string} action - Action to perform
     * @returns {boolean} - True if permitted
     */
    hasPermission: function(userRole, action) {
        const permissions = {
            admin: ['send', 'receive', 'delete', 'edit', 'pin', 'ban'],
            property_owner: ['send', 'receive', 'delete', 'edit'],
            tenant: ['send', 'receive'],
            user: ['send', 'receive']
        };
        
        const userPermissions = permissions[userRole] || permissions.user;
        return userPermissions.includes(action);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
}
