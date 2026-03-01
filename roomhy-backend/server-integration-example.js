/**
 * CHAT SYSTEM - SERVER INTEGRATION EXAMPLE
 * This shows how to integrate chat into your Express server
 * 
 * Location: roomhy-backend/server.js (or equivalent)
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import models
const ChatRoom = require('./models/ChatRoom');
const ChatMessage = require('./models/ChatMessage');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5001', '*'], // Adjust for your frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../roomhy-frontend')));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/roomhy';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// ============================================
// SOCKET.IO INTEGRATION
// ============================================

// Import socket handler
const initializeSocket = require('./socket/socket');

// Initialize socket with io and models
initializeSocket(io, ChatRoom, ChatMessage);

console.log('✓ Socket.IO initialized with chat handlers');

// ============================================
// REST API ENDPOINTS (Optional but useful)
// ============================================

/**
 * GET /api/chat/rooms/:user_id
 * Get all chat rooms for a user
 */
app.get('/api/chat/rooms/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Find rooms where user is a participant
    const rooms = await ChatRoom.find({
      participants: user_id
    })
    .sort({ updated_at: -1 })
    .select('room_id receiver_login_id escalation_level last_message last_message_time')
    .lean();
    
    res.json({
      success: true,
      data: rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
});

/**
 * GET /api/chat/history/:room_id
 * Get message history for a room
 */
app.get('/api/chat/history/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;
    const { limit = 100, skip = 0 } = req.query;
    
    // Get message history
    const messages = await ChatMessage.find({ room_id })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    // Reverse to get chronological order
    const reversedMessages = messages.reverse();
    
    res.json({
      success: true,
      data: reversedMessages,
      count: reversedMessages.length,
      total: await ChatMessage.countDocuments({ room_id })
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

/**
 * GET /api/chat/room/:room_id
 * Get room details
 */
app.get('/api/chat/room/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;
    
    const room = await ChatRoom.findOne({ room_id }).lean();
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message
    });
  }
});

/**
 * POST /api/chat/clear/:room_id
 * Clear chat history (admin only)
 */
app.post('/api/chat/clear/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;
    const { user_role } = req.body;
    
    // Only super admin can clear
    if (user_role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can clear chat'
      });
    }
    
    // Delete all messages in room
    await ChatMessage.deleteMany({ room_id });
    
    // Update room
    await ChatRoom.findOneAndUpdate(
      { room_id },
      {
        last_message: null,
        last_message_time: null,
        last_message_sender: null
      }
    );
    
    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat',
      error: error.message
    });
  }
});

/**
 * GET /api/chat/stats/:room_id
 * Get chat statistics
 */
app.get('/api/chat/stats/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;
    
    const messageCount = await ChatMessage.countDocuments({ room_id });
    const room = await ChatRoom.findOne({ room_id }).lean();
    
    // Count messages by role
    const roleStats = await ChatMessage.aggregate([
      { $match: { room_id } },
      {
        $group: {
          _id: '$sender_role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        room_id,
        total_messages: messageCount,
        escalation_level: room?.escalation_level || 0,
        participant_count: room?.participants?.length || 0,
        messages_by_role: roleStats,
        created_at: room?.created_at,
        last_activity: room?.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * POST /api/chat/initialize
 * Initialize a chat room (optional - socket.js handles this)
 */
app.post('/api/chat/initialize', async (req, res) => {
  try {
    const { receiver_login_id, user_id, user_name, user_role } = req.body;
    
    if (!receiver_login_id) {
      return res.status(400).json({
        success: false,
        message: 'receiver_login_id is required'
      });
    }
    
    // Check if room exists
    let room = await ChatRoom.findOne({ room_id: receiver_login_id });
    
    if (!room) {
      // Create new room
      room = await ChatRoom.create({
        room_id: receiver_login_id,
        receiver_login_id: receiver_login_id,
        participants: [user_id],
        escalation_level: 0
      });
    } else {
      // Add participant if not exists
      if (!room.participants.includes(user_id)) {
        room.participants.push(user_id);
        await room.save();
      }
    }
    
    // Load message history
    const messages = await ChatMessage.find({ room_id: receiver_login_id })
      .sort({ created_at: 1 })
      .limit(100);
    
    res.json({
      success: true,
      data: {
        room: room,
        messages: messages,
        message: 'Room initialized successfully'
      }
    });
  } catch (error) {
    console.error('Error initializing chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize chat',
      error: error.message
    });
  }
});

/**
 * DELETE /api/chat/room/:room_id
 * Delete entire chat room (admin only)
 */
app.delete('/api/chat/room/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;
    const { user_role } = req.body;
    
    // Only super admin can delete
    if (user_role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete chat room'
      });
    }
    
    // Delete all messages
    await ChatMessage.deleteMany({ room_id });
    
    // Delete room
    await ChatRoom.findOneAndDelete({ room_id });
    
    res.json({
      success: true,
      message: 'Chat room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chat server is running',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/chat/health
 * Chat system health check
 */
app.get('/api/chat/health', async (req, res) => {
  try {
    // Check MongoDB
    const mongoHealth = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Socket.IO
    const socketHealth = io ? 'connected' : 'disconnected';
    
    // Get basic stats
    const roomCount = await ChatRoom.countDocuments();
    const messageCount = await ChatMessage.countDocuments();
    
    res.json({
      success: true,
      chat_system: {
        mongodb: mongoHealth,
        socket_io: socketHealth,
        status: mongoHealth === 'connected' && socketHealth === 'connected' ? 'healthy' : 'degraded'
      },
      statistics: {
        total_rooms: roomCount,
        total_messages: messageCount,
        active_connections: io.engine.clientsCount || 0
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      chat_system: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error'
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ROOMHY CHAT SERVER RUNNING ✓         ║');
  console.log(`║   http://localhost:${PORT}                     ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║   Socket.IO Endpoint: /socket.io       ║');
  console.log('║   API Base: /api/chat                  ║');
  console.log('║   Health Check: /api/health            ║');
  console.log('╚════════════════════════════════════════╝\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✓ MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };
