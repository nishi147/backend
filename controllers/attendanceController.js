const Attendance = require('../models/Attendance');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private (Teacher/Admin)
exports.markAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.create(req.body);
        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get attendance for a student in a course
// @route   GET /api/attendance/student/:studentId/course/:courseId
// @access  Private
exports.getStudentAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ 
            student: req.params.studentId,
            course: req.params.courseId
        });
        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
