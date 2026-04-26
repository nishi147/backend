const mongoose = require('mongoose');

const StudentDetailSchema = new mongoose.Schema({
    name: { type: String, required: true },
    parentName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    place: { type: String, required: true },
    occupation: { type: String, required: true },
    age: { type: String },
    
    // Links
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
    bootcamp: { type: mongoose.Schema.Types.ObjectId, ref: 'Bootcamp' },
    
    type: { type: String, enum: ['workshop', 'bootcamp'], required: true },
    amount: { type: Number },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    
    // Razorpay info
    orderId: { type: String },
    paymentId: { type: String },
    
}, { timestamps: true });

module.exports = mongoose.model('StudentDetail', StudentDetailSchema);
