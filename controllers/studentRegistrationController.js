const StudentRegistration = require('../models/StudentRegistration');

// @desc    Create a new student registration (pending)
// @route   POST /api/student-registrations
// @access  Public (or Private if logged in)
exports.createRegistration = async (req, res) => {
    try {
        console.log("[STUDENT REG] Received registration request:", req.body);
        const { 
            type, 
            itemId, 
            itemName, 
            name, 
            parentName, 
            phone, 
            email, 
            place, 
            occupation, 
            age,
            amount
        } = req.body;

        if (!type || !itemId || !name || !parentName || !phone || !email) {
            console.warn("[STUDENT REG] Missing required fields");
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const registration = await StudentRegistration.create({
            user: req.user ? req.user.id : undefined,
            type,
            itemId,
            itemName,
            name,
            parentName,
            phone,
            email: email.toLowerCase().trim(),
            place,
            occupation,
            age,
            amount,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            data: registration
        });
    } catch (error) {
        console.error("Create Registration Error:", error);
        
        // Handle Mongoose Validation Error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        // Handle Cast Error (e.g. invalid ObjectId)
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: `Invalid ${error.path}: ${error.value}` });
        }

        res.status(500).json({ success: false, message: 'Server error while creating registration' });
    }
};

// @desc    Get all student registrations
// @route   GET /api/student-registrations
// @access  Private (Admin)
exports.getRegistrations = async (req, res) => {
    try {
        const registrations = await StudentRegistration.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error("Get Registrations Error:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching registrations' });
    }
};

// @desc    Get single registration
// @route   GET /api/student-registrations/:id
// @access  Private (Admin)
exports.getRegistration = async (req, res) => {
    try {
        const registration = await StudentRegistration.findById(req.params.id)
            .populate('user', 'name email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        res.status(200).json({
            success: true,
            data: registration
        });
    } catch (error) {
        console.error("Get Registration Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
