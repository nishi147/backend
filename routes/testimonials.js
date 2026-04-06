const express = require('express');
const { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

router.get('/', getTestimonials);

router.use(protect);
router.use(authorize('admin'));

router.post('/', upload.single('image'), createTestimonial);
router.put('/:id', upload.single('image'), updateTestimonial);
router.delete('/:id', deleteTestimonial);

module.exports = router;
