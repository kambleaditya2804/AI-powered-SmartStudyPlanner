const { StudyPlan, Topic, Session } = require('../models/StudyPlan.model');
const { calcReadinessScore } = require('../services/scheduleEngine');

const getPlanProgress = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.planId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const topics = await Topic.find({ plan: plan._id });
    const sessions = await Session.find({ plan: plan._id });

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const skippedSessions = sessions.filter(s => s.status === 'skipped');
    const totalPlannedMins = sessions.reduce((s, x) => s + x.plannedMinutes, 0);
    const totalCompletedMins = completedSessions.reduce((s, x) => s + x.completedMinutes, 0);

    const subjectMap = {};
    for (const topic of topics) {
      if (!subjectMap[topic.subject]) {
        subjectMap[topic.subject] = { estimatedHours: 0, completedHours: 0, confidence: [], topics: 0 };
      }
      subjectMap[topic.subject].estimatedHours += topic.estimatedHours;
      subjectMap[topic.subject].completedHours += topic.completedHours;
      subjectMap[topic.subject].confidence.push(topic.confidence || 0);
      subjectMap[topic.subject].topics++;
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      estimatedHours: data.estimatedHours,
      completedHours: parseFloat(data.completedHours.toFixed(2)),
      avgConfidence: Math.round(data.confidence.reduce((a, b) => a + b, 0) / data.confidence.length),
      topicCount: data.topics,
      completionPct: Math.round((data.completedHours / data.estimatedHours) * 100),
    }));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = completedSessions.filter(s => new Date(s.date) >= weekAgo);
    const weeklyHours = parseFloat((recentSessions.reduce((s, x) => s + x.completedMinutes, 0) / 60).toFixed(2));

    const readinessScore = calcReadinessScore(topics);
    await StudyPlan.findByIdAndUpdate(plan._id, {
      'stats.readinessScore': readinessScore,
      'stats.totalHoursCompleted': parseFloat((totalCompletedMins / 60).toFixed(2)),
    });

    res.json({
      success: true,
      analytics: {
        daysLeft: plan.daysLeft,
        readinessScore,
        topics: {
          total: topics.length,
          completed: topics.filter(t => t.isCompleted).length,
          inProgress: topics.filter(t => !t.isCompleted && t.completedHours > 0).length,
          notStarted: topics.filter(t => t.completedHours === 0).length,
        },
        hours: {
          planned: parseFloat((totalPlannedMins / 60).toFixed(2)),
          completed: parseFloat((totalCompletedMins / 60).toFixed(2)),
          weekly: weeklyHours,
        },
        sessions: {
          total: sessions.length,
          completed: completedSessions.length,
          skipped: skippedSessions.length,
          completionRate: sessions.length
            ? Math.round((completedSessions.length / sessions.length) * 100)
            : 0,
        },
        subjectBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const User = require('../models/User.model');
    const user = await User.findById(req.user._id);

    const totalPlans = await StudyPlan.countDocuments({ user: req.user._id });
    const totalSessions = await Session.countDocuments({ user: req.user._id, status: 'completed' });
    const totalMinutes = await Session.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$completedMinutes' } } },
    ]);

    res.json({
      success: true,
      stats: {
        xp: user.xp,
        streak: user.streak,
        lastStudiedAt: user.lastStudiedAt,
        totalPlans,
        totalSessionsCompleted: totalSessions,
        totalHoursStudied: parseFloat(((totalMinutes[0]?.total || 0) / 60).toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlanProgress, getUserStats };