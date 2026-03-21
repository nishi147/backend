const express = require('express');
const {
    getCoupons,
    createCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// IMPORTANT: /validate must come before /:id
router.post('/validate', validateCoupon);

router.route('/')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;
