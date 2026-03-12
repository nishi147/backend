const express = require('express');
const { getUsers, approveTeacher, getAnalytics } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/analytics', getAnalytics);
router.put('/approve-teacher/:id', approveTeacher);

module.exports = router;
