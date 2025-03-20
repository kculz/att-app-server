const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const  { ReportController } = require('../controllers/report');

router.get('/weekly', authMiddleware, ReportController.getWeeklyReports);
router.post('/create-or-update/:weekNumber', authMiddleware, ReportController.createOrUpdateReport);
router.post('/set-holiday', authMiddleware, ReportController.setHolidays);
router.get('/weekly/:weekNumber', authMiddleware, ReportController.getSingleReport);


module.exports = router;