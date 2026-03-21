const express = require('express');
const { 
    markAttendance, 
    getStudentAttendance 
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher', 'admin'), markAttendance);
router.get('/student/:studentId/course/:courseId', getStudentAttendance);

module.exports = router;
