const express = require('express');
const {
    submitAssessment,
    getAssessments
} = require('../controllers/assessmentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .post(submitAssessment) // Public endpoint for funnel submission
    .get(protect, authorize('admin', 'sales'), getAssessments); // Secured for admin/sales reporting

module.exports = router;
