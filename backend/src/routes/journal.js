const express = require('express');
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');
const {
  createEntry,
  getEntries,
  getEntry,
  getStats,
  canWriteToday,
  getCalendarData
} = require('../controllers/journalController');

const router = express.Router();

// Rate limiting for journal creation (prevent spam)
const createEntryLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // Only 1 entry per day
  message: {
    error: 'You can only create one journal entry per day.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const createEntryValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1 and 2000 characters'),
  body('writingDuration')
    .isNumeric()
    .isFloat({ min: 1, max: 60 })
    .withMessage('Writing duration must be between 1 and 60 seconds'),
  body('mood')
    .optional()
    .isIn(['very-happy', 'happy', 'neutral', 'sad', 'very-sad'])
    .withMessage('Invalid mood value'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const getEntriesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

const calendarValidation = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
];

// All routes require authentication
router.use(authMiddleware);

// Journal entry routes
router.post('/entries', createEntryLimiter, createEntryValidation, createEntry);
router.get('/entries', getEntriesValidation, getEntries);
router.get('/entries/:entryId', getEntry);

// Utility routes
router.get('/can-write-today', canWriteToday);
router.get('/stats', getStats);
router.get('/calendar', calendarValidation, getCalendarData);

module.exports = router;
