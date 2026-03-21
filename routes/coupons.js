const express = require('express');
const {
    getCoupons,
    createCoupon,
    validateCoupon
} = require('../controllers/couponController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'sales'), getCoupons);
router.post('/', protect, authorize('admin', 'sales'), createCoupon);
router.post('/validate', validateCoupon);

module.exports = router;
