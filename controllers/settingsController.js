const Settings = require('../models/Settings');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Get settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        privacyPolicy: { content: '' },
        termsAndConditions: { content: '' }
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const { privacyContent, termsContent } = req.body;

    // Update content if provided
    if (privacyContent !== undefined) {
      settings.privacyPolicy.content = privacyContent;
      settings.privacyPolicy.updatedAt = Date.now();
    }
    if (termsContent !== undefined) {
      settings.termsAndConditions.content = termsContent;
      settings.termsAndConditions.updatedAt = Date.now();
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.privacyFile) {
        settings.privacyPolicy.fileUrl = await uploadToCloudinary(req.files.privacyFile[0].buffer, 'ruzann/legal');
        settings.privacyPolicy.updatedAt = Date.now();
      }
      if (req.files.termsFile) {
        settings.termsAndConditions.fileUrl = await uploadToCloudinary(req.files.termsFile[0].buffer, 'ruzann/legal');
        settings.termsAndConditions.updatedAt = Date.now();
      }
    }

    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
