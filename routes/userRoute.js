const { UserController } = require('../controllers/user');
const authMiddleware = require('../middlewares/authMiddleware');

const router = require('express').Router();

router.post('/supervisor/register', UserController.createSupervisor);
router.post('/student/register', UserController.createStudent);
router.get('/student/profile', authMiddleware, UserController.getStudentProfile);
router.get('/supervisor/profile', authMiddleware, UserController.getSupervisorProfile);

module.exports = router;