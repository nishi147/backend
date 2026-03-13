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
