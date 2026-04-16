const Blog = require('../models/Blog');
const { uploadToCloudinary } = require('../utils/cloudinary');
const sharp = require('sharp');

// Helper to calculate reading time
const calculateReadTime = (text) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return {
        minutes,
        text: `${minutes} min read`,
        wordCount: words
    };
};

// Get all blogs
exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: blogs.length, data: blogs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get single blog (supports ID or slug)
exports.getBlog = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            $or: [
                { _id: req.params.id.length === 24 ? req.params.id : null },
                { slug: req.params.id }
            ].filter(Boolean)
        });
        
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create blog
exports.createBlog = async (req, res) => {
    try {
        const body = { ...req.body };
        
        // Handle FAQs if sent as string
        if (typeof body.faqs === 'string') {
            body.faqs = JSON.parse(body.faqs);
        }
        
        // Handle Keywords
        if (typeof body.keywords === 'string') {
            body.keywords = body.keywords.split(',').map(k => k.trim());
        }

        // Calculate Read Time & Word Count
        const stats = calculateReadTime(body.content || '');
        body.readingTime = stats.minutes;
        body.readTimeText = stats.text;
        body.wordCount = stats.wordCount;

        if (req.files) {
            if (req.files.image) {
                try {
                    // Compress image using sharp
                    const compressedBuffer = await sharp(req.files.image[0].buffer)
                        .resize(1200, 630, { fit: 'cover' }) // Optimized for Open Graph
                        .webp({ quality: 80 })
                        .toBuffer();
                    
                    body.image = await uploadToCloudinary(compressedBuffer, 'ruzann/blogs');
                } catch (uploadErr) {
                    console.error("Blog Image Upload Error:", uploadErr);
                    // Fallback to original buffer if sharp fails
                    body.image = await uploadToCloudinary(req.files.image[0].buffer, 'ruzann/blogs');
                }
            }
            if (req.files.video) {
                try {
                    body.videoUrl = await uploadToCloudinary(req.files.video[0].buffer, 'ruzann/blogs');
                } catch (uploadErr) {
                    console.error("Blog Video Upload Error:", uploadErr);
                }
            }
        }

        const blog = await Blog.create(body);
        res.status(201).json({ success: true, data: blog });
    } catch (err) {
        console.error("CREATE BLOG ERROR:", err);
        res.status(400).json({ success: false, message: err.message || 'Error creating blog' });
    }
};

// Update blog
exports.updateBlog = async (req, res) => {
    try {
        const body = { ...req.body };

        // Handle FAQs
        if (typeof body.faqs === 'string') {
            body.faqs = JSON.parse(body.faqs);
        }

        // Handle Keywords
        if (typeof body.keywords === 'string') {
            body.keywords = body.keywords.split(',').map(k => k.trim());
        }

        // Recalculate stats if content changed
        if (body.content) {
            const stats = calculateReadTime(body.content);
            body.readingTime = stats.minutes;
            body.readTimeText = stats.text;
            body.wordCount = stats.wordCount;
        }

        if (req.files) {
            if (req.files.image) {
                try {
                    const compressedBuffer = await sharp(req.files.image[0].buffer)
                        .resize(1200, 630, { fit: 'cover' })
                        .webp({ quality: 80 })
                        .toBuffer();
                    
                    body.image = await uploadToCloudinary(compressedBuffer, 'ruzann/blogs');
                } catch (uploadErr) {
                    console.error("Blog Image Update Error:", uploadErr);
                    body.image = await uploadToCloudinary(req.files.image[0].buffer, 'ruzann/blogs');
                }
            }
            if (req.files.video) {
                try {
                    body.videoUrl = await uploadToCloudinary(req.files.video[0].buffer, 'ruzann/blogs');
                } catch (uploadErr) {
                    console.error("Blog Video Update Error:", uploadErr);
                }
            }
        }
        
        const blog = await Blog.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        console.error("UPDATE BLOG ERROR:", err);
        res.status(400).json({ success: false, message: err.message || 'Error updating blog' });
    }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
