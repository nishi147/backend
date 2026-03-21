const express = require('express');
const {
    getReferrals,
    getMyReferrals
} = require('../controllers/referralController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getReferrals);
router.get('/me', protect, getMyReferrals);

module.exports = router;
