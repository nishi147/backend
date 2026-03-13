const express = require('express');
const { 
    createOrder, 
    verifyPayment, 
    createIntroOrder, 
    verifyIntroPayment,
    createWorkshopOrder,
    verifyWorkshopPayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/order', protect, authorize('student'), createOrder);
router.post('/verify', protect, authorize('student'), verifyPayment);
router.post('/workshop-order', protect, authorize('student'), createWorkshopOrder);
router.post('/workshop-verify', protect, authorize('student'), verifyWorkshopPayment);
router.post('/intro-order', createIntroOrder);
router.post('/intro-verify', verifyIntroPayment);

module.exports = router;
