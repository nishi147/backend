const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, data: users });
    } catch (error) {
         res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Approve Teacher
// @route   PUT /api/users/approve-teacher/:id
// @access  Private/Admin
exports.approveTeacher = async (req, res) => {
     try {
         const user = await User.findByIdAndUpdate(req.params.id, { isApprovedTeacher: true }, { new: true });
         res.status(200).json({ success: true, data: user });
     } catch (error) {
         res.status(500).json({ success: false, message: 'Server error' });
     }
}

// @desc    Approve Student
// @route   PUT /api/users/approve-student/:id
// @access  Private/Admin
exports.approveStudent = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isApprovedStudent: true }, { new: true });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// @desc    Get Platform Analytics
// @route   GET /api/users/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const courseCount = await Course.countDocuments();
        const enrollmentCount = await Enrollment.countDocuments();
        
        const payments = await Payment.find({ status: 'success' });
        const revenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

        res.status(200).json({
            success: true,
            data: {
                totalStudents: studentCount,
                totalTeachers: teacherCount,
                totalCourses: courseCount,
                totalEnrollments: enrollmentCount,
                totalRevenue: revenue
            }
        });
    } catch (error) {
         res.status(500).json({ success: false, message: 'Server error' });
    }
}
