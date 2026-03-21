const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin)
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort('-createdAt');
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin)
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ code: req.body.code, isActive: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });

        if (coupon.expiryDate && coupon.expiryDate < new Date()) {
            coupon.isActive = false;
            await coupon.save();
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        res.status(200).json({ success: true, data: coupon });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
