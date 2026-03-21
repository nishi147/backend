const Referral = require('../models/Referral');
const User = require('../models/User');

// @desc    Get all referrals
// @route   GET /api/referrals
// @access  Private (Admin)
exports.getReferrals = async (req, res) => {
    try {
        const history = await Referral.find()
            .populate('referrer', 'name email')
            .populate('referredLead', 'name status');
            
        const totalReferrals = history.length;
        const conversions = history.filter(r => r.status === 'Successful').length;
        
        let rewards = 0;
        history.forEach(r => {
            if (r.status === 'Successful' && r.reward) {
                 const match = r.reward.match(/\d+/);
                 if (match) rewards += parseInt(match[0], 10);
            }
        });

        res.status(200).json({ 
            success: true, 
             data: {
                referralCode: 'ADMIN-GLOBAL',
                totalReferrals,
                conversions,
                rewards,
                history
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get my referral stats and history
// @route   GET /api/referrals/me
// @access  Private (Student/Sales)
exports.getMyReferrals = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Auto-generate referral code if legacy user
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

        const history = await Referral.find({ referrer: req.user._id })
            .populate('referredLead', 'name status');
            
        const totalReferrals = history.length;
        const conversions = history.filter(r => r.status === 'Successful').length;
        
        let rewards = 0;
        history.forEach(r => {
            if (r.status === 'Successful' && r.reward) {
                 const match = r.reward.match(/\d+/); // extracts numbers like 500 from "₹500 Intro Bonus"
                 if (match) rewards += parseInt(match[0], 10);
            }
        });

        res.status(200).json({ 
            success: true, 
            data: {
                referralCode: user.referralCode,
                totalReferrals,
                conversions,
                rewards,
                history
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
