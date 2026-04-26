const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../utils/cloudinary');

const sendTokenResponse = (user, statusCode, res) => {
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'none',
        secure: true // Always secure for cross-site cookies
    };

    // Note: sameSite: 'none' requires secure: true. 
    // This ensures cookies work across ruzann.com and the Vercel backend.

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};

exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[AUTH DEBUG] Registering user: ${normalizedEmail}`);

        // Check if user exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            console.log(`[AUTH DEBUG] User already exists: ${normalizedEmail}`);
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        let profilePicture = '';
        if (req.file) {
            try {
                profilePicture = await uploadToCloudinary(req.file.buffer, 'ruzann/profiles');
            } catch (err) {
                console.error("Cloudinary upload failed during registration:", err);
            }
        }

        user = await User.create({
            name,
            email: normalizedEmail,
            phone,
            password,
            role: role || 'student',
            isApprovedTeacher: role === 'admin' ? true : false,
            profilePicture
        });

        console.log(`[AUTH DEBUG] User created in DB. ID: ${user._id}, isVerified: ${user.isVerified}`);

        // 1. Generate Email Verification Token
        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // 2. Create verification URL
        const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

        // 3. Send Email
        const html = `
          <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Welcome to RUZANN 🚀</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Verify your email</p>
            </div>
            <div style="padding:32px 24px;background:white;">
              <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${user.name}</strong>,</p>
              <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:16px;">Verify My Email</a>
              </div>
              <p style="color:#9CA3AF;font-size:12px;margin:0;">If you didn't mean to create an account, you can safely ignore this email.</p>
            </div>
          </div>
        `;

        const emailResult = await sendEmail({
            email: user.email,
            subject: 'Verify Your Email Address - RUZANN',
            message: `Please verify your email clicking this link: ${verifyUrl}`,
            html
        });

        if (!emailResult) {
            console.error(`[EMAIL DEBUG] Verification email FAILED to send to ${user.email}`);
            user.emailVerificationToken = undefined;
            user.emailVerificationExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'User created, but email could not be sent' });
        }

        console.log(`[EMAIL DEBUG] Verification email sent successfully to ${user.email}`);
        res.status(201).json({ success: true, message: 'Verification email sent. Please verify your email before logging in.' });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: 'Server error in register', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Normalize email for case-insensitive lookup
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if user is verified
        console.log(`[AUTH DEBUG] Login attempt for ${user.email}. Role: ${user.role}, isVerified: ${user.isVerified}`);
        if (user.role !== 'admin' && !user.isVerified) {
            console.log(`[AUTH DEBUG] Login BLOCKED for unverified user: ${user.email}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Please verify your email before logging in',
                email: user.email,
                isVerified: false
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: 'Server error in login', error: error.message, stack: error.stack });
    }
};

exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Auto-generate referral code for legacy users if missing
        if (!user.referralCode) {
            let isUnique = false;
            let newCode = '';
            while (!isUnique) {
                newCode = 'RUZ' + Math.random().toString(36).substring(2, 7).toUpperCase();
                const existingUser = await User.findOne({ referralCode: newCode });
                if (!existingUser) isUnique = true;
            }
            user.referralCode = newCode;
            await user.save({ validateBeforeSave: false });
        }

        // Fetch enrollments if student
        let enrollments = [];
        let bootcampBookings = [];
        if (user.role === 'student') {
            const Enrollment = require('../models/Enrollment');
            const BootcampBooking = require('../models/BootcampBooking');
            
            enrollments = await Enrollment.find({ student: req.user.id, status: 'active' }).select('course status');
            bootcampBookings = await BootcampBooking.find({ user: req.user.id, status: 'success' }).select('bootcamp status');
        }

        res.status(200).json({ 
            success: true, 
            data: {
                ...user.toObject(),
                enrollments,
                bootcamps: bootcampBookings
            } 
        });
    } catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({ success: false, message: 'Server error in getMe', error: error.message });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  console.log('--- Forgot Password Request Received ---');
  console.log('Email:', req.body.email);
  
  let user;
  try {
    user = await User.findOne({ email: req.body.email?.toLowerCase().trim() });

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    console.log('User found:', user._id);

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    console.log('Reset token generated');

    await user.save({ validateBeforeSave: false });
    console.log('User saved with token');

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password: \n\n ${resetUrl}`;

    console.log('Attempting to send email...');
    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });
    console.log('Email dispatch attempted');

    if (!emailResult) {
      console.log('Email dispatch returned null (failed)');
      throw new Error('Email dispatch failed');
    }

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error('CRITICAL ERROR in forgotPassword:', err);
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: 'Server error in resetPassword', error: error.message });
  }
};

// @desc    Send OTP to email for password reset
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email address.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.otpPasswordToken = hashedOtp;
    user.otpPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save({ validateBeforeSave: false });

    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#EF4444,#7C3AED);padding:32px 24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">RUZANN 🚀</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Password Reset OTP</p>
        </div>
        <div style="padding:32px 24px;background:white;">
          <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hi <strong>${user.name}</strong>,</p>
          <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#F3F4F6;border:2px dashed #E5E7EB;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#111827;">${otp}</span>
          </div>
          <p style="color:#9CA3AF;font-size:12px;margin:0;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Your RUZANN Password Reset OTP',
      message: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      html
    });

    if (!emailResult) {
      user.otpPasswordToken = undefined;
      user.otpPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again.' });
    }

    res.status(200).json({ success: true, data: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/verify-otp-reset
// @access  Public
exports.verifyOtpResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required.' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      otpPasswordToken: hashedOtp,
      otpPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    user.password = newPassword;
    user.otpPasswordToken = undefined;
    user.otpPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, data: 'Password reset successfully.' });
  } catch (error) {
    console.error('Verify OTP Reset Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        const emailVerificationToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({ success: false, message: 'Server error during email verification', error: error.message });
    }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

        const html = `
          <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:auto;background:#f9f9f9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#1f2937,#4f46e5);padding:32px 24px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">RUZANN 🚀</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Verify your email</p>
            </div>
            <div style="padding:32px 24px;background:white;">
              <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${user.name}</strong>,</p>
              <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">Please click the button below to verify your email address and activate your account.</p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:16px;">Verify My Email</a>
              </div>
            </div>
          </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Verify Your Email Address - RUZANN',
            message: `Please verify your email clicking this link: ${verifyUrl}`,
            html
        });

        res.status(200).json({ success: true, message: 'Verification email resent' });
    } catch (error) {
        console.error("Resend Verification Error:", error);
        res.status(500).json({ success: false, message: 'Server error while resending verification email' });
    }
};
