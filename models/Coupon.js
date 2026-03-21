const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true,
        trim: true 
    },
    discountType: { 
        type: String, 
        enum: ['percent', 'fixed'], 
        required: true 
    },
    discountValue: { 
        type: Number, 
        required: true 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    expiryDate: { 
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);
