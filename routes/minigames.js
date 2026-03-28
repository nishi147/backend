const express = require('express');
const { protect } = require('../middleware/auth');
const minigameController = require('../controllers/minigameController');

const router = express.Router();

router.get('/', protect, minigameController.getUserScore);
router.post('/', protect, minigameController.saveScore);

module.exports = router;
