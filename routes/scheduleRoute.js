const express = require('express');
const router = express.Router();
const { SupervisionController } = require('../controllers/schedule');
const auth = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

// Set supervision date (supervisor only)
router.post('/set-date', auth, checkRole(['supervisor']), SupervisionController.setSupervisionDate);

// Get all supervisions for a supervisor
router.get('/supervisor', auth, checkRole(['supervisor']), SupervisionController.getSupervisorSupervisions);

// Get all supervisions for a student
router.get('/student', auth, checkRole(['student']), SupervisionController.getStudentSupervisions);

module.exports = router;