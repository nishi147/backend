const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin, Sales)
exports.getCoupons = async (req, res) => {
    try {
        let query;
        if (req.user.role === 'sales') {
            query = Coupon.find({ createdBy: req.user._id });
        } else {
            query = Coupon.find().populate('createdBy', 'name email');
        }
        const coupons = await query;
        res.status(200).json({ success: true, data: coupons });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private (Sales, Admin)
exports.createCoupon = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Validate a coupon
// @route   POST /api/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase(), 
            isActive: true,
            expiryDate: { $gt: Date.now() }
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
        }

        res.status(200).json({ success: true, data: coupon });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
