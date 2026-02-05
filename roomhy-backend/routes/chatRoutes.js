const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// In-memory chat rooms storage (for demo - should be MongoDB in production)
const chatRoomsDB = new Map();

// Create a new chat room
router.post('/create', (req, res) => {
    try {
        const { bookingId, userName, userEmail, ownerId } = req.body;

        if (!bookingId || !userName || !userEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: bookingId, userName, userEmail' 
            });
        }

        // Check if chat room already exists
        if (chatRoomsDB.has(bookingId)) {
            return res.status(200).json({ 
                success: true, 
                message: 'Chat room already exists',
                data: chatRoomsDB.get(bookingId) 
            });
        }

        // Create chat room object
        const chatRoom = {
            id: bookingId,
            bookingId: bookingId,
            ownerId: ownerId || 'unknown',
            userName: userName,
            userEmail: userEmail,
            createdAt: new Date().toISOString(),
            messages: []
        };

        // Store in memory
        chatRoomsDB.set(bookingId, chatRoom);
        
        console.log('✅ Chat room created:', chatRoom);

        res.status(201).json({ 
            success: true, 
            message: 'Chat room created successfully',
            data: chatRoom 
        });

    } catch (error) {
        console.error('Error creating chat room:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating chat room',
            error: error.message 
        });
    }
});

// Get all chat rooms for a user (by email)
router.get('/rooms', (req, res) => {
    try {
        const { user_email } = req.query;
        
        if (!user_email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing user_email query parameter' 
            });
        }

        // Find all chat rooms where user is participant
        const userRooms = [];
        chatRoomsDB.forEach((room, bookingId) => {
            if (room.userEmail === user_email || room.ownerId === user_email) {
                userRooms.push(room);
            }
        });

        console.log(`📋 Found ${userRooms.length} chat rooms for user: ${user_email}`);

        res.status(200).json({ 
            success: true, 
            data: userRooms 
        });

    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching chat rooms',
            error: error.message 
        });
    }
});

// Get messages for a room
router.get('/messages/:room_id', chatController.getMessages);

// Mark messages as read
router.post('/mark-read/:room_id', chatController.markAsRead);

// Get unread count
router.get('/unread/:room_id', chatController.getUnreadCount);

// Delete a message
router.delete('/message/:message_id', chatController.deleteMessage);

module.exports = router;
