const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const { validatePassword, sanitizeInput } = require('../utils/helpers');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId).select('-password -mfaSecret -refreshTokens');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.mfaEnabled,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'An error occurred while fetching user profile'
    });
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const { emailReminders, theme } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update preferences
    if (typeof emailReminders === 'boolean') {
      user.preferences.emailReminders = emailReminders;
    }

    if (theme && ['light', 'dark'].includes(theme)) {
      user.preferences.theme = theme;
    }

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: 'An error occurred while updating preferences'
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid current password'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'New password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    
    // Invalidate all refresh tokens to force re-login
    user.refreshTokens = [];
    
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: 'An error occurred while changing password'
    });
  }
};

/**
 * Export user data (GDPR compliance)
 */
const exportData = async (req, res) => {
  try {
    const userId = req.userId;
    const { format = 'json' } = req.query;

    // Get user data
    const user = await User.findById(userId).select('-password -mfaSecret -refreshTokens');
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get all journal entries
    const entries = await JournalEntry.find({ userId })
      .sort({ entryDate: -1 })
      .select('-userId -metadata -__v');

    const exportData = {
      user: {
        id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.mfaEnabled,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      journalEntries: entries.map(entry => ({
        id: entry._id,
        content: entry.content,
        wordCount: entry.wordCount,
        characterCount: entry.characterCount,
        writingDuration: entry.writingDuration,
        mood: entry.mood,
        tags: entry.tags,
        entryDate: entry.entryDate,
        dateString: entry.dateString,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      exportDate: new Date().toISOString(),
      totalEntries: entries.length
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="snapnote-data-export.json"');
      res.json(exportData);
    } else {
      // For other formats, return JSON for now
      // TODO: Implement PDF export using jsPDF
      res.json(exportData);
    }

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      error: 'Failed to export data',
      message: 'An error occurred while exporting user data'
    });
  }
};

/**
 * Delete user account and all associated data
 */
const deleteAccount = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password, confirmationText } = req.body;
    const userId = req.userId;

    // Check confirmation text
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        error: 'Invalid confirmation',
        message: 'Please type "DELETE MY ACCOUNT" to confirm account deletion'
      });
    }

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

    // Delete all journal entries
    await JournalEntry.deleteMany({ userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: 'An error occurred while deleting account'
    });
  }
};

/**
 * Get account statistics
 */
const getAccountStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user info
    const user = await User.findById(userId).select('createdAt lastLogin');
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get journal statistics
    const totalEntries = await JournalEntry.countDocuments({ userId });
    
    const firstEntry = await JournalEntry.findOne({ userId })
      .sort({ entryDate: 1 })
      .select('entryDate');

    const lastEntry = await JournalEntry.findOne({ userId })
      .sort({ entryDate: -1 })
      .select('entryDate');

    // Calculate days since joining and days since first entry
    const daysSinceJoining = Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));
    const daysSinceFirstEntry = firstEntry 
      ? Math.floor((new Date() - firstEntry.entryDate) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate consistency rate
    const consistencyRate = daysSinceFirstEntry > 0 
      ? Math.round((totalEntries / (daysSinceFirstEntry + 1)) * 100)
      : 0;

    res.json({
      accountAge: {
        days: daysSinceJoining,
        joinDate: user.createdAt
      },
      journaling: {
        totalEntries,
        firstEntryDate: firstEntry?.entryDate || null,
        lastEntryDate: lastEntry?.entryDate || null,
        daysSinceFirstEntry,
        consistencyRate: Math.min(100, consistencyRate) // Cap at 100%
      },
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('Get account stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch account statistics',
      message: 'An error occurred while fetching account statistics'
    });
  }
};

module.exports = {
  getProfile,
  updatePreferences,
  changePassword,
  exportData,
  deleteAccount,
  getAccountStats
};
