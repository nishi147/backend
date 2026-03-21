const express = require('express');
const {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    addNote,
    exportLeads
} = require('../controllers/leadController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// IMPORTANT: specific routes must come before /:id wildcards
router.get('/export', protect, authorize('admin', 'sales'), exportLeads);

router.route('/')
    .get(protect, authorize('admin', 'sales'), getLeads)
    .post(createLead); // Public for lead capture

router.route('/:id')
    .get(protect, authorize('admin', 'sales'), getLead)
    .put(protect, authorize('admin', 'sales'), updateLead)
    .delete(protect, authorize('admin'), deleteLead);

router.route('/:id/notes')
    .post(protect, authorize('admin', 'sales'), addNote);

module.exports = router;
