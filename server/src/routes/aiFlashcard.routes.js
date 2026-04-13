const router = require('express').Router();
const { generateFromNotes, saveGeneratedCards } = require('../controllers/aiFlashcard.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/generate', generateFromNotes);
router.post('/save',     saveGeneratedCards);

module.exports = router;