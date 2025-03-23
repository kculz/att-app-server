const Internship = require("../models/Internship");
const User = require("../models/User");
const Chat = require("../models/Chat");
const SupervisionSchema = require("../models/SupervisionSchema");

// Create internship details
const createInternship = async (req, res) => {
  const { startDate, endDate, companyName, companyAddress, companyContact } = req.body;
  const studentId = req.user.id; // Extract student ID from JWT token

  try {
    // Validate input
    if (!startDate || !endDate || !companyName || !companyAddress || !companyContact) {
      return res.status(400).json({ msg: "All fields are required." });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ msg: "End date must be after start date." });
    }

    // Find available supervisors
    const supervisors = await User.find({ role: "supervisor" });
    if (supervisors.length === 0) {
      return res.status(400).json({ msg: "No supervisors available." });
    }

    // Assign a random supervisor
    const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];

    // Create internship entry
    const internship = new Internship({
      student: studentId,
      supervisor: supervisor._id,
      startDate,
      endDate,
      companyName,
      companyAddress,
      companyContact,
    });

    await internship.save();

    const supervision = new SupervisionSchema({
      student: studentId,
      supervisor: supervisor._id,
      status: "active"
    })

    await supervision.save();

    console.log("++++++++++++++++++++Supervision: ",supervision);

    console.log("++++++++++++++ Supers", supervisor._id);
    // Automatically create a chat between the student and the assigned supervisor
    const newChat = new Chat({
      participants: [studentId, supervisor._id], // Include both student and supervisor
      supervision,
      messages: [], // Initialize with no messages
      lastActivity: Date.now(), // Set last activity to now
      status: "active", // Mark chat as active
    });

    await newChat.save();

    return res.status(201).json({ 
      msg: "Internship created successfully! Chat with supervisor has been created.", 
      internship,
      chat: newChat,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Get internship details for the logged-in student
const getInternship = async (req, res) => {
  const studentId = req.user.id;

  try {
    const internship = await Internship.findOne({ student: studentId })
      .populate("student", "name email")
      .populate("supervisor", "name email");

    if (!internship) {
      return res.status(404).json({ msg: "No internship found for this student." });
    }

    return res.status(200).json(internship);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update internship details
const updateInternship = async (req, res) => {
  const studentId = req.user.id;
  const { companyName, companyAddress, companyContact, startDate, endDate } = req.body;

  try {
    let internship = await Internship.findOne({ student: studentId });
    if (!internship) {
      return res.status(404).json({ msg: "Internship not found." });
    }

    // Update details
    if (companyName) internship.companyName = companyName;
    if (companyAddress) internship.companyAddress = companyAddress;
    if (companyContact) internship.companyContact = companyContact;
    if (startDate) internship.startDate = startDate;
    if (endDate) internship.endDate = endDate;

    await internship.save();

    return res.status(200).json({ msg: "Internship updated successfully!", internship });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getCompaniesAndStudents = async (req, res) => {
  try {
    // Fetch all internships with populated student and supervisor details
    const internships = await Internship.find()
      .populate("student", "name email")
      .populate("supervisor", "name email");

    if (!internships || internships.length === 0) {
      return res.status(404).json({ msg: "No internships found." });
    }

    // Group internships by company
    const companiesMap = new Map();

    internships.forEach((internship) => {
      const companyName = internship.companyName;
      if (!companiesMap.has(companyName)) {
        companiesMap.set(companyName, {
          name: companyName,
          location: internship.companyAddress,
          students: [],
        });
      }

      companiesMap.get(companyName).students.push({
        studentName: internship.student.name,
        startDate: internship.startDate,
        endDate: internship.endDate,
      });
    });

    // Convert the map to an array
    const companies = Array.from(companiesMap.values());

    return res.status(200).json(companies);
  } catch (err) {
    console.error("Error fetching companies and students:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.InternshipController = {
  createInternship,
  getInternship,
  updateInternship,
  getCompaniesAndStudents,
};