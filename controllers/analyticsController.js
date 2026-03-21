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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const followUpToday = await Lead.countDocuments({
            followUpDate: { $gte: today, $lt: tomorrow }
        });

        const ObjectIds = require('mongoose').Types.ObjectId;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const leadsOverTime = await Lead.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { 
                        year: { $year: '$createdAt' }, 
                        month: { $month: '$createdAt' } 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const revenueOverTime = await Lead.aggregate([
            { $match: { status: 'Converted', convertedAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { 
                        year: { $year: '$convertedAt' }, 
                        month: { $month: '$convertedAt' } 
                    },
                    revenue: { $sum: '$revenue' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalLeads,
                convertedLeads,
                conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
                totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0,
                sourceStats,
                statusStats,
                followUpToday,
                leadsOverTime,
                revenueOverTime
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

// @desc    Get central analytics for CRM
// @route   GET /api/analytics
// @access  Private
exports.getCentralAnalytics = async (req, res) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const convertedLeads = await Lead.countDocuments({ status: 'Converted' });
        
        const conversionRate = totalLeads === 0 ? 0 : (convertedLeads / totalLeads) * 100;
        
        const revenueData = await Lead.aggregate([
            { $match: { status: 'Converted' } },
            { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const followUpsToday = await Lead.countDocuments({
            followUpDate: { $gte: today, $lt: tomorrow },
            status: { $ne: 'Converted' }
        });

        const sourceStats = await Lead.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        const leadsBySource = {};
        sourceStats.forEach(stat => {
            if (stat._id) leadsBySource[stat._id] = stat.count;
        });

        const computedValues = {
            totalLeads,
            convertedLeads,
            conversionRate,
            totalRevenue,
            followUpsToday,
            leadsBySource
        };

        console.log("Analytics Fetched:", JSON.stringify(computedValues));

        res.status(200).json({
            success: true,
            data: computedValues
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
