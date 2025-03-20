const router = require('express').Router();

const { supervisorLoginAuth, studentLoginAuth } = require('../controllers/auth');

router.post('/supervisor/login', supervisorLoginAuth);
router.post('/student/login', studentLoginAuth);

module.exports = router;