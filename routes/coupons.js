const express = require('express');
const {
    getCoupons,
    createCoupon,
    validateCoupon,
    deleteCoupon
} = require('../controllers/couponController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'sales'), getCoupons);
router.post('/', protect, authorize('admin', 'sales'), createCoupon);
router.post('/validate', validateCoupon);
router.delete('/:id', protect, authorize('admin', 'sales'), deleteCoupon);

module.exports = router;
