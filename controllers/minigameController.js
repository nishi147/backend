const MiniGameScore = require('../models/MiniGameScore');

// @desc    Get user's minigame score
// @route   GET /api/minigames
// @access  Private
exports.getUserScore = async (req, res) => {
    try {
        let score = await MiniGameScore.findOne({ userId: req.user._id });
        
        if (!score) {
            // Return defaults if no score exists yet
            return res.status(200).json({
                success: true,
                data: {
                    bestScore: null,
                    lastScore: null,
                    gamesPlayed: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: score
        });
    } catch (err) {
        console.error("Error fetching minigame score:", err);
        res.status(500).json({ success: false, message: 'Server error fetching score' });
    }
};

// @desc    Save/Update user's minigame score
// @route   POST /api/minigames
// @access  Private
exports.saveScore = async (req, res) => {
    try {
        const { score } = req.body; // Score in ms

        if (!score || typeof score !== 'number') {
            return res.status(400).json({ success: false, message: 'Invalid score provided' });
        }

        let gameRecord = await MiniGameScore.findOne({ userId: req.user._id });

        if (!gameRecord) {
            // Create first record
            gameRecord = await MiniGameScore.create({
                userId: req.user._id,
                bestScore: score,
                lastScore: score,
                gamesPlayed: 1
            });
        } else {
            // Update existing record
            gameRecord.lastScore = score;
            gameRecord.gamesPlayed += 1;
            
            // If bestScore is 0 (unlikely but possible if bugged) or new score is faster (lower ms)
            if (!gameRecord.bestScore || score < gameRecord.bestScore) {
                gameRecord.bestScore = score;
            }
            
            await gameRecord.save();
        }

        res.status(200).json({
            success: true,
            data: gameRecord
        });
    } catch (err) {
        console.error("Error saving minigame score:", err);
        res.status(500).json({ success: false, message: 'Server error saving score' });
    }
};
