const express = require('express');
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getMyBootcamps
} = require('../controllers/bootcampController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

router.get('/my-bootcamps', protect, getMyBootcamps);

router.route('/')
  .get(getBootcamps)
  .post(protect, authorize('admin', 'teacher'), upload.single('image'), createBootcamp);

router.route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('admin', 'teacher'), upload.single('image'), updateBootcamp)
  .delete(protect, authorize('admin', 'teacher'), deleteBootcamp);

module.exports = router;
