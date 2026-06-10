const express = require('express');
const { 
    createOrder, 
    verifyPayment, 
    createIntroOrder, 
    verifyIntroPayment,
    createWorkshopOrder,
    verifyWorkshopPayment,
    createBootcampOrder,
    verifyBootcampPayment,
    getInvoice,
    getMyPayments
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/my-payments', protect, authorize('student'), getMyPayments);
router.post('/order', protect, authorize('student'), createOrder);
router.post('/verify', protect, authorize('student'), verifyPayment);
router.post('/workshop-order', createWorkshopOrder);
router.post('/workshop-verify', verifyWorkshopPayment);
router.post('/bootcamp-order', createBootcampOrder);
router.post('/bootcamp_order', createBootcampOrder); // underscore fallback
router.post('/bootcamp-verify', verifyBootcampPayment);
router.post('/bootcamp_verify', verifyBootcampPayment); // underscore fallback
router.post('/intro-order', createIntroOrder);
router.post('/intro-verify', verifyIntroPayment);
router.get('/invoice/:id', getInvoice);

module.exports = router;
