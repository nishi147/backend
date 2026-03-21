const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    referrer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    referredLead: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lead' 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Successful', 'Rejected'], 
        default: 'Pending' 
    },
    reward: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Referral', ReferralSchema);
