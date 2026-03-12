const express = require('express');
const { createOrder, verifyPayment, createIntroOrder, verifyIntroPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/order', protect, authorize('student'), createOrder);
router.post('/verify', protect, authorize('student'), verifyPayment);
router.post('/intro-order', createIntroOrder);
router.post('/intro-verify', verifyIntroPayment);

module.exports = router;
