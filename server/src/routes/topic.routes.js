const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const { addTopic, addTopicsBulk, getTopics, updateTopic, deleteTopic, getDueTopics } = require('../controllers/topic.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

const topicRules = [
  body('name').trim().notEmpty().withMessage('Topic name is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('estimatedHours').isFloat({ min: 0.5 }).withMessage('Estimated hours must be at least 0.5'),
];

// /api/topics/due  — across all plans
router.get('/due', getDueTopics);

// /api/plans/:planId/topics
router.route('/')
  .get(getTopics)
  .post(topicRules, addTopic);

router.post('/bulk', addTopicsBulk);

router.route('/:topicId')
  .patch(updateTopic)
  .delete(deleteTopic);

module.exports = router;