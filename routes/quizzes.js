const express = require('express');
const { 
    createQuiz, 
    getQuizzesByCourse, 
    submitQuizAttempt 
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher', 'admin'), createQuiz);
router.get('/course/:courseId', getQuizzesByCourse);
router.post('/:id/attempt', authorize('student'), submitQuizAttempt);

module.exports = router;
