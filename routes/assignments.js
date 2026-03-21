const express = require('express');
const { 
    createAssignment, 
    getAssignmentsByCourse, 
    submitAssignment, 
    gradeSubmission 
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher', 'admin'), createAssignment);
router.get('/course/:courseId', getAssignmentsByCourse);
router.post('/:id/submit', authorize('student'), submitAssignment);
router.put('/submissions/:id/grade', authorize('teacher', 'admin'), gradeSubmission);

module.exports = router;
