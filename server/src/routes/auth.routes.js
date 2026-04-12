const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, updatePreferences, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);

// Protected routes
router.get('/me',                protect, getMe);
router.patch('/preferences',     protect, updatePreferences);
router.patch('/change-password', protect, changePassword);

module.exports = router;