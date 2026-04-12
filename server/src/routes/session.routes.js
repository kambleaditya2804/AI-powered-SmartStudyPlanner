const router = require('express').Router({ mergeParams: true });
const { generatePlanSchedule, getSessions, getTodaySessions, updateSession } = require('../controllers/session.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// /api/sessions/today
router.get('/today', getTodaySessions);

// /api/plans/:planId/sessions
router.post('/generate', generatePlanSchedule);
router.get('/', getSessions);
router.patch('/:sessionId', updateSession);

module.exports = router;