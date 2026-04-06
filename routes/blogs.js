const express = require('express');
const router = express.Router();
const { getBlogs, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const upload = require('../utils/upload');

router.get('/', getBlogs);
router.get('/:id', getBlog);
router.post('/', upload.single('image'), createBlog);
router.put('/:id', upload.single('image'), updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;
