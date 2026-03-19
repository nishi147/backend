const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const sendTokenResponse = (user, statusCode, res) => {
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

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
        const { name, email, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        let profilePicture = '';
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            profilePicture = `data:${req.file.mimetype};base64,${b64}`;
        }

        user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            isApprovedTeacher: role === 'admin' ? true : false,
            profilePicture
        });


        sendTokenResponse(user, 201, res);
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

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
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

const Enrollment = require('../models/Enrollment');

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Fetch enrollments if student
        let enrollments = [];
        if (user.role === 'student') {
            enrollments = await Enrollment.find({ student: req.user.id, status: 'active' }).select('course status');
        }

        res.status(200).json({ 
            success: true, 
            data: {
                ...user.toObject(),
                enrollments
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
  
  try {
    const user = await User.findOne({ email: req.body.email });

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
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
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
};
