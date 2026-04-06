const mongoose = require('mongoose');

const BootcampBookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    bootcamp: { type: mongoose.Schema.Types.ObjectId, ref: 'Bootcamp', required: true },
    guestName: { type: String },
    guestEmail: { type: String },
    guestPhone: { type: String },
    guestAge: { type: String },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
}, { timestamps: true });

module.exports = mongoose.model('BootcampBooking', BootcampBookingSchema);
