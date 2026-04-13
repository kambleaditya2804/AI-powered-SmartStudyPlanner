const router = require('express').Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',              getNotifications);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markAsRead);
router.delete('/clear-all',  clearAll);
router.delete('/:id',        deleteNotification);

module.exports = router;