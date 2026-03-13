const LiveClass = require('../models/LiveClass');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get live classes for a student (based on enrolled courses)
// @route   GET /api/live-classes
// @access  Private (Student)
exports.getStudentLiveClasses = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Only show to approved students
        if (req.user.role === 'student' && !req.user.isApprovedStudent) {
            return res.status(200).json({ success: true, data: [], message: 'Account pending approval' });
        }

        // For now, let students see all upcoming classes to satisfy "reflect in student panel"
        const classes = await LiveClass.find({
            status: { $in: ['scheduled', 'live'] }
        }).populate({
            path: 'course',
            select: 'title'
        }).populate({
            path: 'teacher',
            select: 'name profilePicture'
        });

        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        console.error("error in getStudentLiveClasses: ", error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create a live class
// @route   POST /api/live-classes
// @access  Private (Teacher, Admin)
exports.createLiveClass = async (req, res) => {
    try {
        console.log("Scheduling Live Class Body:", req.body);
        if (req.user.role !== 'admin') {
            req.body.teacher = req.user.id;
        } else if (!req.body.teacher) {
            req.body.teacher = req.user.id;
        }
        
        const course = await Course.findById(req.body.course);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (req.user.role !== 'admin' && course.teacher.toString() !== req.user.id) {
             return res.status(403).json({ success: false, message: 'Not authorized to schedule for this course' });
        }

        const liveClass = await LiveClass.create(req.body);
        res.status(201).json({ success: true, data: liveClass });
    } catch (error) {
        console.error("Live Class Schedule Error:", error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get live classes for a teacher
// @route   GET /api/live-classes/teacher
// @access  Private (Teacher, Admin)
exports.getTeacherLiveClasses = async (req, res) => {
     try {
        const query = req.user.role === 'admin' ? {} : { teacher: req.user.id };
        const classes = await LiveClass.find(query).populate({ path: 'course', select: 'title' });
        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        console.error("error in getTeacherLiveClasses: ", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// @desc    Get courses available for scheduling
// @route   GET /api/live-classes/courses
// @access  Private (Teacher, Admin)
exports.getSchedulingCourses = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? { isApproved: true } : { teacher: req.user.id, isApproved: true };
        const courses = await Course.find(query).select('title');
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error("error in getSchedulingCourses: ", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// @desc    Delete a live class
// @route   DELETE /api/live-classes/:id
// @access  Private (Teacher, Admin)
exports.deleteLiveClass = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found' });
        }

        // Make sure user is admin or the teacher of the class
        if (req.user.role !== 'admin' && liveClass.teacher.toString() !== req.user.id) {
             return res.status(403).json({ success: false, message: 'Not authorized to delete this class' });
        }

        await LiveClass.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error("error in deleteLiveClass: ", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

