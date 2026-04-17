const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  privacyPolicy: {
    content: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  termsAndConditions: {
    content: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
