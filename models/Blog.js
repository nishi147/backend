const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, // URL or path
    author: { type: String, default: 'Ruzann Team' },
    category: { type: String, default: 'General' },
    readTime: { type: String, default: '5 min read' },
    isPublished: { type: Boolean, default: true },
    videoUrl: { type: String }, // New field for video links
    slug: { type: String, unique: true },
    tags: [{ type: String }]
}, { timestamps: true });

// Pre-save to create slug if not provided
BlogSchema.pre('save', async function() {
    if (!this.slug) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
});

module.exports = mongoose.model('Blog', BlogSchema);
