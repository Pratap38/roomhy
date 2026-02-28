const ChatMessage = require('../models/ChatMessage');

// Get messages for a specific room (receiver's loginId)
exports.getMessages = async (req, res) => {
  try {
    const { room_id } = req.params;
    
    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }

    const messages = await ChatMessage.find({ room_id })
      .sort({ created_at: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get 1:1 conversation by two login ids (both directions)
exports.getConversation = async (req, res) => {
  try {
    const user1 = String(req.query.user1 || '').trim();
    const user2 = String(req.query.user2 || '').trim();

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'user1 and user2 are required' });
    }

    const user1Variants = [...new Set([user1, user1.toLowerCase(), user1.toUpperCase()])];
    const user2Variants = [...new Set([user2, user2.toLowerCase(), user2.toUpperCase()])];

    const messages = await ChatMessage.find({
      $or: [
        { room_id: { $in: user1Variants }, sender_login_id: { $in: user2Variants } },
        { room_id: { $in: user2Variants }, sender_login_id: { $in: user1Variants } }
      ]
    })
      .sort({ created_at: 1 })
      .limit(200);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { room_id } = req.params;
    
    await ChatMessage.updateMany(
      { room_id, is_read: false },
      { is_read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get unread count for a room
exports.getUnreadCount = async (req, res) => {
  try {
    const { room_id } = req.params;
    
    const count = await ChatMessage.countDocuments({
      room_id,
      is_read: false
    });

    res.json({ unread_count: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a message (optional)
exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    
    await ChatMessage.findByIdAndDelete(message_id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message });
  }
};
