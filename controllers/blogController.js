const Blog = require('../models/Blog');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Get all blogs
exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: blogs.length, data: blogs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get single blog
exports.getBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create blog
exports.createBlog = async (req, res) => {
    try {
        // Simple manual slug check if duplicate title
        const existing = await Blog.findOne({ title: req.body.title });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A blog with this title already exists!' });
        }

        if (req.file) {
          try {
            req.body.image = await uploadToCloudinary(req.file.buffer, 'ruzann/blogs');
          } catch (uploadErr) {
            console.error("Blog Image Upload Error:", uploadErr);
          }
        }

        const blog = await Blog.create(req.body);
        res.status(201).json({ success: true, data: blog });
    } catch (err) {
        console.error("CREATE BLOG ERROR:", err);
        res.status(400).json({ success: false, message: err.message || 'Error creating blog' });
    }
};

// Update blog
exports.updateBlog = async (req, res) => {
    try {
        // If title changed, update slug
        if (req.body.title) {
            req.body.slug = req.body.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        if (req.file) {
          try {
            req.body.image = await uploadToCloudinary(req.file.buffer, 'ruzann/blogs');
          } catch (uploadErr) {
            console.error("Blog Image Update Error:", uploadErr);
          }
        }
        
        const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
