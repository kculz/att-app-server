const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Supervision = require('../models/SupervisionSchema');

const chatController = {
  // Create a new chat for a supervision
  createChat: async (req, res) => {
    try {
      const { supervisionId } = req.body;
      const userId = req.user.id;

      // Verify supervision exists and user is part of it
      const supervision = await Supervision.findById(supervisionId);
      if (!supervision) {
        return res.status(404).json({ message: 'Supervision not found' });
      }

      if (supervision.student.toString() !== userId && supervision.supervisor.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Check if chat already exists
      const existingChat = await Chat.findOne({ supervision: supervisionId });
      if (existingChat) {
        return res.status(400).json({ message: 'Chat already exists for this supervision' });
      }

      // Create new chat
      const newChat = new Chat({
        supervision: supervisionId,
        messages: [],
        lastActivity: Date.now(),
        status: 'active',
      });

      await newChat.save();
      return res.status(201).json(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // Get chat by ID
  getChat: async (req, res) => {
    try {
      const chatId = req.params.id;
      const userId = req.user.id;

      const chat = await Chat.findById(chatId)
        .populate({
          path: 'messages',
          model: 'Message',
          populate: {
            path: 'sender',
            model: 'User',
            select: 'name avatar',
          },
        })
        .populate({
          path: 'supervision',
          model: 'Supervision',
          populate: [
            { path: 'student', model: 'User', select: 'name avatar' },
            { path: 'supervisor', model: 'User', select: 'name avatar' },
          ],
        });

      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Verify user is part of this supervision
      const supervision = chat.supervision;
      if (supervision.student._id.toString() !== userId && supervision.supervisor._id.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Mark messages as read if sent by the other user
      const unreadMessages = chat.messages.filter(
        (msg) => !msg.isRead && msg.sender._id.toString() !== userId
      );

      if (unreadMessages.length > 0) {
        await Message.updateMany(
          { _id: { $in: unreadMessages.map((msg) => msg._id) } },
          { $set: { isRead: true } }
        );

        // Notify the other user that messages have been read
        const otherUserId =
          supervision.student._id.toString() === userId
            ? supervision.supervisor._id.toString()
            : supervision.student._id.toString();

        if (connections.has(otherUserId)) {
          const readData = {
            type: 'messages_read',
            chatId: chat._id,
            messageIds: unreadMessages.map((msg) => msg._id),
          };

          connections.get(otherUserId).forEach((conn) => {
            if (conn.readyState === WebSocket.OPEN) {
              conn.send(JSON.stringify(readData));
            }
          });
        }
      }

      return res.json(chat);
    } catch (error) {
      console.error('Error getting chat:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = chatController;