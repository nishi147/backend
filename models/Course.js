const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String }, // Can be uploaded file or link
    pdfUrl: { type: String }, // Can be uploaded pdf
    duration: { type: String }, // Optional duration e.g. "12m"
    order: { type: Number, default: 0 },
});

const ModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    thumbnail: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // By Admin
    
    // New Fields
    slug: { type: String },
    level: { type: String, default: 'Beginner' },
    language: { type: String, default: 'English' },
    totalLessons: { type: Number, default: 0 },
    totalDuration: { type: String },
    shortDescription: { type: String },
    regularPrice: { type: Number, default: 0 },
    offerPrice: { type: Number, default: 0 },

    // Session Pricing (Existing)
    numberOfSessions: { type: Number, required: true, default: 1 },
    pricePerSession: { type: Number, required: true, default: 0 },
    totalCoursePrice: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number },
    
    modules: [ModuleSchema]
}, { timestamps: true });

// Pre-save to calculate total price
CourseSchema.pre('save', async function() {
    this.totalCoursePrice = this.numberOfSessions * this.pricePerSession;
});

module.exports = mongoose.model('Course', CourseSchema);
