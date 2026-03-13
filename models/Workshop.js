const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  image: {
    type: String,
    default: 'no-image.jpg',
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming',
  },
  venue: {
    type: String,
    required: [true, 'Please add a venue or online link'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Workshop', WorkshopSchema);
