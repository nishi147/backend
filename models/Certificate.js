const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateId: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    pdfUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
