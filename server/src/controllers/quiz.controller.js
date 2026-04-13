const { generateMCQs } = require('../services/openai');
const { Topic } = require('../models/StudyPlan.model');

// ─── Generate quiz for a topic ────────────────────────────────────────────────
const generateQuiz = async (req, res, next) => {
  try {
    const { topicId, count = 10, difficulty = 'medium' } = req.body;

    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId is required' });
    }

    const topic = await Topic.findOne({ _id: topicId, user: req.user._id });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    const questions = await generateMCQs(topic.name, topic.subject, count, difficulty);

    res.json({
      success: true,
      quiz: {
        topicId: topic._id,
        topicName: topic.name,
        subject: topic.subject,
        difficulty,
        questions,
      },
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Try again.' });
    }
    next(err);
  }
};

// ─── Submit quiz results + update topic confidence ────────────────────────────
const submitQuiz = async (req, res, next) => {
  try {
    const { topicId, score, total } = req.body;

    if (!topicId || score === undefined || !total) {
      return res.status(400).json({ success: false, message: 'topicId, score and total are required' });
    }

    // Convert to string in case it's an object
    const topicIdStr = topicId.toString();

    const topic = await Topic.findOne({ _id: topicIdStr, user: req.user._id });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    const scorePct = Math.round((score / total) * 100);
    const newConfidence = Math.round(topic.confidence * 0.6 + scorePct * 0.4);
    topic.confidence = Math.min(100, newConfidence);
    await topic.save();

    res.json({
      success: true,
      result: {
        score,
        total,
        percentage: scorePct,
        newConfidence: topic.confidence,
        message: scorePct >= 80 ? '🎉 Excellent!' : scorePct >= 60 ? '👍 Good job!' : '📚 Keep practicing!',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateQuiz, submitQuiz };