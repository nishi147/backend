const express = require('express');
const {
    createSale,
    getSalesAnalytics
} = require('../controllers/saleController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createSale);
router.get('/analytics', protect, authorize('admin', 'sales'), getSalesAnalytics);

module.exports = router;
