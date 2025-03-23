const  mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SupervisionSchema = new Schema({
    student: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    supervisor: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    start: {
      type: Date,
      required: false
    },
    status: { 
      type: String, 
      enum: ["active", "completed", "terminated", "pending"],
      default: "pending"
    }
  });

  SupervisionSchema.index({ student: 1, supervisor: 1 }, { unique: true });

  module.exports = mongoose.model("Supervision", SupervisionSchema);