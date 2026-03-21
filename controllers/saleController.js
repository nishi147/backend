const Sale = require('../models/Sale');
const Lead = require('../models/Lead');
const Coupon = require('../models/Coupon');

// @desc    Record a new sale
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res) => {
    try {
        const { couponCode, originalAmount, userId } = req.body;
        
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        let discountAmount = 0;
        if (coupon.discountType === 'percent') {
            discountAmount = (originalAmount * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        const finalAmount = originalAmount - discountAmount;

        const sale = await Sale.create({
            userId,
            salesUserId: coupon.createdBy,
            couponCode,
            originalAmount,
            discountAmount,
            finalAmount
        });

        // Update associated lead if exists
        const userWithLead = await Lead.findOne({ email: req.body.email }); // Assuming email is provided or fetched
        if (userWithLead) {
            userWithLead.status = 'Converted';
            userWithLead.revenue = finalAmount;
            await userWithLead.save();
        }

        res.status(201).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get sales analytics
// @route   GET /api/sales/analytics
// @access  Private
exports.getSalesAnalytics = async (req, res) => {
    try {
        let query;
        if (req.user.role === 'sales') {
            query = Sale.find({ salesUserId: req.user._id });
        } else {
            query = Sale.find();
        }
        
        const sales = await query;
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);
        const totalConversions = sales.length;

        res.status(200).json({ 
            success: true, 
            data: {
                totalRevenue,
                totalConversions,
                salesCount: sales.length
            } 
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
