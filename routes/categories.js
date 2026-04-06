const express = require('express');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const upload = require('../utils/upload');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', upload.single('image'), createCategory);
router.put('/:id', upload.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
