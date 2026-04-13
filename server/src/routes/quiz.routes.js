const router = require('express').Router();
const { generateQuiz, submitQuiz } = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/generate', generateQuiz);
router.post('/submit',   submitQuiz);

module.exports = router;