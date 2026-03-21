const Review = require('../models/Review');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private (Student)
exports.createReview = async (req, res) => {
    try {
        const review = await Review.create({
            student: req.user.id,
            ...req.body
        });
        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get reviews for a course
// @route   GET /api/reviews/course/:courseId
// @access  Public
exports.getCourseReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ course: req.params.courseId, isApproved: true })
            .populate('student', 'name profilePicture');
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
