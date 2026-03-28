const express = require('express');
const {
  getWorkshops,
  getWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getMyWorkshops,
  getWorkshopSlots,
  createWorkshopSlot,
  updateWorkshopSlot,
  deleteWorkshopSlot
} = require('../controllers/workshopController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/my-workshops', protect, getMyWorkshops);

// Workshop Slot Routes
router.route('/:workshopId/slots')
  .get(getWorkshopSlots)
  .post(protect, authorize('admin'), createWorkshopSlot);

router.route('/:workshopId/slots/:slotId')
  .put(protect, authorize('admin'), updateWorkshopSlot)
  .delete(protect, authorize('admin'), deleteWorkshopSlot);

router.route('/')
  .get(getWorkshops)
  .post(protect, authorize('admin'), createWorkshop);

router.route('/:id')
  .get(getWorkshop)
  .put(protect, authorize('admin'), updateWorkshop)
  .delete(protect, authorize('admin'), deleteWorkshop);

module.exports = router;
