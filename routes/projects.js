const express = require('express');
const {
    getProjects,
    getAllProjectsAdmin,
    getMyProjects,
    createProject,
    approveProject,
    deleteProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route
router.get('/', getProjects);

// Protected routes
router.post('/', protect, createProject);
router.get('/my-projects', protect, authorize('student'), getMyProjects);
router.delete('/:id', protect, deleteProject);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllProjectsAdmin);
router.put('/admin/approve/:id', protect, authorize('admin'), approveProject);

module.exports = router;
