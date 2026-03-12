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
        const enrollments = await Enrollment.find({ student: req.user.id });
        const enrolledCourseIds = enrollments.map(e => e.course);
        
        console.log("Enrolled Course IDs: ", enrolledCourseIds);

        const classes = await LiveClass.find({
            course: { $in: enrolledCourseIds },
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
// @access  Private (Teacher)
exports.createLiveClass = async (req, res) => {
    try {
        req.body.teacher = req.user.id;
        
        const course = await Course.findById(req.body.course);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const liveClass = await LiveClass.create(req.body);
        res.status(201).json({ success: true, data: liveClass });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
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
