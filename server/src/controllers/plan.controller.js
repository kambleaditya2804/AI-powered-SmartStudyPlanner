const { validationResult } = require('express-validator');
const { StudyPlan, Topic, Session } = require('../models/StudyPlan.model');

// â”€â”€â”€ Create Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const createPlan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, examDate, goal, dailyStudyHours } = req.body;

    const plan = await StudyPlan.create({
      user: req.user._id,
      title,
      examDate,
      goal,
      dailyStudyHours: dailyStudyHours || req.user.preferences.dailyGoalHours,
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Get all plans for user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getPlans = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, plans });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Get single plan with topics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getPlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const topics = await Topic.find({ plan: plan._id }).sort({ priority: -1 });
    res.json({ success: true, plan, topics });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Update plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const updatePlan = async (req, res, next) => {
  try {
    const allowed = ['title', 'examDate', 'goal', 'dailyStudyHours', 'isActive'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const plan = await StudyPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

// â”€â”€â”€ Delete plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const deletePlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Cascade delete topics and sessions
    await Topic.deleteMany({ plan: plan._id });
    await Session.deleteMany({ plan: plan._id });

    res.json({ success: true, message: 'Plan and all associated data deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPlan, getPlans, getPlan, updatePlan, deletePlan };