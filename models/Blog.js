const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, // URL or path
    imageAlt: { type: String, default: '' },
    videoUrl: { type: String },
    
    // SEO Fields
    metaTitle: { type: String },
    metaDescription: { type: String, maxLength: 160 },
    keywords: [{ type: String }],
    
    // Stats
    author: { type: String, default: 'Ruzann Team' },
    category: { type: String, default: 'General' },
    readingTime: { type: Number, default: 0 }, // in minutes
    readTimeText: { type: String }, // e.g., "5 min read"
    wordCount: { type: Number, default: 0 },
    
    // Extra SEO Content
    faqs: [{
        question: { type: String },
        answer: { type: String }
    }],
    
    isPublished: { type: Boolean, default: true },
    tags: [{ type: String }]
}, { timestamps: true });

// Pre-save to create slug if not provided and normalize data
BlogSchema.pre('save', async function() {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
});

module.exports = mongoose.model('Blog', BlogSchema);
