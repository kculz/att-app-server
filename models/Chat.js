const mongoose = require("mongoose");
const { MessageSchema } = require("./Message");

const ChatSchema = new mongoose.Schema({
    supervision: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Supervision", 
      required: true 
    },
    messages: [MessageSchema],
    lastActivity: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ["active", "archived"],
      default: "active"
    }
});

ChatSchema.index({ supervision: 1 });

module.exports = mongoose.model("Chat", ChatSchema);