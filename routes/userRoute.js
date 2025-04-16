const { UserController } = require('../controllers/user');
const authMiddleware = require('../middlewares/authMiddleware');

const router = require('express').Router();

router.post('/supervisor/register', UserController.createSupervisor);
router.post('/student/register', UserController.createStudent);
router.post('/coordinator/register', UserController.createCoordinator);
router.get('/student/profile', authMiddleware, UserController.getStudentProfile);
router.get('/supervisor/profile', authMiddleware, UserController.getSupervisorProfile);
router.get('/coordinator/profile', authMiddleware, UserController.getCoordinatorProfile);

module.exports = router;