const router = require('express').Router();
const {
  createFlashcard,
  createFlashcardsBulk,
  getFlashcards,
  getDueFlashcards,
  reviewFlashcard,
  deleteFlashcard,
} = require('../controllers/flashcard.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',       getFlashcards);
router.get('/due',    getDueFlashcards);
router.post('/',      createFlashcard);
router.post('/bulk',  createFlashcardsBulk);
router.patch('/:id/review', reviewFlashcard);
router.delete('/:id', deleteFlashcard);

module.exports = router;