const Report = require("../models/Report");
const User = require("../models/User");
const Internship = require("../models/Internship");
const multer = require('multer');
const admin = require('../firebase-admin-config'); // Adjust the path as necessary
const { parse } = require("url");

// Initialize Firebase Admin SDK (add this to your server initialization)
// const serviceAccount = parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: 'att-app-24fb5.appspot.com'
// });

const bucket = admin.storage().bucket();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

const getWeeklyReports = async (req, res) => {
  const studentId = req.user.id; // Extract student ID from JWT token

  try {
    // Fetch the student's internship details
    const internship = await Internship.findOne({ student: studentId });

    if (!internship) {
      return res.status(400).json({ msg: "Internship details not found." });
    }

    const attachmentStartDate = new Date(internship.startDate);
    const attachmentEndDate = new Date(internship.endDate);

    // Fetch holidays for the student
    const student = await User.findById(studentId);
    const holidays = student.holidays || [];

    // Generate weekly reports
    const weeklyReports = generateWeeklyReports(attachmentStartDate, attachmentEndDate, holidays);

    // Fetch existing reports from database to get status and PDF info
    const existingReports = await Report.find({ student: studentId });
    
    // Merge generated reports with existing data
    const mergedReports = weeklyReports.map(generatedReport => {
      const existingReport = existingReports.find(r => r.weekNumber === generatedReport.weekNumber);
      return {
        ...generatedReport,
        status: existingReport?.status || 'Waiting',
        pdfReport: existingReport?.pdfReport || null,
        _id: existingReport?._id || null
      };
    });

    // Calculate total weeks, completed weeks, and weeks left
    const currentDate = new Date();
    const totalWeeks = mergedReports.length;
    const weeksCompleted = mergedReports.filter(
      (report) => new Date(report.endDate) <= currentDate
    ).length;
    const weeksLeft = totalWeeks - weeksCompleted;

    return res.status(200).json({
      weeklyReports: mergedReports,
      totalWeeks,
      weeksCompleted,
      weeksLeft,
    });
  } catch (err) {
    console.error("Error fetching weekly reports:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Create or update a weekly report
const createOrUpdateReport = async (req, res) => {
  const studentId = req.user.id; // Extract student ID from JWT token
  const { weekNumber } = req.params; // Get the week number from request params
  const { workingDays, tasks, offDaysOrHoliday, status } = req.body;

  try {
    // Validate input
    if (!weekNumber || !workingDays || !Array.isArray(workingDays)) {
      return res.status(400).json({ msg: "Please provide all required fields." });
    }

    // Check if the report already exists
    let report = await Report.findOne({ student: studentId, weekNumber });

    if (report) {
      // Update existing report
      report.workingDays = workingDays;
      report.tasks = tasks || report.tasks;
      report.offDaysOrHoliday = offDaysOrHoliday || report.offDaysOrHoliday;
      if (status) report.status = status;
    } else {
      // Create new report
      report = new Report({
        student: studentId,
        weekNumber,
        workingDays,
        tasks: tasks || [],
        offDaysOrHoliday: offDaysOrHoliday || [],
        status: status || "Pending-Review"
      });
    }

    await report.save();

    return res.status(200).json({ msg: "Report saved successfully!", report });
  } catch (err) {
    console.error("Error saving report:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Upload PDF report
const uploadPdfReport = async (req, res) => {
  const studentId = req.user.id;
  const { weekNumber } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Please upload a PDF file." });
    }

    // Generate unique filename
    const fileName = `reports/${studentId}/week-${weekNumber}-${Date.now()}.pdf`;
    
    // Create a file reference in Firebase Storage
    const file = bucket.file(fileName);
    
    // Create a write stream
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
      },
    });

    // Handle stream events
    const uploadPromise = new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Make the file publicly accessible
          await file.makePublic();
          
          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          
          resolve({
            fileName: req.file.originalname,
            fileUrl: publicUrl,
            fileSize: req.file.size,
            uploadedAt: new Date()
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    // Write the buffer to the stream
    stream.end(req.file.buffer);

    // Wait for upload to complete
    const pdfInfo = await uploadPromise;

    // Find or create the report
    let report = await Report.findOne({ student: studentId, weekNumber });
    
    if (!report) {
      // Create new report if it doesn't exist
      report = new Report({
        student: studentId,
        weekNumber,
        workingDays: [],
        tasks: [],
        offDaysOrHoliday: [],
        status: "Pending-Review"
      });
    }

    // Update report with PDF info
    report.pdfReport = pdfInfo;
    report.status = "Submitted";
    
    await report.save();

    return res.status(200).json({ 
      msg: "PDF report uploaded successfully!", 
      report: report 
    });

  } catch (err) {
    console.error("Error uploading PDF report:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Delete PDF report
const deletePdfReport = async (req, res) => {
  const studentId = req.user.id;
  const { weekNumber } = req.params;

  try {
    const report = await Report.findOne({ student: studentId, weekNumber });
    
    if (!report || !report.pdfReport) {
      return res.status(404).json({ msg: "PDF report not found." });
    }

    // Extract filename from URL
    const url = report.pdfReport.fileUrl;
    const fileName = url.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
    
    if (fileName) {
      // Delete from Firebase Storage
      const file = bucket.file(fileName);
      await file.delete();
    }

    // Remove PDF info from report
    report.pdfReport = undefined;
    report.status = "Waiting";
    
    await report.save();

    return res.status(200).json({ 
      msg: "PDF report deleted successfully!", 
      report: report 
    });

  } catch (err) {
    console.error("Error deleting PDF report:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Set holidays for a student
const setHolidays = async (req, res) => {
  const studentId = req.user.id; // Extract student ID from JWT token
  const { holidays } = req.body;

  try {
    // Validate input
    if (!holidays || !Array.isArray(holidays)) {
      return res.status(400).json({ msg: "Please provide a valid list of holidays." });
    }

    // Update student's holidays
    const student = await User.findByIdAndUpdate(
      studentId,
      { holidays },
      { new: true }
    );

    return res.status(200).json({ msg: "Holidays updated successfully!", student });
  } catch (err) {
    console.error("Error setting holidays:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Helper function to generate weekly reports
const generateWeeklyReports = (attachmentStartDate, attachmentEndDate, holidays) => {
  const reports = [];
  let currentDate = new Date(attachmentStartDate);
  let weekNumber = 1;

  while (currentDate <= attachmentEndDate) {
    // Calculate the end date of the current week
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() + 6);

    // If end of week exceeds attachment end date, use attachment end date
    if (endOfWeek > attachmentEndDate) {
      endOfWeek.setTime(attachmentEndDate.getTime());
    }

    // Generate working days for this week
    const workingDays = getWorkingDays(currentDate, endOfWeek, holidays);

    // Add the report
    reports.push({
      weekNumber: weekNumber,
      startDate: new Date(currentDate),
      endDate: new Date(endOfWeek),
      workingDays: workingDays,
      tasks: [],
      offDaysOrHoliday: getHolidaysInRange(currentDate, endOfWeek, holidays)
    });

    // Move to the next week
    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;
  }

  return reports;
};

// Helper function to get working days (Monday to Friday), excluding holidays
const getWorkingDays = (startDate, endDate, holidays) => {
  const workingDays = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isHoliday = isDateInHolidays(currentDate, holidays);

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) { // Exclude Saturday (6), Sunday (0), and holidays
      workingDays.push({
        startDate: new Date(currentDate),
        endDate: new Date(currentDate)
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

// Helper function to check if a date falls within any holiday period
const isDateInHolidays = (date, holidays) => {
  return holidays.some(holiday => 
    date >= new Date(holiday.startDate) && date <= new Date(holiday.endDate)
  );
};

// Helper function to get holidays that fall within a specific date range
const getHolidaysInRange = (startDate, endDate, holidays) => {
  return holidays.filter(holiday => {
    const holidayStart = new Date(holiday.startDate);
    const holidayEnd = new Date(holiday.endDate);
    return (holidayStart <= endDate && holidayEnd >= startDate);
  }).map(holiday => ({
    startDate: holiday.startDate,
    endDate: holiday.endDate,
    reason: holiday.reason || "Holiday"
  }));
};

// Get a single report for a specific week
const getSingleReport = async (req, res) => {
  const studentId = req.user.id; // Extract student ID from JWT token
  const { weekNumber } = req.params; // Get the week number from request params

  try {
    // Validate input
    if (!weekNumber) {
      return res.status(400).json({ msg: "Week number is required." });
    }

    // Fetch the report for the given week and student
    const report = await Report.findOne({ student: studentId, weekNumber });

    if (!report) {
      return res.status(404).json({ msg: "Report not found for the specified week." });
    }

    return res.status(200).json(report);
  } catch (err) {
    console.error("Error fetching single report:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getStudentsProgress = async (req, res) => {
  const supervisorId = req.user.id; // Extract supervisor ID from JWT token

  try {
    // Fetch all internships supervised by this supervisor
    const internships = await Internship.find({ supervisor: supervisorId }).populate(
      "student",
      "name"
    );

    if (!internships || internships.length === 0) {
      return res.status(404).json({ msg: "No students assigned to this supervisor." });
    }

    // Calculate progress for each student
    const studentsProgress = internships.map((internship) => {
      const startDate = new Date(internship.startDate);
      const endDate = new Date(internship.endDate);
      const currentDate = new Date();

      // Calculate total weeks and completed weeks
      const totalWeeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
      const weeksCompleted = Math.floor((currentDate - startDate) / (7 * 24 * 60 * 60 * 1000));

      return {
        studentId: internship.student._id,
        studentName: internship.student.name,
        totalWeeks,
        weeksCompleted: Math.min(weeksCompleted, totalWeeks), // Ensure weeksCompleted doesn't exceed totalWeeks
      };
    });

    return res.status(200).json(studentsProgress);
  } catch (err) {
    console.error("Error fetching students' progress:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getSupervisorReports = async (req, res) => {
  const supervisorId = req.user.id; // Extract supervisor ID from JWT token

  try {
    // Fetch all internships supervised by this supervisor and populate student details
    const internships = await Internship.find({ supervisor: supervisorId }).populate("student");

    if (!internships.length) {
      return res.status(404).json({ msg: "No students assigned to this supervisor." });
    }

    // Fetch reports for all students
    const reports = await Report.find({
      student: { $in: internships.map((intern) => intern.student._id) },
    }).populate("student", "name");

    return res.status(200).json(reports);
  } catch (err) {
    console.error("Error fetching supervisor reports:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.ReportController = {
  getWeeklyReports,
  createOrUpdateReport,
  uploadPdfReport,
  deletePdfReport,
  setHolidays,
  getSingleReport,
  getStudentsProgress,
  getSupervisorReports,
  upload, // Export multer middleware
};