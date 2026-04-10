const express = require('express');
const router = express.Router();
const { getBlogs, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const upload = require('../utils/upload');

router.get('/', getBlogs);
router.get('/:id', getBlog);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createBlog);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;
