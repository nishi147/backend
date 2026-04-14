const express = require('express');
const {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    addNote,
    exportLeads,
    assignLead,
    getSalesPerformance,
    shareLeads
} = require('../controllers/leadController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

// IMPORTANT: specific routes must come before /:id wildcards
router.get('/performance', protect, authorize('admin'), getSalesPerformance);
router.post('/share', protect, authorize('admin'), upload.single('leadFile'), shareLeads);
router.get('/export', protect, authorize('admin', 'sales'), exportLeads);

router.route('/')
    .get(protect, authorize('admin', 'sales'), getLeads)
    .post(createLead); // Public for lead capture

router.route('/:id')
    .get(protect, authorize('admin', 'sales'), getLead)
    .put(protect, authorize('admin', 'sales'), updateLead)
    .delete(protect, authorize('admin'), deleteLead);

router.route('/:id/assign')
    .put(protect, authorize('admin'), assignLead);

router.route('/:id/notes')
    .post(protect, authorize('admin', 'sales'), addNote);

module.exports = router;
