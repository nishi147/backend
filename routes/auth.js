const express = require('express');
const { register, login, logout, getMe, forgotPassword, resetPassword, sendOtp, verifyOtpResetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const upload = require('../utils/upload');

router.post('/register', upload.single('profilePicture'), register);

router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// OTP-based password reset
router.post('/send-otp', sendOtp);
router.post('/verify-otp-reset', verifyOtpResetPassword);

module.exports = router;
