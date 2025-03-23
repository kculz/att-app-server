// controllers/chatController.js
const Chat = require("../models/Chat");
const Supervision = require("../models/SupervisionSchema");
const mongoose = require("mongoose");

// Student controller: Get the student's single chat
exports.getStudentChat = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming user ID is attached by auth middleware
    
    // First find the supervision where the user is a student
    const supervision = await Supervision.findOne({ 
      student: studentId,
      status: "active" 
    });
    
    if (!supervision) {
      return res.status(404).json({ message: "No active supervision found" });
    }
    
    // Find the chat associated with this supervision
    const chat = await Chat.findOne({ 
      supervision: supervision._id 
    })
    .populate({
      path: 'messages.sender',
      select: 'name' // Only return the sender's name
    });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error getting student chat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Supervisor controller: Get all chats for the supervisor
exports.getSupervisorChats = async (req, res) => {
  try {
    const supervisorId = req.user.id; // Assuming user ID is attached by auth middleware
    
    // First find all supervisions where the user is a supervisor
    const supervisions = await Supervision.find({ 
      supervisor: supervisorId,
      status: "active" 
    });
    
    if (!supervisions.length) {
      return res.status(404).json({ message: "No active supervisions found" });
    }
    
    // Get the IDs of all supervisions
    const supervisionIds = supervisions.map(supervision => supervision._id);
    
    // Find all chats associated with these supervisions
    const chats = await Chat.find({ 
      supervision: { $in: supervisionIds } 
    })
    .populate({
      path: 'supervision',
      populate: {
        path: 'student',
        select: 'name' // Get student names for the chat list
      }
    })
    .select('supervision lastActivity status')
    .sort({ lastActivity: -1 }); // Sort by most recent activity
    
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error getting supervisor chats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get chat by ID (for both student and supervisor)
exports.getChatById = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    
    // Validate if the chat ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'supervision',
        select: 'student supervisor'
      })
      .populate({
        path: 'messages.sender',
        select: 'name'
      });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Check if the user is either the student or supervisor of this chat
    if (
      chat.supervision.student.toString() !== userId && 
      chat.supervision.supervisor.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to access this chat" });
    }
    
    // Mark messages as read if the user is the recipient
    const unreadMessages = chat.messages.filter(
      msg => msg.sender._id.toString() !== userId && !msg.isRead
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      
      // Update the messages to mark as read
      await Chat.updateOne(
        { _id: chatId, "messages._id": { $in: messageIds } },
        { $set: { "messages.$[elem].isRead": true } },
        { arrayFilters: [{ "elem._id": { $in: messageIds } }] }
      );
      
      // Update the read status in the response object too
      unreadMessages.forEach(msg => {
        msg.isRead = true;
      });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error getting chat by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Send message to a chat
exports.sendMessage = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;
    
    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    // Validate if the chat ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'supervision',
        select: 'student supervisor'
      });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Check if the user is either the student or supervisor of this chat
    if (
      chat.supervision.student.toString() !== userId && 
      chat.supervision.supervisor.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to send messages to this chat" });
    }
    
    // Create the new message
    const newMessage = {
      sender: userId,
      content,
      timestamp: new Date(),
      isRead: false
    };
    
    // Add the message to the chat
    chat.messages.push(newMessage);
    
    // Update the lastActivity field
    chat.lastActivity = new Date();
    
    // Save the updated chat
    await chat.save();
    
    // Return the newly created message with populated sender
    const populatedChat = await Chat.findById(chatId)
      .populate({
        path: 'messages.sender',
        select: 'name'
      });
    
    const sentMessage = populatedChat.messages[populatedChat.messages.length - 1];
    
    res.status(201).json(sentMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};