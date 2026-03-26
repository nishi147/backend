const express = require('express');
const {
  getWorkshops,
  getWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getMyWorkshops,
} = require('../controllers/workshopController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/my-workshops', protect, getMyWorkshops);

router.route('/')
  .get(getWorkshops)
  .post(protect, authorize('admin'), createWorkshop);

router.route('/:id')
  .get(getWorkshop)
  .put(protect, authorize('admin'), updateWorkshop)
  .delete(protect, authorize('admin'), deleteWorkshop);

module.exports = router;
