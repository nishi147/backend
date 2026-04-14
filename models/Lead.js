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
        enum: ['New', 'Contacted', 'Interested', 'Converted', 'Lost'], 
        default: 'New' 
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
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
    activityLog: [{
        action: String,
        note: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],
    followUpDate: { type: Date },
    convertedAt: { type: Date },
    revenue: { type: Number, default: 0 },
    referralCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);
