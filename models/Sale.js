const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    salesUserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    couponCode: { 
        type: String,
        required: true
    },
    originalAmount: { 
        type: Number, 
        required: true 
    },
    discountAmount: { 
        type: Number, 
        required: true 
    },
    finalAmount: { 
        type: Number, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
