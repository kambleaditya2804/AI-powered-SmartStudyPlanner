const { generateFlashcardsFromNotes } = require('../services/aiFlashcard');
const { Flashcard } = require('../models/StudyPlan.model');

// ─── Generate flashcards from notes ──────────────────────────────────────────
const generateFromNotes = async (req, res, next) => {
  try {
    const { notes, count = 10, topicId } = req.body;

    if (!notes || notes.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 50 characters of notes.',
      });
    }

    if (count < 3 || count > 20) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 3 and 20.',
      });
    }

    const cards = await generateFlashcardsFromNotes(notes, count);

    res.json({
      success: true,
      count: cards.length,
      cards,
      topicId: topicId || null,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        message: 'AI response was invalid. Please try again.',
      });
    }
    next(err);
  }
};

// ─── Save selected AI generated flashcards ────────────────────────────────────
const saveGeneratedCards = async (req, res, next) => {
  try {
    const { cards, topicId } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'No cards to save.' });
    }

    const docs = cards.map(c => ({
      user:  req.user._id,
      topic: topicId || null,
      front: c.front,
      back:  c.back,
    }));

    const saved = await Flashcard.insertMany(docs);

    res.status(201).json({
      success: true,
      count: saved.length,
      message: `${saved.length} flashcards saved to your deck!`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateFromNotes, saveGeneratedCards };