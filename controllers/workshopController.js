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
