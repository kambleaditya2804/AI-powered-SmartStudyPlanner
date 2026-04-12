const router = require('express').Router();
const { body } = require('express-validator');
const { createPlan, getPlans, getPlan, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { protect } = require('../middleware/auth');

const planRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('examDate').isISO8601().withMessage('Valid exam date is required'),
  body('dailyStudyHours').optional().isFloat({ min: 0.5, max: 16 }).withMessage('Daily hours must be 0.5–16'),
];

router.use(protect); // all plan routes require auth

router.route('/')
  .get(getPlans)
  .post(planRules, createPlan);

router.route('/:id')
  .get(getPlan)
  .patch(updatePlan)
  .delete(deletePlan);

module.exports = router;