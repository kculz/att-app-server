const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Supervision = require('../models/SupervisionSchema');

// User authentication middleware for WebSocket connections
const authenticateWsUser = (request) => {
  try {
    const token = url.parse(request.url, true).query.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    return null;
  }
};

// Store active connections
const connections = new Map();

// Initialize WebSocket server
const initializeWebSockets = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, request) => {
    const userId = authenticateWsUser(request);
    if (!userId) {
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Store connection with userId
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId).add(ws);

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const { chatId, content } = JSON.parse(message);

        // Save message to database
        const chat = await Chat.findById(chatId);
        if (!chat) {
          ws.send(JSON.stringify({ error: 'Chat not found' }));
          return;
        }

        // Check if user is part of this supervision
        const supervision = await Supervision.findById(chat.supervision);
        if (!supervision || (supervision.student.toString() !== userId && supervision.supervisor.toString() !== userId)) {
          ws.send(JSON.stringify({ error: 'Unauthorized access to chat' }));
          return;
        }

        // Create and save new message
        const newMessage = new Message({
          sender: userId,
          content,
          timestamp: Date.now(),
          isRead: false,
        });
        await newMessage.save();

        // Update chat with new message and last activity
        chat.messages.push(newMessage._id);
        chat.lastActivity = Date.now();
        await chat.save();

        // Determine recipient
        const recipientId =
          supervision.student.toString() === userId
            ? supervision.supervisor.toString()
            : supervision.student.toString();

        // Prepare message for broadcast
        const messageData = {
          type: 'new_message',
          message: {
            _id: newMessage._id,
            sender: userId,
            content,
            timestamp: newMessage.timestamp,
            isRead: false,
          },
          chatId,
        };

        // Send to sender for confirmation
        ws.send(JSON.stringify(messageData));

        // Broadcast to recipient if online
        if (connections.has(recipientId)) {
          connections.get(recipientId).forEach((conn) => {
            if (conn.readyState === WebSocket.OPEN) {
              conn.send(JSON.stringify(messageData));
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ error: 'Error processing message' }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (connections.has(userId)) {
        connections.get(userId).delete(ws);
        if (connections.get(userId).size === 0) {
          connections.delete(userId);
        }
      }
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', userId }));
  });

  return wss;
};

module.exports = { initializeWebSockets };