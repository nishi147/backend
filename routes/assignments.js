const express = require('express');
const { 
    createAssignment, 
    updateAssignment,
    deleteAssignment,
    getAssignmentsByCourse, 
    getTeacherAssignments,
    submitAssignment, 
    gradeSubmission 
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher', 'admin'), createAssignment);
router.get('/teacher/my-assignments', authorize('teacher', 'admin'), getTeacherAssignments);
router.get('/course/:courseId', getAssignmentsByCourse);
router.post('/:id/submit', authorize('student'), submitAssignment);
router.put('/:id', authorize('teacher', 'admin'), updateAssignment);
router.delete('/:id', authorize('teacher', 'admin'), deleteAssignment);
router.put('/submissions/:id/grade', authorize('teacher', 'admin'), gradeSubmission);

module.exports = router;
