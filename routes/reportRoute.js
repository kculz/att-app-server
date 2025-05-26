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

// New PDF upload routes
router.post('/upload-pdf/:weekNumber', 
  authMiddleware, 
  ReportController.upload.single('pdfFile'), 
  ReportController.uploadPdfReport
);

router.delete('/delete-pdf/:weekNumber', 
  authMiddleware, 
  ReportController.deletePdfReport
);

module.exports = router;