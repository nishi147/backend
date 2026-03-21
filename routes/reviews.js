const express = require('express');
const { createReview, getCourseReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/course/:courseId', getCourseReviews);

module.exports = router;
