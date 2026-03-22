const express = require('express');
const { 
    createQuiz, 
    updateQuiz,
    deleteQuiz,
    getQuizzesByCourse, 
    getTeacherQuizzes,
    submitQuizAttempt 
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher', 'admin'), createQuiz);
router.get('/teacher/my-quizzes', authorize('teacher', 'admin'), getTeacherQuizzes);
router.get('/course/:courseId', getQuizzesByCourse);
router.post('/:id/attempt', authorize('student'), submitQuizAttempt);
router.put('/:id', authorize('teacher', 'admin'), updateQuiz);
router.delete('/:id', authorize('teacher', 'admin'), deleteQuiz);

module.exports = router;
