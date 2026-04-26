const express = require('express');
const { 
    createRegistration, 
    getRegistrations, 
    getRegistration 
} = require('../controllers/studentRegistrationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public can create (before payment)
router.post('/', createRegistration);

// Admin only can view
router.get('/', protect, authorize('admin'), getRegistrations);
router.get('/:id', protect, authorize('admin'), getRegistration);

module.exports = router;
