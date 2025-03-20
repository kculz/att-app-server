const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema for the individual messages
const MessageSchema = new Schema({
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
});

module.exports = { MessageSchema, Message: mongoose.model("Message", MessageSchema) };