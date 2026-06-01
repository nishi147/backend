const mongoose = require('mongoose');

const AssessmentSubmissionSchema = new mongoose.Schema({
    parentName: { 
        type: String, 
        required: true,
        trim: true 
    },
    mobile: { 
        type: String, 
        required: true,
        trim: true 
    },
    email: { 
        type: String, 
        trim: true,
        lowercase: true
    },
    studentName: { 
        type: String, 
        required: true,
        trim: true 
    },
    age: { 
        type: Number, 
        required: true 
    },
    class: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true,
        trim: true 
    },
    answers: { 
        type: Map, 
        of: mongoose.Schema.Types.Mixed 
    },
    score: { 
        type: Number, 
        required: true 
    },
    category: { 
        type: String, 
        required: true,
        enum: ['Future Innovator', 'AI Explorer', 'Creative Problem Solver', 'Future Starter']
    },
    recommendedProgram: { 
        type: String, 
        required: true 
    },
    submittedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentSubmission', AssessmentSubmissionSchema);
