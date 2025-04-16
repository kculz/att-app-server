const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const callController = require('./supervisionCall');
const chatController = require('./chat');

class WebSocketServer {
  constructor(server) {
    if (WebSocketServer.instance) {
      return WebSocketServer.instance;
    }
    
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: (info, done) => {
        try {
          const token = new URL(info.req.url, 'ws://localhost').searchParams.get('token');
          if (!token) {
            console.log('WebSocket connection rejected: No token provided');
            return done(false, 401, 'Authentication token required');
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          info.req.user = decoded;
          done(true);
        } catch (error) {
          console.log('WebSocket connection rejected: Invalid token', error.message);
          done(false, 401, 'Invalid authentication token');
        }
      }
    });
    
    this.connections = new Map();
    this.setupConnectionHandlers();
    
    callController.setEmitFunction((userId, type, data) => {
      this.broadcastToUser(userId, { type, ...data });
    });
    
    WebSocketServer.instance = this;
  }

  static getInstance() {
    if (!WebSocketServer.instance) {
      throw new Error('WebSocketServer not initialized');
    }
    return WebSocketServer.instance;
  }

  setupConnectionHandlers() {
    this.wss.on('connection', (ws, req) => {
      const user = req.user;
      console.log(`New WebSocket connection for user: ${user.id}`);

      if (!this.connections.has(user.id)) {
        this.connections.set(user.id, new Set());
      }
      this.connections.get(user.id).add(ws);

      this.sendMessage(ws, {
        type: 'connection_established',
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // Fixed: Using arrow function to maintain proper 'this' context
      ws.on('message', (message) => {
        this.handleMessage(ws, user, message);
      });

      ws.on('close', () => this.cleanupConnection(user.id, ws));
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);
        this.cleanupConnection(user.id, ws);
      });
    });
  }

  async handleMessage(ws, user, message) {
    try {
      const data = this.parseMessage(message);
      console.log(`Message from ${user.id}:`, data);

      switch(data.type) {
        case 'chat_message':
          await this.handleChatMessage(user, data);
          break;
        case 'call_initiate':
          await this.handleCallInitiation(user, data);
          break;
        case 'call_join':
          await this.handleCallJoin(user, data);
          break;
        case 'call_end':
          await this.handleCallEnd(user, data);
          break;
        case 'call_reject':
          await this.handleCallReject(user, data);
          break;
        case 'webrtc_offer':
          await this.handleWebRTCOffer(user, data);
          break;
        case 'webrtc_answer':
          await this.handleWebRTCAnswer(user, data);
          break;
        case 'webrtc_ice_candidate':
          await this.handleWebRTCICECandidate(user, data);
          break;
        case 'presence_update':
          this.handlePresenceUpdate(user, data);
          break;
        default:
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      this.sendError(ws, error.message);
    }
  }

  parseMessage(message) {
    try {
      const messageString = message.toString();
      return JSON.parse(messageString);
    } catch (error) {
      throw new Error('Invalid message format - must be valid JSON');
    }
  }

  sendMessage(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, message) {
    this.sendMessage(ws, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  async handleChatMessage(sender, data) {
    const { chatId, content, recipientId } = data;
    
    if (!chatId || !content || !recipientId) {
      throw new Error('Missing required fields for chat message');
    }

    const req = {
      user: { id: sender.id },
      params: { id: chatId },
      body: { content, recipientId }
    };

    const res = {
      status: (code) => ({
        json: (response) => {
          if (code === 201) {
            this.broadcastToUser(recipientId, {
              type: 'chat_message',
              from: sender.id,
              content: response.content,
              timestamp: response.timestamp,
              chatId
            });
          }
        }
      })
    };

    await chatController.sendMessage(req, res);
  }

  async handleCallInitiation(sender, data) {
    const { studentId, callId, supervisionId, callData } = data;
    
    if (!studentId || !callId || !supervisionId) {
      throw new Error('Missing required fields for call initiation');
    }

    const req = {
      user: { id: sender.id },
      body: { studentId, callId, supervisionId, callData }
    };

    const res = {
      status: (code) => ({
        json: (response) => {
          if (code === 200) {
            this.broadcastToUser(studentId, {
              type: 'incoming_call',
              callId,
              supervisionId,
              callData: response.callData
            });
          }
        }
      })
    };

    await callController.initiateCall(req, res);
  }

  async handleCallJoin(user, data) {
    const { callId } = data;
    
    if (!callId) {
      throw new Error('Missing callId for call join');
    }

    const req = {
      user: { id: user.id },
      params: { callId }
    };

    const res = {
      status: (code) => ({
        json: (response) => {
          if (code === 200) {
            const otherUserId = response.callData.participants.supervisor.id === user.id 
              ? response.callData.participants.student.id 
              : response.callData.participants.supervisor.id;
            
            this.broadcastToUser(otherUserId, {
              type: 'user_joined',
              callId,
              userId: user.id
            });
          }
        }
      })
    };

    await callController.joinCall(req, res);
  }

  async handleCallEnd(user, data) {
    const { callId } = data;
    
    if (!callId) {
      throw new Error('Missing callId for call end');
    }

    const req = {
      user: { id: user.id },
      params: { callId }
    };

    const res = {
      status: (code) => ({
        json: (response) => {
          if (code === 200) {
            const otherUserId = response.call.supervisor._id.toString() === user.id 
              ? response.call.student._id.toString() 
              : response.call.supervisor._id.toString();
            
            this.broadcastToUser(otherUserId, {
              type: 'call_ended',
              callId,
              endedBy: user.id
            });
          }
        }
      })
    };

    await callController.endCall(req, res);
  }

  async handleCallReject(user, data) {
    const { callId } = data;
    
    if (!callId) {
      throw new Error('Missing callId for call rejection');
    }

    const req = {
      user: { id: user.id },
      params: { callId }
    };

    const res = {
      status: (code) => ({
        json: (response) => {
          if (code === 200) {
            const otherUserId = response.call.supervisor._id.toString() === user.id 
              ? response.call.student._id.toString() 
              : response.call.supervisor._id.toString();
            
            this.broadcastToUser(otherUserId, {
              type: 'call_rejected',
              callId,
              rejectedBy: user.id
            });
          }
        }
      })
    };

    await callController.rejectCall(req, res);
  }

  async handleWebRTCOffer(sender, data) {
    const { recipientId, offer, callId } = data;
    this.broadcastToUser(recipientId, {
      type: 'webrtc_offer',
      senderId: sender.id,
      offer,
      callId,
      timestamp: new Date().toISOString()
    });
  }

  async handleWebRTCAnswer(sender, data) {
    const { recipientId, answer, callId } = data;
    this.broadcastToUser(recipientId, {
      type: 'webrtc_answer',
      senderId: sender.id,
      answer,
      callId,
      timestamp: new Date().toISOString()
    });
  }

  async handleWebRTCICECandidate(sender, data) {
    const { recipientId, candidate, callId } = data;
    this.broadcastToUser(recipientId, {
      type: 'webrtc_ice_candidate',
      senderId: sender.id,
      candidate,
      callId,
      timestamp: new Date().toISOString()
    });
  }

  handlePresenceUpdate(user, data) {
    console.log(`Presence update from ${user.id}:`, data.status);
    this.broadcastToUser(user.id, {
      type: 'presence_update',
      userId: user.id,
      status: data.status,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToUser(userId, message) {
    if (this.connections.has(userId)) {
      const messageString = JSON.stringify(message);
      this.connections.get(userId).forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  }

  cleanupConnection(userId, ws) {
    if (this.connections.has(userId)) {
      this.connections.get(userId).delete(ws);
      if (this.connections.get(userId).size === 0) {
        this.connections.delete(userId);
      }
    }
  }
}

module.exports = { WebSocketServer };