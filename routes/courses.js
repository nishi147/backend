const express = require('express');
const { 
    getCourses, 
    getCourse, 
    createCourse, 
    updateCourse, 
    deleteCourse,
    getTeacherCourses,
    getAllCoursesAdmin,
    approveCourse
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');


const router = express.Router();

// Teacher Routes
router.get('/teacher/my-courses', protect, authorize('teacher'), getTeacherCourses);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), getAllCoursesAdmin);
router.put('/admin/approve/:id', protect, authorize('admin'), approveCourse);

// Public Routes
router.route('/')
    .get(getCourses)
    .post(protect, authorize('teacher', 'admin'), upload.single('thumbnail'), createCourse);


router.route('/:id')
    .get(getCourse)
    .put(protect, authorize('teacher', 'admin'), updateCourse)
    .delete(protect, authorize('teacher', 'admin'), deleteCourse);

module.exports = router;
