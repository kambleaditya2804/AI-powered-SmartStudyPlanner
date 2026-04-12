const { Flashcard } = require('../models/StudyPlan.model');
const { applyReview } = require('../services/spacedRepetition');

// ─── Create flashcard ─────────────────────────────────────────────────────────
const createFlashcard = async (req, res, next) => {
  try {
    const { front, back, topicId } = req.body;
    if (!front || !back) {
      return res.status(400).json({ success: false, message: 'front and back are required' });
    }

    const card = await Flashcard.create({
      user: req.user._id,
      topic: topicId || null,
      front,
      back,
    });

    res.status(201).json({ success: true, card });
  } catch (err) {
    next(err);
  }
};

// ─── Bulk create flashcards ───────────────────────────────────────────────────
const createFlashcardsBulk = async (req, res, next) => {
  try {
    const { cards, topicId } = req.body;
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'cards must be a non-empty array' });
    }

    const docs = cards.map(c => ({
      user: req.user._id,
      topic: topicId || null,
      front: c.front,
      back: c.back,
    }));

    const inserted = await Flashcard.insertMany(docs);
    res.status(201).json({ success: true, count: inserted.length, cards: inserted });
  } catch (err) {
    next(err);
  }
};

// ─── Get all flashcards (optionally filter by topic) ─────────────────────────
const getFlashcards = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.topicId) filter.topic = req.query.topicId;

    const cards = await Flashcard.find(filter)
      .populate('topic', 'name subject')
      .sort({ nextReviewDate: 1 });

    res.json({ success: true, count: cards.length, cards });
  } catch (err) {
    next(err);
  }
};

// ─── Get due flashcards (ready for review today) ──────────────────────────────
const getDueFlashcards = async (req, res, next) => {
  try {
    const filter = {
      user: req.user._id,
      nextReviewDate: { $lte: new Date() },
    };
    if (req.query.topicId) filter.topic = req.query.topicId;

    const cards = await Flashcard.find(filter)
      .populate('topic', 'name subject')
      .sort({ nextReviewDate: 1 })
      .limit(50);

    res.json({ success: true, count: cards.length, cards });
  } catch (err) {
    next(err);
  }
};

// ─── Review a flashcard (apply SM-2) ─────────────────────────────────────────
const reviewFlashcard = async (req, res, next) => {
  try {
    const { quality } = req.body;
    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ success: false, message: 'quality must be 0-5' });
    }

    const card = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ success: false, message: 'Flashcard not found' });

    applyReview(card, quality);
    await card.save();

    res.json({ success: true, card });
  } catch (err) {
    next(err);
  }
};

// ─── Delete flashcard ─────────────────────────────────────────────────────────
const deleteFlashcard = async (req, res, next) => {
  try {
    const card = await Flashcard.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ success: false, message: 'Flashcard not found' });
    res.json({ success: true, message: 'Flashcard deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFlashcard,
  createFlashcardsBulk,
  getFlashcards,
  getDueFlashcards,
  reviewFlashcard,
  deleteFlashcard,
};