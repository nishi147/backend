const Category = require('../models/Category');
const Course = require('../models/Course');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        
        // Bonus: Add course count for each category
        const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
            const count = await Course.countDocuments({ category: cat._id });
            return {
                ...cat.toObject(),
                courseCount: count
            };
        }));

        res.status(200).json({ success: true, count: categories.length, data: categoriesWithCount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
    try {
        if (req.file) {
          try {
            req.body.image = await uploadToCloudinary(req.file.buffer, 'ruzann/categories');
          } catch (uploadErr) {
            console.error("Category Image Upload Error:", uploadErr);
          }
        }
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
    try {
        if (req.file) {
          try {
            req.body.image = await uploadToCloudinary(req.file.buffer, 'ruzann/categories');
          } catch (uploadErr) {
            console.error("Category Image Update Error:", uploadErr);
          }
        }
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if courses are using this category
        const courseCount = await Course.countDocuments({ category: req.params.id });
        if (courseCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete category: ${courseCount} courses are assigned to it.` 
            });
        }

        await category.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
