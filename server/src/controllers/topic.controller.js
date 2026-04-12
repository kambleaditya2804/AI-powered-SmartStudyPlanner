const { validationResult } = require('express-validator');
const { Topic, StudyPlan } = require('../models/StudyPlan.model');

// â”€â”€â”€ Add topic to a plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const addTopic = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const plan = await StudyPlan.findOne({ _id: req.params.planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const { name, subject, priority, difficulty, estimatedHours } = req.body;

    const topic = await Topic.create({
      plan: plan._id,
      user: req.user._id,
      name,
      subject,
      priority: priority || 3,
      difficulty: difficulty || 3,
      estimatedHours,
    });

    // Update plan total hours stat
    await StudyPlan.findByIdAndUpdate(plan._id, {
      $inc: { 'stats.totalHoursPlanned': estimatedHours },
    });

    res.status(201).json({ success: true, topic });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Bulk add topics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const addTopicsBulk = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const { topics } = req.body; // array of topic objects
    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ success: false, message: 'topics must be a non-empty array' });
    }

    const docs = topics.map(t => ({
      plan: plan._id,
      user: req.user._id,
      name: t.name,
      subject: t.subject,
      priority: t.priority || 3,
      difficulty: t.difficulty || 3,
      estimatedHours: t.estimatedHours,
    }));

    const inserted = await Topic.insertMany(docs);
    const totalHours = docs.reduce((sum, t) => sum + t.estimatedHours, 0);

    await StudyPlan.findByIdAndUpdate(plan._id, {
      $inc: { 'stats.totalHoursPlanned': totalHours },
    });

    res.status(201).json({ success: true, count: inserted.length, topics: inserted });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Get all topics for a plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getTopics = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const topics = await Topic.find({ plan: plan._id }).sort({ priority: -1, difficulty: -1 });
    res.json({ success: true, count: topics.length, topics });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Update topic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const updateTopic = async (req, res, next) => {
  try {
    const allowed = ['name', 'subject', 'priority', 'difficulty', 'confidence',
                     'estimatedHours', 'completedHours', 'isCompleted'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const topic = await Topic.findOneAndUpdate(
      { _id: req.params.topicId, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    res.json({ success: true, topic });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Delete topic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findOneAndDelete({ _id: req.params.topicId, user: req.user._id });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    // Subtract hours from plan stats
    await StudyPlan.findByIdAndUpdate(topic.plan, {
      $inc: { 'stats.totalHoursPlanned': -topic.estimatedHours },
    });

    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Get topics due for spaced repetition review today â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getDueTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find({
      user: req.user._id,
      'sr.nextReviewDate': { $lte: new Date() },
      isCompleted: false,
    }).populate('plan', 'title');

    res.json({ success: true, count: topics.length, topics });
  } catch (err) {
    next(err);
  }
};

module.exports = { addTopic, addTopicsBulk, getTopics, updateTopic, deleteTopic, getDueTopics };