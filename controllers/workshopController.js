const Workshop = require('../models/Workshop');

// @desc    Get all workshops
// @route   GET /api/workshops
// @access  Public
exports.getWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find().sort({ date: 1 });
    res.status(200).json({ success: true, count: workshops.length, data: workshops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single workshop
// @route   GET /api/workshops/:id
// @access  Public
exports.getWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }
    res.status(200).json({ success: true, data: workshop });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create workshop
// @route   POST /api/workshops
// @access  Private (Admin)
exports.createWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.create(req.body);
    res.status(201).json({ success: true, data: workshop });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update workshop
// @route   PUT /api/workshops/:id
// @access  Private (Admin)
exports.updateWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }
    res.status(200).json({ success: true, data: workshop });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete workshop
// @route   DELETE /api/workshops/:id
// @access  Private (Admin)
exports.deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }
    await workshop.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get logged in user's booked workshops
// @route   GET /api/workshops/my-workshops
// @access  Private
exports.getMyWorkshops = async (req, res) => {
  try {
    const WorkshopBooking = require('../models/WorkshopBooking');
    const Booking = require('../models/Booking');
    const User = require('../models/User');

    const user = await User.findById(req.user.id);

    // 1. Fetch specific Workshop Bookings
    const workshopBookings = await WorkshopBooking.find({ user: req.user.id })
                                                  .populate('workshop')
                                                  .sort({ createdAt: -1 });

    // 2. Fetch Intro Trial Bookings (matched by email/phone)
    const introBookings = await Booking.find({ 
      $or: [
        { email: { $regex: new RegExp(`^${user.email}$`, 'i') } },
        { phone: user.phone }
      ],
      status: 'completed'
    }).sort({ createdAt: -1 });

    // 3. Transform Intro Bookings into a similar format for the frontend
    const trials = introBookings.map(b => ({
      _id: b._id,
      isTrial: true,
      amount: b.amount,
      status: b.status, // Added status
      createdAt: b.createdAt,
      workshop: {
        title: "Intro Trial Session",
        description: "Your first deep-dive into coding & robotics!",
        date: b.createdAt, // Placeholder date
        venue: "Online (Standard Trial Link)",
        meetingLink: "https://zoom.us/j/ruzann-trial-session" // Fallback link
      }
    }));

    // Combine both
    const allBookings = [...workshopBookings, ...trials];

    res.status(200).json({ success: true, count: allBookings.length, data: allBookings });
  } catch (error) {
    console.error("getMyWorkshops Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// WORKSHOP SLOT CONTROLLERS
// ==========================================

const WorkshopSlot = require('../models/WorkshopSlot');

// @desc    Get all slots for a workshop
// @route   GET /api/workshops/:workshopId/slots
// @access  Public
exports.getWorkshopSlots = async (req, res) => {
  try {
    const slots = await WorkshopSlot.find({ workshop: req.params.workshopId }).sort({ date: 1, startTime: 1 });
    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new time slot
// @route   POST /api/workshops/:workshopId/slots
// @access  Private (Admin)
exports.createWorkshopSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity } = req.body;
    
    // Check for duplicate slot
    const existingSlot = await WorkshopSlot.findOne({
      workshop: req.params.workshopId,
      date: new Date(date).setHours(0,0,0,0), // ignore time for date match
      startTime
    });

    // Just let Mongo's unique index handle exact date/startTime/workshop duplicates, 
    // but a quick check helps with custom errors.
    
    let slotData = {
      workshop: req.params.workshopId,
      date,
      startTime,
      endTime,
      capacity
    };

    const slot = await WorkshopSlot.create(slotData);
    res.status(201).json({ success: true, data: slot });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A slot with this exact date and start time already exists.' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update a time slot
// @route   PUT /api/workshops/:workshopId/slots/:slotId
// @access  Private (Admin)
exports.updateWorkshopSlot = async (req, res) => {
  try {
    let slot = await WorkshopSlot.findById(req.params.slotId);
    
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (req.body.capacity && req.body.capacity < slot.bookedCount) {
      return res.status(400).json({ success: false, message: `Cannot reduce capacity below currently booked seats (${slot.bookedCount}).` });
    }

    slot = await WorkshopSlot.findByIdAndUpdate(req.params.slotId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a time slot
// @route   DELETE /api/workshops/:workshopId/slots/:slotId
// @access  Private (Admin)
exports.deleteWorkshopSlot = async (req, res) => {
  try {
    const slot = await WorkshopSlot.findById(req.params.slotId);
    
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (slot.bookedCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete a slot that already has bookings.' });
    }

    await slot.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
