const express = require('express');
const {
    getLeads,
    getLead,
    createLead,
    updateLead,
    addNote,
    exportLeads
} = require('../controllers/leadController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, authorize('admin', 'sales'), getLeads)
    .post(createLead); // Public for lead capture

router.get('/export', protect, authorize('admin', 'sales'), exportLeads);

router.route('/:id')
    .get(protect, authorize('admin', 'sales'), getLead)
    .put(protect, authorize('admin', 'sales'), updateLead);

router.route('/:id/notes')
    .post(protect, authorize('admin', 'sales'), addNote);

module.exports = router;
