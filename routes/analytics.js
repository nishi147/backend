const express = require('express');
const {
    getSalesAnalytics,
    getUserAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/sales', protect, authorize('admin'), getSalesAnalytics);
router.get('/users', protect, authorize('admin'), getUserAnalytics);

module.exports = router;
