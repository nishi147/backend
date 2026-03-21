const Lead = require('../models/Lead');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private (Admin)
exports.getSalesAnalytics = async (req, res) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const convertedLeads = await Lead.countDocuments({ status: 'Converted' });
        
        const revenueData = await Lead.aggregate([
            { $match: { status: 'Converted' } },
            { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }
        ]);

        const sourceStats = await Lead.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        const statusStats = await Lead.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalLeads,
                convertedLeads,
                conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
                totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0,
                sourceStats,
                statusStats
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get user growth analytics
// @route   GET /api/analytics/users
// @access  Private (Admin)
exports.getUserAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const roleStats = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                roleStats
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
