const mongoose = require('mongoose');

const WorkshopBookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkshopSlot' }, 
    guestName: { type: String },
    guestEmail: { type: String },
    guestPhone: { type: String },
    guestAge: { type: String },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
}, { timestamps: true });

module.exports = mongoose.model('WorkshopBooking', WorkshopBookingSchema);
