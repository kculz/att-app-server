const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  supervision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervision',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ongoing', 'ended', 'rejected', 'missed'],
    default: 'initiated'
  },
  supervisorJoined: {
    type: Boolean,
    default: false
  },
  studentJoined: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Call', CallSchema);