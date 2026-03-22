const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private (Teacher/Admin)
exports.createQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.create({
            ...req.body,
            creator: req.user.id
        });
        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get quizzes created by the current teacher
// @route   GET /api/quizzes/teacher/my-quizzes
// @access  Private (Teacher/Admin)
exports.getTeacherQuizzes = async (req, res) => {
    try {
        // Admins see all, teachers see their own
        const filter = req.user.role === 'admin' ? {} : { creator: req.user.id };
        const quizzes = await Quiz.find(filter).populate('course', 'title');
        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get quizzes for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
exports.getQuizzesByCourse = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ course: req.params.courseId });
        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/attempt
// @access  Private (Student)
exports.submitQuizAttempt = async (req, res) => {
    try {
        const { answers } = req.body;
        const quiz = await Quiz.findById(req.params.id);
        
        let score = 0;
        let totalPoints = 0;

        quiz.questions.forEach((q, index) => {
            totalPoints += q.points;
            if (answers[index] === q.correctOption) {
                score += q.points;
            }
        });

        const passed = (score / totalPoints) * 100 >= quiz.passingScore;

        const attempt = await QuizAttempt.create({
            student: req.user.id,
            quiz: quiz._id,
            score,
            totalPoints,
            passed
        });

        res.status(201).json({ success: true, data: attempt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Teacher/Admin)
exports.updateQuiz = async (req, res) => {
    try {
        let quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Teacher/Admin)
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await quiz.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
