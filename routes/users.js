const express = require('express');
const { getUsers, approveTeacher, approveStudent, getAnalytics, deleteUser, createMentor, updateMentor, updateRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', authorize('admin', 'sales'), getUsers);
router.get('/analytics', authorize('admin'), getAnalytics);
router.put('/approve-teacher/:id', authorize('admin'), approveTeacher);
router.put('/approve-student/:id', authorize('admin'), approveStudent);
router.put('/:id/role', authorize('admin'), updateRole);

// Mentor Management
router.post('/mentors', authorize('admin'), upload.single('profilePicture'), createMentor);
router.put('/mentors/:id', authorize('admin'), upload.single('profilePicture'), updateMentor);

router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
