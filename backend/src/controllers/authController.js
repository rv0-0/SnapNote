const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  generateTokenPair, 
  getRefreshTokenExpiry, 
  verifyRefreshToken,
  generateBackupCodes,
  validatePassword,
  sanitizeInput,
  getClientIP
} = require('../utils/helpers');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Sanitize input
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email: sanitizedEmail,
      password: password // Will be hashed by pre-save middleware
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Store refresh token in database
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      isActive: true
    });
    await user.save();

    // Remove sensitive data from response
    const userResponse = {
      id: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    console.log('🔐 LOGIN ATTEMPT:', {
      timestamp: new Date().toISOString(),
      ip: getClientIP(req),
      userAgent: req.get('User-Agent'),
      body: { email: req.body.email, hasPassword: !!req.body.password, hasMfaCode: !!req.body.mfaCode }
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ LOGIN VALIDATION FAILED:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, mfaCode } = req.body;
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    console.log('🔍 SEARCHING FOR USER:', { email: sanitizedEmail });

    // Find user
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      console.log('❌ USER NOT FOUND:', { email: sanitizedEmail });
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    console.log('✅ USER FOUND:', { 
      userId: user._id, 
      email: user.email, 
      isLocked: user.isLocked,
      mfaEnabled: user.mfaEnabled,
      loginAttempts: user.loginAttempts 
    });

    // Check if account is locked
    if (user.isLocked) {
      console.log('🔒 ACCOUNT LOCKED:', { userId: user._id, email: user.email });
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    console.log('🔑 VERIFYING PASSWORD...');
    console.log('🔍 PASSWORD DEBUG:', {
      inputPassword: password,
      inputPasswordLength: password.length,
      hashedPasswordFromDB: user.password,
      hashedPasswordLength: user.password.length
    });
    
    // Verify password
    const isValidPassword = await user.comparePassword(password);
    console.log('🔑 PASSWORD COMPARISON RESULT:', { isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ INVALID PASSWORD:', { userId: user._id, email: user.email });
      await user.incLoginAttempts();
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    console.log('✅ PASSWORD VALID');

    // Check MFA if enabled
    if (user.mfaEnabled) {
      console.log('🔐 MFA ENABLED - CHECKING CODE...');
      if (!mfaCode) {
        console.log('⚠️ MFA CODE REQUIRED');
        return res.status(200).json({
          requiresMFA: true,
          message: 'MFA code required'
        });
      }

      // Verify MFA code
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2 // Allow some time drift
      });

      if (!verified) {
        console.log('❌ MFA CODE VERIFICATION FAILED');
        // Check backup codes
        const backupCodeIndex = user.mfaBackupCodes.findIndex(
          bc => bc.code === mfaCode.toUpperCase() && !bc.used
        );
        
        if (backupCodeIndex === -1) {
          console.log('❌ BACKUP CODE NOT FOUND OR ALREADY USED');
          await user.incLoginAttempts();
          return res.status(401).json({
            error: 'Login failed',
            message: 'Invalid MFA code'
          });
        }

        console.log('✅ BACKUP CODE VALID, MARKING AS USED');
        // Mark backup code as used
        user.mfaBackupCodes[backupCodeIndex].used = true;
        await user.save();
      } else {
        console.log('✅ MFA CODE VERIFIED');
      }
    }

    console.log('🔄 RESETTING LOGIN ATTEMPTS AND UPDATING LAST LOGIN...');
    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Clean up expired refresh tokens
    await user.cleanupRefreshTokens();

    console.log('🎫 GENERATING NEW TOKENS...');
    // Generate new tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      isActive: true
    });
    await user.save();

    // Prepare user response
    const userResponse = {
      id: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
      preferences: user.preferences,
      lastLogin: user.lastLogin
    };

    console.log('✅ LOGIN SUCCESSFUL:', { 
      userId: user._id, 
      email: user.email,
      tokensGenerated: { accessToken: !!accessToken, refreshToken: !!refreshToken }
    });

    res.json({
      message: 'Login successful',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }

    const tokenExists = user.refreshTokens.find(
      tokenObj => tokenObj.token === refreshToken && 
                  tokenObj.isActive && 
                  tokenObj.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = require('../utils/helpers').generateAccessToken(user._id);

    res.json({
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid refresh token'
      });
    }

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.userId;

    if (refreshToken) {
      // Deactivate the specific refresh token
      const user = await User.findById(userId);
      if (user) {
        const tokenIndex = user.refreshTokens.findIndex(
          tokenObj => tokenObj.token === refreshToken
        );
        
        if (tokenIndex !== -1) {
          user.refreshTokens[tokenIndex].isActive = false;
          await user.save();
        }
      }
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
};

/**
 * Setup MFA
 */
const setupMFA = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({
        error: 'MFA is already enabled'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${process.env.APP_NAME || 'SnapNote'} (${user.email})`,
      issuer: process.env.APP_NAME || 'SnapNote'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Store secret temporarily (not enabled until verified)
    user.mfaSecret = secret.base32;
    user.mfaBackupCodes = backupCodes;
    await user.save();

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes.map(bc => bc.code)
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      error: 'MFA setup failed',
      message: 'An error occurred during MFA setup'
    });
  }
};

/**
 * Verify and enable MFA
 */
const verifyMFA = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({
        error: 'MFA setup not found'
      });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        error: 'Invalid MFA code'
      });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    res.json({
      message: 'MFA enabled successfully'
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      error: 'MFA verification failed',
      message: 'An error occurred during MFA verification'
    });
  }
};

/**
 * Disable MFA
 */
const disableMFA = async (req, res) => {
  try {
    const { password, mfaCode } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    // Verify MFA code if MFA is enabled
    if (user.mfaEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          error: 'Invalid MFA code'
        });
      }
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaBackupCodes = [];
    await user.save();

    res.json({
      message: 'MFA disabled successfully'
    });

  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      error: 'MFA disable failed',
      message: 'An error occurred while disabling MFA'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  setupMFA,
  verifyMFA,
  disableMFA
};
