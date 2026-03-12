const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    payment_id: { type: String, required: true }, // Razorpay payment ID
    order_id: { type: String, required: true },   // Razorpay order ID
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
    payment_date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
