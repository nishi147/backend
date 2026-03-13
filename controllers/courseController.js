const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get all published approved courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true, isApproved: true }).populate({
            path: 'teacher',
            select: 'name profilePicture'
        });
        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate({ path: 'teacher', select: 'name profilePicture' });
        
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Teacher, Admin)
exports.createCourse = async (req, res) => {
    try {
        console.log("Creating Course Request Body:", req.body);
        
        // Add user to req.body
        req.body.teacher = req.user.id;
        
        // Ensure price calculations
        const num = Number(req.body.numberOfSessions) || 0;
        const price = Number(req.body.pricePerSession) || 0;
        req.body.totalCoursePrice = num * price;

        // Handle File Upload
        if (req.file) {
            req.body.thumbnail = `/uploads/${req.file.filename}`;
        }

        const course = await Course.create(req.body);


        res.status(201).json({ success: true, data: course });
    } catch (error) {
        console.error("Course Create Error Full Details:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message,
            validationErrors: error.errors ? Object.keys(error.errors) : []
        });
    }
};

// @desc    Get courses for current teacher
// @route   GET /api/courses/teacher/my-courses
// @access  Private (Teacher)
exports.getTeacherCourses = async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Teacher, Admin)
exports.updateCourse = async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Make sure user is course owner or admin
        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update course' });
        }

        // Update the total course price if sessions or price changed
        if (req.body.numberOfSessions || req.body.pricePerSession) {
            const num = req.body.numberOfSessions || course.numberOfSessions;
            const price = req.body.pricePerSession || course.pricePerSession;
            req.body.totalCoursePrice = num * price;
        }

        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Teacher, Admin)
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete course' });
        }

        await course.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin routes
// @desc    Get all courses (including unapproved)
// @route   GET /api/courses/admin/all
// @access  Private (Admin)
exports.getAllCoursesAdmin = async (req, res) => {
    try {
        const courses = await Course.find().populate({ path: 'teacher', select: 'name' });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.approveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
