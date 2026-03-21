const User = require('../models/User');

// @desc    Award rewards (stars/gems) to a student
// @route   PUT /api/users/:id/rewards
// @access  Private (Teacher/Admin)
exports.awardRewards = async (req, res) => {
    try {
        const { stars, gems } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (stars) user.stars += stars;
        if (gems) user.gems += gems;

        await user.save();
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
