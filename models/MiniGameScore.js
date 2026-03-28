const mongoose = require('mongoose');

const miniGameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bestScore: {
    type: Number,
    required: true,
    default: 0
  },
  lastScore: {
    type: Number,
    required: true,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MiniGameScore', miniGameScoreSchema);
