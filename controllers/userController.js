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

// @desc    Get all approved teachers
// @route   GET /api/users/teachers
// @access  Public
exports.getApprovedTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher', isApprovedTeacher: true })
            .select('name profilePicture specialization');
        res.status(200).json({ success: true, data: teachers });
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
// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deleting yourself (admin)
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
