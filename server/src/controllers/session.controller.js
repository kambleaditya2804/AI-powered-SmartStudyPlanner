const { Session, StudyPlan, Topic } = require('../models/StudyPlan.model');
const { generateSchedule, calcReadinessScore } = require('../services/scheduleEngine');
const { applyReview } = require('../services/spacedRepetition');

const generatePlanSchedule = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const topics = await Topic.find({ plan: plan._id, isCompleted: false });
    if (topics.length === 0) {
      return res.status(400).json({ success: false, message: 'Add topics to the plan before generating a schedule' });
    }

    await Session.deleteMany({ plan: plan._id, status: 'pending' });

    const { excludeWeekends = false, revisionBufferPercent = 0.2 } = req.body;
    const sessionDocs = generateSchedule(plan, topics, { excludeWeekends, revisionBufferPercent });

    if (sessionDocs.length === 0) {
      return res.status(400).json({ success: false, message: 'No available days between today and the exam date' });
    }

    const sessions = await Session.insertMany(sessionDocs);
    const readinessScore = calcReadinessScore(topics);
    await StudyPlan.findByIdAndUpdate(plan._id, { 'stats.readinessScore': readinessScore });

    res.status(201).json({
      success: true,
      message: `Generated ${sessions.length} study sessions`,
      totalSessions: sessions.length,
      readinessScore,
    });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { date, status, startDate, endDate } = req.query;

    const plan = await StudyPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const filter = { plan: planId };
    if (status) filter.status = status;

    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sessions = await Session.find(filter)
      .populate('topic', 'name subject confidence')
      .sort({ date: 1 });

    res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
};

const getTodaySessions = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sessions = await Session.find({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate('topic', 'name subject confidence priority')
      .populate('plan', 'title examDate')
      .sort({ 'topic.priority': -1 });

    res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
};

const updateSession = async (req, res, next) => {
  try {
    const { completedMinutes, status, notes, mood, srQuality } = req.body;

    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (completedMinutes !== undefined) session.completedMinutes = completedMinutes;
    if (status) session.status = status;
    if (notes) session.notes = notes;
    if (mood) session.mood = mood;
    await session.save();

    if (status === 'completed' && session.topic) {
      const topic = await Topic.findById(session.topic);
      if (topic) {
        topic.completedHours += (session.completedMinutes || session.plannedMinutes) / 60;
        if (srQuality !== undefined) applyReview(topic, srQuality);
        if (topic.completedHours >= topic.estimatedHours) topic.isCompleted = true;
        await topic.save();

        await StudyPlan.findByIdAndUpdate(session.plan, {
          $inc: { 'stats.totalHoursCompleted': (session.completedMinutes || session.plannedMinutes) / 60 },
        });
      }
    }

    if (status === 'completed') {
      const User = require('../models/User.model');
      const user = await User.findById(req.user._id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastStudied = user.lastStudiedAt ? new Date(user.lastStudiedAt) : null;
      const lastStudiedDay = lastStudied ? new Date(lastStudied.setHours(0, 0, 0, 0)) : null;
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (!lastStudiedDay || lastStudiedDay < yesterday) {
        user.streak = 1;
      } else if (lastStudiedDay.getTime() === yesterday.getTime()) {
        user.streak += 1;
      }

      user.xp += Math.round((session.completedMinutes || session.plannedMinutes) / 5);
      user.lastStudiedAt = new Date();
      await user.save();
    }

    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

module.exports = { generatePlanSchedule, getSessions, getTodaySessions, updateSession };