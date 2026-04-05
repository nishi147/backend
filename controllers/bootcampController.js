const Bootcamp = require('../models/Bootcamp');
const BootcampBooking = require('../models/BootcampBooking');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Get all bootcamps
// @route   GET /api/bootcamps
// @access  Public
exports.getBootcamps = async (req, res) => {
  try {
    console.log("--- Fetching All Bootcamps ---");
    const bootcamps = await Bootcamp.find().populate('instructor', 'name').sort({ date: 1 });
    console.log(`✓ Found ${bootcamps.length} bootcamps`);
    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
  } catch (error) {
    console.error("GET Bootcamps Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single bootcamp
// @route   GET /api/bootcamps/:id
// @access  Public
exports.getBootcamp = async (req, res) => {
  try {
    console.log(`--- Fetching Bootcamp: ${req.params.id} ---`);
    const bootcamp = await Bootcamp.findById(req.params.id).populate('instructor', 'name');
    if (!bootcamp) {
      return res.status(404).json({ success: false, message: 'Bootcamp not found' });
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (error) {
    console.error("GET Bootcamp By ID Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create bootcamp
// @route   POST /api/bootcamps
// @access  Private (Admin, Teacher)
exports.createBootcamp = async (req, res) => {
  try {
    console.log("--- Creating New Bootcamp ---");
    console.log("Body:", req.body);
    console.log("User:", req.user?.id);
    
    req.body.instructor = req.user.id;
    if (req.file) {
      try {
        console.log("Uploading bootcamp image to Cloudinary...");
        req.body.image = await uploadToCloudinary(req.file.buffer, 'ruzann/bootcamps');
        console.log("✓ Image uploaded:", req.body.image);
      } catch (uploadErr) {
        console.error("Bootcamp Image Upload Error:", uploadErr);
      }
    }
    const bootcamp = await Bootcamp.create(req.body);
    console.log("✓ Bootcamp created successfully:", bootcamp._id);
    res.status(201).json({ success: true, data: bootcamp });
  } catch (error) {
    console.error("CREATE Bootcamp Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update bootcamp
// @route   PUT /api/bootcamps/:id
// @access  Private (Admin, Teacher)
exports.updateBootcamp = async (req, res) => {
  try {
    let bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      return res.status(404).json({ success: false, message: 'Bootcamp not found' });
    }

    // Make sure user is bootcamp instructor or admin
    if (bootcamp.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this bootcamp' });
    }

    if (req.file) {
      try {
        req.body.image = await uploadToCloudinary(req.file.buffer, 'ruzann/bootcamps');
      } catch (uploadErr) {
        console.error("Bootcamp Image Update Error:", uploadErr);
      }
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: bootcamp });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete bootcamp
// @route   DELETE /api/bootcamps/:id
// @access  Private (Admin, Teacher)
exports.deleteBootcamp = async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      return res.status(404).json({ success: false, message: 'Bootcamp not found' });
    }

    // Make sure user is bootcamp instructor or admin
    if (bootcamp.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this bootcamp' });
    }

    await bootcamp.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get logged in student's booked bootcamps
// @route   GET /api/bootcamps/my-bootcamps
// @access  Private
exports.getMyBootcamps = async (req, res) => {
  try {
    const bookings = await BootcampBooking.find({ user: req.user.id })
                                            .populate({
                                              path: 'bootcamp',
                                              populate: { path: 'instructor', select: 'name' }
                                            })
                                            .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error("getMyBootcamps Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
