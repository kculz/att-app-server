const express = require('express');
const router = express.Router();
const {
  rejectCall,
  getCallStatus,
  endCall,
  joinCall,
  initiateCall,
  handleVideoCall
} = require('../controllers/supervisionCall');
const authMiddleware = require('../middlewares/authMiddleware');

// Initiate a new supervision call
router.post(
  '/initiate',
  authMiddleware,
  initiateCall
);

// Join an ongoing call
router.post(
  '/:callId/join',
  authMiddleware,
  joinCall
);

// End an ongoing call
router.post(
  '/:callId/end',
  authMiddleware,
  endCall
);


// Reject an incoming call
router.post(
  '/:callId/reject',
  authMiddleware,
  rejectCall
);



module.exports = router;