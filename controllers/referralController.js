const Referral = require('../models/Referral');
const User = require('../models/User');

// @desc    Get all referrals
// @route   GET /api/referrals
// @access  Private (Admin)
exports.getReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find()
            .populate('referrer', 'name email')
            .populate('referredLead', 'name status');
        res.status(200).json({ success: true, count: referrals.length, data: referrals });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get my referrals
// @route   GET /api/referrals/my
// @access  Private (Student)
exports.getMyReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find({ referrer: req.user._id })
            .populate('referredLead', 'name status');
        res.status(200).json({ success: true, count: referrals.length, data: referrals });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
