const express = require('express');
const { getStudentLiveClasses, createLiveClass, getTeacherLiveClasses } = require('../controllers/liveClassController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('student'), getStudentLiveClasses);
router.post('/', protect, authorize('teacher', 'admin'), createLiveClass);
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherLiveClasses);

module.exports = router;
