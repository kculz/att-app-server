const router = require('express').Router();

const { supervisorLoginAuth, studentLoginAuth, cordinatorLoginAuth } = require('../controllers/auth');

router.post('/supervisor/login', supervisorLoginAuth);
router.post('/student/login', studentLoginAuth);
router.post('/coordinator/login', cordinatorLoginAuth);

module.exports = router;