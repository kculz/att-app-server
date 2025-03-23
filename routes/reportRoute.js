const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const  { ReportController } = require('../controllers/report');
const checkRole = require('../middlewares/checkRole');

router.get('/weekly', authMiddleware, ReportController.getWeeklyReports);
router.post('/create-or-update/:weekNumber', authMiddleware, ReportController.createOrUpdateReport);
router.post('/set-holiday', authMiddleware, ReportController.setHolidays);
router.get('/weekly/:weekNumber', authMiddleware, ReportController.getSingleReport);
router.get("/students-progress", authMiddleware, checkRole(["supervisor"]), ReportController.getStudentsProgress);
router.get("/supervisor", authMiddleware, checkRole(["supervisor"]), ReportController.getSupervisorReports);


module.exports = router;