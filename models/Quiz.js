const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true }, // Index of options
    points: { type: Number, default: 1 }
});

const QuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [QuestionSchema],
    passingScore: { type: Number, default: 70 }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
