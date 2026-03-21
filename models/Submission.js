const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    content: { type: String },
    attachmentUrl: { type: String },
    status: { type: String, enum: ['Pending', 'Graded'], default: 'Pending' },
    grade: { type: String },
    feedback: { type: String },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
