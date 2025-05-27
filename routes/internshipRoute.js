const { InternshipController } = require('../controllers/internship');
const authMiddleware = require('../middlewares/authMiddleware');

const router = require('express').Router();

router.get('/details', authMiddleware, InternshipController.getInternship);
router.post('/create', authMiddleware, InternshipController.createInternship);
router.patch('/update', authMiddleware, InternshipController.updateInternship);
router.get("/companies-students", authMiddleware, InternshipController.getCompaniesAndStudents);

// New document upload routes
router.post('/upload-document', 
  authMiddleware, 
  InternshipController.upload.single('document'), 
  InternshipController.uploadInternshipDocument
);

router.delete('/delete-document/:documentId', 
  authMiddleware, 
  InternshipController.deleteInternshipDocument
);

router.get('/documents', 
  authMiddleware, 
  InternshipController.getInternshipDocuments
);

module.exports = router;