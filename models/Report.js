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
  // New PDF upload fields
  pdfReport: {
    fileName: {
      type: String,
      required: false,
    },
    fileUrl: {
      type: String,
      required: false,
    },
    fileSize: {
      type: Number,
      required: false,
    },
    uploadedAt: {
      type: Date,
      required: false,
    },
  },
  status: {
    type: String,
    enum: ["Pending-Review", "Submitted", "Reviewed", "Waiting"],
    default: "Waiting",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
ReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Report", ReportSchema);