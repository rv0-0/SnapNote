const express = require('express');
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');
const {
  getProfile,
  updatePreferences,
  changePassword,
  exportData,
  deleteAccount,
  getAccountStats
} = require('../controllers/userController');

const router = express.Router();

// Strict rate limiting for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const updatePreferencesValidation = [
  body('emailReminders')
    .optional()
    .isBoolean()
    .withMessage('Email reminders must be a boolean value'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('confirmationText')
    .equals('DELETE MY ACCOUNT')
    .withMessage('Confirmation text must be exactly "DELETE MY ACCOUNT"')
];

const exportDataValidation = [
  query('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('Format must be either json or pdf')
];

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/profile', getProfile);
router.get('/stats', getAccountStats);

// Settings routes
router.put('/preferences', updatePreferencesValidation, updatePreferences);
router.put('/password', strictLimiter, changePasswordValidation, changePassword);

// Data export route
router.get('/export', exportDataValidation, exportData);

// Account deletion route (most sensitive operation)
router.delete('/account', strictLimiter, deleteAccountValidation, deleteAccount);

module.exports = router;
