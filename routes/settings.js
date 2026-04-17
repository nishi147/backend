const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/', getSettings);

// Only admins can update settings
router.put('/', 
  protect, 
  authorize('admin'), 
  upload.fields([
    { name: 'privacyFile', maxCount: 1 },
    { name: 'termsFile', maxCount: 1 }
  ]), 
  updateSettings
);

module.exports = router;
