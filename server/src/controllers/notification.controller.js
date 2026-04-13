const Notification = require('../models/Notification.model');
const { generateSmartNotifications } = require('../services/notification');

// ─── Get all notifications for user ──────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    // Generate smart notifications first
    await generateSmartNotifications(req.user._id);

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// ─── Mark single notification as read ────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─── Mark all as read ─────────────────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─── Delete a notification ────────────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ─── Clear all notifications ──────────────────────────────────────────────────
const clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAll };