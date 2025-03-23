const Supervision = require("../models/SupervisionSchema");
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Set supervision date (only supervisors)
const setSupervisionDate = async (req, res) => {
  const supervisorId = req.user.id; // From JWT token
  const { studentId, date } = req.body;

  try {
    // Validate input
    if (!studentId || !date) {
      return res.status(400).json({ 
        success: false,
        message: "Student ID and date are required." 
      });
    }

    // Check if supervisor exists
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({ 
        success: false,
        message: "Only supervisors can set supervision dates." 
      });
    }

    // Find the supervision
    let supervision = await Supervision.findOne({
      student: studentId,
      supervisor: supervisorId
    });

    if (!supervision) {
      return res.status(404).json({ 
        success: false,
        message: "Supervision relationship not found." 
      });
    }

    // Update supervision with date
    supervision.start = new Date(date);
    supervision.status = "active";
    await supervision.save();

    // Get student details for email
    const student = await User.findById(studentId);
    
    // Send email notifications
    await sendSupervisionEmails(student, supervisor, new Date(date));

    return res.status(200).json({
      success: true,
      message: "Supervision date set successfully!",
      supervision
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: err.message || "Error setting supervision date"
    });
  }
};

// Get all supervisions for a supervisor
const getSupervisorSupervisions = async (req, res) => {
  const supervisorId = req.user.id;

  try {
    const supervisions = await Supervision.find({ supervisor: supervisorId })
      .populate("student", "name email")
      .sort({ start: 1 }); // Sort by date, ascending

    return res.status(200).json(supervisions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: err.message || "Error fetching supervisions"
    });
  }
};

const getStudentSupervisions = async (req, res) => {
  const studentId = req.user.id;

  try {
    const supervisions = await Supervision.find({ student: studentId })
      .populate("supervisor", "name email") // Ensure supervisor details are populated
      .sort({ start: 1 }); // Sort by date, ascending

    return res.status(200).json(supervisions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: err.message || "Error fetching supervisions"
    });
  }
};

// Helper function to send emails
const sendSupervisionEmails = async (student, supervisor, date) => {
  // Create a test email transporter (replace with your actual email configuration)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Email to student
  const studentMailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: "Internship Supervision Scheduled",
    html: `
      <h2>Supervision Session Scheduled</h2>
      <p>Dear ${student.name},</p>
      <p>Your supervision session has been scheduled with your supervisor, ${supervisor.name}.</p>
      <p><strong>Date and Time:</strong> ${formattedDate}</p>
      <p>Please be prepared and punctual for your session.</p>
      <p>Regards,<br>Internship Management System</p>
    `
  };

  // Email to supervisor
  const supervisorMailOptions = {
    from: process.env.EMAIL_FROM,
    to: supervisor.email,
    subject: "Internship Supervision Scheduled",
    html: `
      <h2>Supervision Session Scheduled</h2>
      <p>Dear ${supervisor.name},</p>
      <p>You have scheduled a supervision session with ${student.name}.</p>
      <p><strong>Date and Time:</strong> ${formattedDate}</p>
      <p>Regards,<br>Internship Management System</p>
    `
  };

  try {
    await transporter.sendMail(studentMailOptions);
    await transporter.sendMail(supervisorMailOptions);
    console.log("Supervision emails sent successfully");
  } catch (error) {
    console.error("Error sending supervision emails:", error);
    // Continue execution even if emails fail
  }
};

module.exports.SupervisionController = {
  setSupervisionDate,
  getSupervisorSupervisions,
  getStudentSupervisions
};