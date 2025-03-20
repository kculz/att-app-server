const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Fee = require("../models/Fee");

const createStudent = async (req, res) => {
  const { name, email, password, nationalID, courseId, levelId, feeAmount } = req.body;

  try {
      // Check if user already exists
      const user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: "User already exists." });

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10); // Generate a salt
      const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

      // Create a new fee record
      const newFee = new Fee({ isPaid: false, amount: feeAmount });
      await newFee.save();

      // Create a new user with the hashed password, course, level, and fee
      const newUser = new User({
          name,
          email,
          password: hashedPassword,
          nationalID,
          course: courseId,
          level: levelId,
          fee: newFee._id,
      });

      await newUser.save();

      return res.status(201).json({ msg: "Student created successfully!" });
  } catch (err) {
      return res.status(500).json({ error: err.message });
  }
};

const createSupervisor = async (req, res) => {
    const { name, email, password, nationalID, phone, courseId } = req.body;
    try {
        // Check if user already exists
        const user = await User.findOne({ email })
            .populate("course")
            .populate("level");
        if (user) return res.status(400).json({ msg: "User already exists." });

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        // Create a new supervisor with the hashed password
        const newUser = new User({ name, email, password: hashedPassword, role: "supervisor", nationalID, phone, course: courseId });
        await newUser.save();

        return res.status(201).json({ msg: "Supervisor created successfully!" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};


const getStudentProfile = async (req, res) => {
    const { id } = req.user; // Assuming the user ID is extracted from the JWT token
    try {
      const student = await User.findById(id)
        .populate("course") // Populate course details
        .populate("level"); // Populate level details
  
      if (!student) {
        return res.status(404).json({ msg: "Student not found." });
      }
  
      // Return the student profile
      return res.status(200).json({
        fullName: student.name,
        studentId: student.nationalID,
        degree: student.course?.name || "Not specified",
        degreeLevel: student.level?.name || "Not specified",
        feeStatus: {
          semester: "Semester 2, 2025", // Replace with dynamic data if available
          status: "Partially Paid", // Replace with dynamic data if available
          balance: "ZIG 15,000", // Replace with dynamic data if available
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

  const updateStudentProfile = async (req, res) => {
    const { id } = req.user; // Assuming the user ID is extracted from the JWT token
    const { name, email, nationalID, course, level } = req.body;
  
    try {
      const student = await User.findById(id);
      if (!student) {
        return res.status(404).json({ msg: "Student not found." });
      }
  
      // Update the student's details
      if (name) student.name = name;
      if (email) student.email = email;
      if (nationalID) student.nationalID = nationalID;
      if (course) student.course = course; // Assuming `course` is the course ID
      if (level) student.level = level; // Assuming `level` is the level ID
  
      await student.save();
  
      return res.status(200).json({ msg: "Profile updated successfully!" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

exports.UserController = { createStudent, createSupervisor, getStudentProfile, updateStudentProfile };