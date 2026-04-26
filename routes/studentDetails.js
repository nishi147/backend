const express = require('express');
const router = express.Router();
const StudentDetail = require('../models/StudentDetail');
const { protect, authorize } = require('../middleware/auth');

// @desc    Create Student Detail (Before Payment)
// @route   POST /api/student-details
// @access  Public (But usually authenticated in our app)
router.post('/', async (req, res) => {
    try {
        const { 
            name, 
            parentName, 
            phone, 
            email, 
            place, 
            occupation, 
            age, 
            workshopId, 
            bootcampId, 
            type,
            amount 
        } = req.body;

        console.log('--- STUDENT DETAIL POST RECEIVED ---', req.body);
        const studentDetail = await StudentDetail.create({
            name,
            parentName,
            phone,
            email,
            place,
            occupation,
            age,
            workshop: type === 'workshop' ? workshopId : undefined,
            bootcamp: type === 'bootcamp' ? bootcampId : undefined,
            type,
            amount,
            user: req.user ? req.user.id : undefined,
            paymentStatus: 'pending'
        });

        res.status(201).json({
            success: true,
            data: studentDetail
        });
    } catch (error) {
        console.error('--- STUDENT DETAIL ERROR ---', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

// @desc    Get all Student Details (Admin)
// @route   GET /api/student-details
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const details = await StudentDetail.find()
            .populate('workshop', 'title')
            .populate('bootcamp', 'title')
            .sort('-createdAt');
            
        res.status(200).json({
            success: true,
            count: details.length,
            data: details
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
