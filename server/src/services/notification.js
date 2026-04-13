const Notification = require('../models/Notification.model');
const { Topic, Session, StudyPlan } = require('../models/StudyPlan.model');
const User = require('../models/User.model');

/**
 * Create a notification for a user.
 */
const createNotification = async (userId, { title, message, type, icon, link }) => {
  return Notification.create({ user: userId, title, message, type, icon, link });
};

/**
 * Generate smart notifications for a user based on their study data.
 * Call this when user logs in or visits dashboard.
 */
const generateSmartNotifications = async (userId) => {
  const notifications = [];
  const now = new Date();

  // ── 1. Streak warning ────────────────────────────────────────────────────────
  const user = await User.findById(userId);
  if (user.streak > 0 && user.lastStudiedAt) {
    const lastStudied = new Date(user.lastStudiedAt);
    const hoursSince = (now - lastStudied) / 3600000;

    if (hoursSince >= 20 && hoursSince < 48) {
      const existing = await Notification.findOne({
        user: userId,
        type: 'streak',
        createdAt: { $gte: new Date(now.getTime() - 24 * 3600000) },
      });
      if (!existing) {
        notifications.push({
          title: '🔥 Streak at risk!',
          message: `Your ${user.streak} day streak will break if you don't study today!`,
          type: 'streak',
          icon: '🔥',
          link: '/',
        });
      }
    }
  }

  // ── 2. Today's sessions reminder ─────────────────────────────────────────────
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todaySessions = await Session.find({
    user: userId,
    date: { $gte: todayStart, $lte: todayEnd },
    status: 'pending',
  }).populate('topic', 'name');

  if (todaySessions.length > 0) {
    const existing = await Notification.findOne({
      user: userId,
      type: 'session',
      createdAt: { $gte: new Date(now.getTime() - 12 * 3600000) },
    });
    if (!existing) {
      notifications.push({
        title: '📅 Sessions due today',
        message: `You have ${todaySessions.length} study session${todaySessions.length > 1 ? 's' : ''} pending today.`,
        type: 'session',
        icon: '📅',
        link: '/',
      });
    }
  }

  // ── 3. Topics not studied in 3+ days ─────────────────────────────────────────
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600000);
  const plans = await StudyPlan.find({ user: userId, isActive: true });

  for (const plan of plans) {
    const neglectedTopics = await Topic.find({
      plan: plan._id,
      user: userId,
      isCompleted: false,
      updatedAt: { $lte: threeDaysAgo },
    }).limit(3);

    if (neglectedTopics.length > 0) {
      const existing = await Notification.findOne({
        user: userId,
        type: 'reminder',
        createdAt: { $gte: new Date(now.getTime() - 24 * 3600000) },
      });
      if (!existing) {
        const names = neglectedTopics.map(t => t.name).join(', ');
        notifications.push({
          title: '📚 Topics need attention',
          message: `You haven't studied ${names} in 3+ days. Time to revisit!`,
          type: 'reminder',
          icon: '📚',
          link: '/topics',
        });
      }
    }
  }

  // ── 4. Flashcard review reminder ─────────────────────────────────────────────
  const { Flashcard } = require('../models/StudyPlan.model') ;
  const dueFlashcards = await Flashcard.countDocuments({
    user: userId,
    nextReviewDate: { $lte: now },
  });

  if (dueFlashcards > 0) {
    const existing = await Notification.findOne({
      user: userId,
      type: 'flashcard',
      createdAt: { $gte: new Date(now.getTime() - 24 * 3600000) },
    });
    if (!existing) {
      notifications.push({
        title: '🃏 Flashcards due',
        message: `${dueFlashcards} flashcard${dueFlashcards > 1 ? 's' : ''} are ready for review.`,
        type: 'flashcard',
        icon: '🃏',
        link: '/flashcards',
      });
    }
  }

  // ── 5. Exam approaching ───────────────────────────────────────────────────────
  for (const plan of plans) {
    const daysLeft = Math.ceil((new Date(plan.examDate) - now) / 86400000);
    if (daysLeft <= 7 && daysLeft > 0) {
      const existing = await Notification.findOne({
        user: userId,
        title: { $regex: 'exam', $options: 'i' },
        createdAt: { $gte: new Date(now.getTime() - 24 * 3600000) },
      });
      if (!existing) {
        notifications.push({
          title: '⚠️ Exam approaching!',
          message: `${plan.title} is in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Stay focused!`,
          type: 'general',
          icon: '⚠️',
          link: '/progress',
        });
      }
    }
  }

  // Save all new notifications
  if (notifications.length > 0) {
    await Notification.insertMany(notifications.map(n => ({ ...n, user: userId })));
  }

  return notifications.length;
};

module.exports = { createNotification, generateSmartNotifications };