const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const filter = req.query.role ? { role: req.query.role } : {};
        const users = await User.find(filter);
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
            .select('name profilePicture specialization bio');
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

// @desc    Create Mentor/Teacher (Admin only)
// @route   POST /api/users/mentors
// @access  Private/Admin
exports.createMentor = async (req, res) => {
    try {
        const { name, email, password, specialization, bio } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        let profilePicture = req.body.profilePicture || '';
        if (req.file) {
          try {
            profilePicture = await uploadToCloudinary(req.file.buffer, 'ruzann/profiles');
          } catch (err) {
            console.error("Mentor profile picture upload failed:", err);
          }
        }

        user = await User.create({
            name,
            email,
            password,
            role: 'teacher',
            isApprovedTeacher: true,
            specialization,
            bio,
            profilePicture
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update Mentor/Teacher (Admin only)
// @route   PUT /api/users/mentors/:id
// @access  Private/Admin
exports.updateMentor = async (req, res) => {
    try {
        const { name, specialization, bio, isApprovedTeacher } = req.body;
        
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        let profilePicture = req.body.profilePicture || user.profilePicture;
        if (req.file) {
          try {
            profilePicture = await uploadToCloudinary(req.file.buffer, 'ruzann/profiles');
          } catch (err) {
            console.error("Mentor profile picture update failed:", err);
          }
        }

        user = await User.findByIdAndUpdate(req.params.id, {
            name,
            specialization,
            bio,
            profilePicture,
            isApprovedTeacher
        }, { new: true, runValidators: true });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

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
        const [
            studentCount,
            teacherCount,
            courseCount,
            enrollmentCount,
            revenueData
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            Course.countDocuments(),
            Enrollment.countDocuments(),
            Payment.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalStudents: studentCount,
                totalTeachers: teacherCount,
                totalCourses: courseCount,
                totalEnrollments: enrollmentCount,
                totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0
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

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['student', 'teacher', 'admin', 'sales'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get Detailed Teacher Profile (Public)
// @route   GET /api/mentors/:id
// @access  Public
exports.getTeacherDetail = async (req, res) => {
    try {
        const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
            .select('name profilePicture specialization bio');

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Fetch associated learning assets
        const [courses, workshops, bootcamps] = await Promise.all([
            Course.find({ teacher: teacher._id, isPublished: true, isApproved: true })
                .select('title thumbnail pricePerSession numberOfSessions totalCoursePrice category rating studentsEnrolled showStudentsEnrolled')
                .populate('category', 'name icon'),
            require('../models/Workshop').find({ instructor: teacher._id, status: 'upcoming' }),
            require('../models/Bootcamp').find({ instructor: teacher._id, status: 'upcoming' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                profile: teacher,
                courses,
                workshops,
                bootcamps
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update own profile (name, phone, bio, profilePicture)
// @route   PUT /api/users/me
// @access  Private (student/teacher)
exports.updateMyProfile = async (req, res) => {
    try {
        const { name, phone, bio, specialization } = req.body;
        const updateFields = {};
        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (bio !== undefined) updateFields.bio = bio;
        if (specialization !== undefined) updateFields.specialization = specialization;

        if (req.file) {
            try {
                updateFields.profilePicture = await uploadToCloudinary(req.file.buffer, 'ruzann/profiles');
            } catch (err) {
                console.error('Profile picture upload failed:', err);
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
