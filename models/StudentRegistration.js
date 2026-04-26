const mongoose = require('mongoose');

const StudentRegistrationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['bootcamp', 'workshop'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // bootcampId or workshopId
    itemName: { type: String },
    
    // Details from form
    name: { type: String, required: true },
    parentName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    place: { type: String, required: true },
    occupation: { type: String, required: true },
    age: { type: String },
    
    paymentId: { type: String },
    orderId: { type: String },
    amount: { type: Number },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('StudentRegistration', StudentRegistrationSchema);
