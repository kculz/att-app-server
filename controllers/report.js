const Report = require("../models/Report");
const User = require("../models/User");
const Internship = require("../models/Internship");

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

    // Calculate total weeks, completed weeks, and weeks left
    const currentDate = new Date();
    const totalWeeks = weeklyReports.length;
    const weeksCompleted = weeklyReports.filter(
      (report) => new Date(report.endDate) <= currentDate
    ).length;
    const weeksLeft = totalWeeks - weeksCompleted;

    return res.status(200).json({
      weeklyReports,
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

    // Generate working days for this week
    const workingDays = getWorkingDays(currentDate, endOfWeek, holidays);

    // Add the report
    reports.push({
      weekNumber: weekNumber,
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

module.exports.ReportController = {
  getWeeklyReports,
  createOrUpdateReport,
  setHolidays,
  getSingleReport,
};