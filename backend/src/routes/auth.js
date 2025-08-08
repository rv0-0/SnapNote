const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  setupMFA,
  verifyMFA,
  disableMFA
} = require('../controllers/authController');

const router = express.Router();

// Additional rate limiting for sensitive auth operations
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
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('mfaCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA code must be 6 digits')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const mfaCodeValidation = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA code must be 6 digits')
];

const disableMFAValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('mfaCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA code must be 6 digits')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshTokenValidation, refreshToken);

// Protected routes
router.post('/logout', authMiddleware, logout);

// MFA routes (protected)
router.post('/mfa/setup', authMiddleware, setupMFA);
router.post('/mfa/verify', authMiddleware, mfaCodeValidation, verifyMFA);
router.post('/mfa/disable', authMiddleware, strictLimiter, disableMFAValidation, disableMFA);

module.exports = router;
