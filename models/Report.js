const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  workingDays: [
    {
      startDate: {
        type: Date,
        required: false,
      },
      endDate: {
        type: Date,
        required: false,
      },
    },
  ],
  tasks: [
    {
      summary: {
        type: String,
        required: true,
      },
      challenges: {
        type: String,
        required: true,
      },
      achievements: {
        type: String,
        required: false,
      },
    },
  ],
  offDaysOrHoliday: [
    {
      startDate: {
        type: Date,
        required: false,
      },
      endDate: {
        type: Date,
        required: false,
      },
      reason: {
        type: String,
        required: false,
      },
    },
  ],
  status: {
    type: String,
    enum: ["Pending-Review", "Submitted", "Reviewed"],
    default: "Pending-Review",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Report", ReportSchema);
