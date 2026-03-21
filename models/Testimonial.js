const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  role: {
    type: String,
    enum: ['Student', 'Parent', 'Other'],
    default: 'Student'
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  image: String,
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);
