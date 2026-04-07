const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String },
  pdfUrl: { type: String },
  duration: { type: String },
  order: { type: Number, default: 0 },
});

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  lessons: [LessonSchema]
});

const BootcampSchema = new mongoose.Schema({
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
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
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
  meetingLink: {
    type: String,
    trim: true,
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  modules: [ModuleSchema]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Bootcamp', BootcampSchema);
