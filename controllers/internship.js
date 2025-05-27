const Internship = require("../models/Internship");
const User = require("../models/User");
const Chat = require("../models/Chat");
const SupervisionSchema = require("../models/SupervisionSchema");
const multer = require('multer');
const admin = require('../firebase-admin-config'); // Import Firebase Admin SDK configuration

// Get Firebase Storage bucket (Firebase Admin should already be initialized in main server file)
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

// Helper function to upload file to Firebase Storage
const uploadFileToFirebase = async (file, filePath) => {
  const firebaseFile = bucket.file(filePath);
  
  const stream = firebaseFile.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      console.error('Upload error:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        await firebaseFile.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        resolve({
          fileName: file.originalname,
          fileUrl: publicUrl,
          fileSize: file.size,
          uploadedAt: new Date()
        });
      } catch (error) {
        reject(error);
      }
    });

    stream.end(file.buffer);
  });
};

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
      documents: [], // Initialize empty documents array
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

// Upload internship document
const uploadInternshipDocument = async (req, res) => {
  const studentId = req.user.id;
  const { documentType, description } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Please upload a PDF file." });
    }

    if (!documentType) {
      return res.status(400).json({ msg: "Document type is required." });
    }

    // Validate document type
    const validTypes = ["offer_letter", "contract", "agreement", "other"];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ msg: "Invalid document type." });
    }

    // Find the internship
    const internship = await Internship.findOne({ student: studentId });
    if (!internship) {
      return res.status(404).json({ msg: "Internship not found." });
    }

    // Generate unique filename
    const fileName = `internships/${studentId}/${documentType}-${Date.now()}.pdf`;
    
    // Upload file to Firebase
    const fileInfo = await uploadFileToFirebase(req.file, fileName);

    // Add document to internship
    const newDocument = {
      type: documentType,
      fileName: fileInfo.fileName,
      fileUrl: fileInfo.fileUrl,
      fileSize: fileInfo.fileSize,
      uploadedAt: fileInfo.uploadedAt,
      description: description || "",
    };

    internship.documents.push(newDocument);
    await internship.save();

    return res.status(200).json({ 
      msg: "Document uploaded successfully!", 
      document: newDocument,
      internship: internship 
    });

  } catch (err) {
    console.error("Error uploading internship document:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Delete internship document
const deleteInternshipDocument = async (req, res) => {
  const studentId = req.user.id;
  const { documentId } = req.params;

  try {
    const internship = await Internship.findOne({ student: studentId });
    if (!internship) {
      return res.status(404).json({ msg: "Internship not found." });
    }

    // Find the document
    const documentIndex = internship.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({ msg: "Document not found." });
    }

    const document = internship.documents[documentIndex];

    // Extract filename from URL and delete from Firebase Storage
    try {
      const url = document.fileUrl;
      const fileName = url.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
      
      if (fileName) {
        const file = bucket.file(fileName);
        await file.delete();
      }
    } catch (deleteError) {
      console.error("Error deleting file from Firebase:", deleteError);
      // Continue with database cleanup even if Firebase deletion fails
    }

    // Remove document from internship
    internship.documents.splice(documentIndex, 1);
    await internship.save();

    return res.status(200).json({ 
      msg: "Document deleted successfully!", 
      internship: internship 
    });

  } catch (err) {
    console.error("Error deleting internship document:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get internship documents
const getInternshipDocuments = async (req, res) => {
  const studentId = req.user.id;

  try {
    const internship = await Internship.findOne({ student: studentId }).select('documents');
    
    if (!internship) {
      return res.status(404).json({ msg: "Internship not found." });
    }

    return res.status(200).json({ 
      documents: internship.documents || [] 
    });

  } catch (err) {
    console.error("Error fetching internship documents:", err);
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
  uploadInternshipDocument,
  deleteInternshipDocument,
  getInternshipDocuments,
  getCompaniesAndStudents,
  upload, // Export multer middleware
};