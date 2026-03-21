const express = require('express');
const { awardRewards } = require('../controllers/rewardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.put('/:id/rewards', authorize('teacher', 'admin'), awardRewards);

module.exports = router;
