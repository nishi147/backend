const mongoose = require('mongoose');

const WorkshopSlotSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: [true, 'Please provide a workshop ID'],
  },
  date: {
    type: Date,
    required: [true, 'Please provide a slot date'],
  },
  startTime: {
    type: String,
    required: [true, 'Please provide a start time (e.g., 10:00 AM)'],
  },
  endTime: {
    type: String,
    required: [true, 'Please provide an end time (e.g., 12:00 PM)'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide maximum capacity'],
    min: [1, 'Capacity must be at least 1'],
  },
  bookedCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create a compound index to easily prevent duplicates
WorkshopSlotSchema.index({ workshop: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('WorkshopSlot', WorkshopSlotSchema);
