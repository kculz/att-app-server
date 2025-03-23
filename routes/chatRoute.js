const router = require("express").Router();
const { getChatById, getStudentChat, getSupervisorChats, sendMessage } = require("../controllers/chat");

const authMiddleware = require("../middlewares/authMiddleware");


// Student route
router.get("/student", authMiddleware, getStudentChat);

// Supervisor routes
router.get("/supervisor", authMiddleware, getSupervisorChats);

// Shared route for getting a specific chat
router.get("/:id", authMiddleware, getChatById);

router.post('/:id/messages', authMiddleware, sendMessage);

module.exports = router;