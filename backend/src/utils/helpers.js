const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return { accessToken, refreshToken };
};

/**
 * Calculate refresh token expiration date
 */
const getRefreshTokenExpiry = () => {
  const expireTime = process.env.JWT_REFRESH_EXPIRE || '7d';
  let expirationMs;
  
  if (expireTime.endsWith('d')) {
    expirationMs = parseInt(expireTime) * 24 * 60 * 60 * 1000; // days to ms
  } else if (expireTime.endsWith('h')) {
    expirationMs = parseInt(expireTime) * 60 * 60 * 1000; // hours to ms
  } else if (expireTime.endsWith('m')) {
    expirationMs = parseInt(expireTime) * 60 * 1000; // minutes to ms
  } else {
    expirationMs = parseInt(expireTime) * 1000; // seconds to ms
  }
  
  return new Date(Date.now() + expirationMs);
};

/**
 * Generate secure random string for backup codes
 */
const generateBackupCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Generate multiple backup codes
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push({
      code: generateBackupCode(),
      used: false
    });
  }
  return codes;
};

/**
 * Hash sensitive data
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate secure random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .slice(0, 2000); // Limit length
};

/**
 * Get IP address from request
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

/**
 * Format date for consistent storage
 */
const formatDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Check if date is today
 */
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return checkDate.toDateString() === today.toDateString();
};

/**
 * Get start and end of day
 */
const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
  getRefreshTokenExpiry,
  generateBackupCode,
  generateBackupCodes,
  hashData,
  generateSecureToken,
  validatePassword,
  sanitizeInput,
  getClientIP,
  formatDateString,
  isToday,
  getDayBounds
};
