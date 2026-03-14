const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a project title'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'Please add a Scratch project URL'],
        trim: true
    },
    studentName: {
        type: String,
        required: [true, 'Please add student name']
    },
    description: {
        type: String,
        required: [true, 'Please add a project description']
    },
    thumbnail: {
        type: String,
        default: ''
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional if added by admin or guest-style
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
