const mongoose = require('mongoose');

const BootcampBookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bootcamp: { type: mongoose.Schema.Types.ObjectId, ref: 'Bootcamp', required: true },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
}, { timestamps: true });

module.exports = mongoose.model('BootcampBooking', BootcampBookingSchema);
