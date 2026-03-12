const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    parentName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    orderId: { type: String, required: true },
    paymentId: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    amount: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
