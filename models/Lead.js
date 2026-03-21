const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    source: { 
        type: String, 
        enum: ['Meta', 'Google', 'Website', 'Referral', 'Other'], 
        default: 'Website' 
    },
    status: { 
        type: String, 
        enum: ['New', 'Contacted', 'Converted', 'Lost'], 
        default: 'New' 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    notes: [{
        text: String,
        date: { type: Date, default: Date.now },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    followUpDate: { type: Date },
    convertedAt: { type: Date },
    revenue: { type: Number, default: 0 },
    referralCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);
