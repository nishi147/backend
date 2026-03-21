const express = require('express');
const {
    getCoupons,
    createCoupon,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteCoupon);

router.post('/validate', validateCoupon);

module.exports = router;
