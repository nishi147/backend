const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get all published approved courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true, isApproved: true })
            .populate({
                path: 'teacher',
                select: 'name profilePicture'
            })
            .populate('category');
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
            .populate({ path: 'teacher', select: 'name profilePicture' })
            .populate('category');
        
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
  console.log("--- COURSE CREATE DEBUG START ---");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    const title = req.body?.title;
    const category = req.body?.category;
    const description = req.body?.description;
    const numberOfSessions = Number(req.body?.numberOfSessions) || 1;
    const pricePerSession = Number(req.body?.pricePerSession) || 0;
    const ageGroup = req.body?.ageGroup || 'All';
    const courseType = req.body?.courseType || 'Group';
    const rating = Number(req.body?.rating) || 5.0;
    const studentsEnrolled = Number(req.body?.studentsEnrolled) || 0;

    // ✅ Validation
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // ✅ Thumbnail handling (URL only)
    const thumbnail = req.body?.thumbnail || "";

    // ✅ SAFE DATA (NO SPREAD)
    const courseData = {
      title,
      category,
      description,
      thumbnail,
      teacher: req.user?.id,
      numberOfSessions,
      pricePerSession,
      totalCoursePrice: numberOfSessions * pricePerSession,
      ageGroup,
      courseType,
      rating,
      studentsEnrolled
    };

    const course = await Course.create(courseData);

    console.log("--- COURSE CREATE SUCCESS ---");

    return res.status(201).json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error("--- COURSE CREATE CRASH ---");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Get courses for current teacher
// @route   GET /api/courses/teacher/my-courses
// @access  Private (Teacher)
exports.getTeacherCourses = async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id }).populate('category');
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get courses for current student (enrolled)
// @route   GET /api/courses/student/my-courses
// @access  Private (Student)
exports.getStudentCourses = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id }).populate({
            path: 'course',
            populate: { path: 'teacher', select: 'name profilePicture' }
        });
        
        const courses = enrollments.map(e => e.course).filter(Boolean);
        
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Teacher, Admin)
exports.updateCourse = async (req, res) => {
    // 1. Mandatory Debug Logging
    console.log("Body Keys:", Object.keys(req.body || {}));

    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            console.error("Update Failed: Course not found with ID", req.params.id);
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // 2. Authorization Check
        if (course.teacher.toString() !== req.user?.id && req.user?.role !== 'admin') {
            console.error("Update Failed: Non-authorized user attempt");
            return res.status(403).json({ success: false, message: 'Not authorized to update course' });
        }

        // 3. Safely parse FormData stringified arrays
        if (req.body?.modules && typeof req.body.modules === 'string') {
            try { 
                req.body.modules = JSON.parse(req.body.modules); 
                console.log("Parsed modules string to JSON successfully.");
            } 
            catch(err) { 
                console.error("JSON Parse Error for modules field:", err.message);
                return res.status(400).json({ success: false, message: 'Curriculum format is invalid.' }); 
            }
        }

        // 4. Thumbnail is now handled directly via req.body.thumbnail (JSON)

        // 5. Safe Price Recalculation
        if (req.body?.numberOfSessions || req.body?.pricePerSession) {
            const num = Number(req.body?.numberOfSessions || course.numberOfSessions);
            const price = Number(req.body?.pricePerSession || course.pricePerSession);
            req.body.totalCoursePrice = num * price;
        }

        // 6. DB Operation
        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        console.log("--- COURSE UPDATE SUCCESS ---");
        res.status(200).json({ success: true, data: course });

    } catch (error) {
        console.error("--- COURSE UPDATE CRASH ---");
        console.error(error);
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during course update',
            error: error.message 
        });
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
        const courses = await Course.find()
            .populate({ path: 'teacher', select: 'name' })
            .populate('category');
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
