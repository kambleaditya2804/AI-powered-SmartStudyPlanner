const router = require('express').Router({ mergeParams: true });
const { getPlanProgress, getUserStats } = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/me', getUserStats);
router.get('/:planId', getPlanProgress);

module.exports = router;