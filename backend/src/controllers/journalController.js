const { validationResult } = require('express-validator');
const JournalEntry = require('../models/JournalEntry');
const { sanitizeInput, formatDateString, isToday, getDayBounds } = require('../utils/helpers');

/**
 * Create a new journal entry
 */
const createEntry = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { content, writingDuration, mood, tags } = req.body;
    const userId = req.userId;

    // Sanitize content
    const sanitizedContent = sanitizeInput(content);

    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return res.status(400).json({
        error: 'Content is required',
        message: 'Journal entry cannot be empty'
      });
    }

    // Validate writing duration (max 60 seconds)
    if (writingDuration > 60) {
      return res.status(400).json({
        error: 'Invalid writing duration',
        message: 'Writing duration cannot exceed 60 seconds'
      });
    }

    // Check if user already has an entry for today
    const today = formatDateString();
    const existingEntry = await JournalEntry.findOne({
      userId,
      dateString: today
    });

    if (existingEntry) {
      return res.status(400).json({
        error: 'Entry already exists',
        message: 'You have already written your journal entry for today'
      });
    }

    // Create new journal entry
    const journalEntry = new JournalEntry({
      userId,
      content: sanitizedContent,
      writingDuration,
      mood: mood || 'neutral',
      tags: tags ? tags.map(tag => sanitizeInput(tag)).filter(Boolean) : [],
      entryDate: new Date(),
      dateString: today,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timezone: req.headers['timezone'] || 'UTC'
      }
    });

    await journalEntry.save();

    res.status(201).json({
      message: 'Journal entry created successfully',
      entry: {
        id: journalEntry._id,
        content: journalEntry.content,
        wordCount: journalEntry.wordCount,
        characterCount: journalEntry.characterCount,
        writingDuration: journalEntry.writingDuration,
        mood: journalEntry.mood,
        tags: journalEntry.tags,
        entryDate: journalEntry.entryDate,
        dateString: journalEntry.dateString,
        estimatedReadingTime: journalEntry.estimatedReadingTime,
        createdAt: journalEntry.createdAt
      }
    });

  } catch (error) {
    console.error('Create entry error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Entry already exists',
        message: 'You have already written your journal entry for today'
      });
    }

    res.status(500).json({
      error: 'Failed to create entry',
      message: 'An error occurred while creating the journal entry'
    });
  }
};

/**
 * Get all journal entries for the authenticated user
 */
const getEntries = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, month, year, search } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 entries per page
    const skip = (pageNum - 1) * limitNum;

    let query = { userId };
    let sort = { entryDate: -1 };

    // Filter by month and year if provided
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2020) {
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        
        query.entryDate = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    // Search in content if search term provided
    if (search && search.trim()) {
      query.content = { 
        $regex: sanitizeInput(search.trim()), 
        $options: 'i' 
      };
    }

    // Get entries with pagination
    const entries = await JournalEntry.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-metadata -__v');

    // Get total count for pagination
    const totalEntries = await JournalEntry.countDocuments(query);
    const totalPages = Math.ceil(totalEntries / limitNum);

    // Check if user has written today
    const hasWrittenToday = await JournalEntry.hasEntryForToday(userId);

    res.json({
      entries: entries.map(entry => ({
        id: entry._id,
        content: entry.content,
        wordCount: entry.wordCount,
        characterCount: entry.characterCount,
        writingDuration: entry.writingDuration,
        mood: entry.mood,
        tags: entry.tags,
        entryDate: entry.entryDate,
        dateString: entry.dateString,
        estimatedReadingTime: entry.estimatedReadingTime,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalEntries,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      hasWrittenToday
    });

  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      error: 'Failed to fetch entries',
      message: 'An error occurred while fetching journal entries'
    });
  }
};

/**
 * Get a specific journal entry by ID
 */
const getEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.userId;

    const entry = await JournalEntry.findOne({
      _id: entryId,
      userId
    }).select('-metadata -__v');

    if (!entry) {
      return res.status(404).json({
        error: 'Entry not found',
        message: 'The requested journal entry was not found'
      });
    }

    res.json({
      entry: {
        id: entry._id,
        content: entry.content,
        wordCount: entry.wordCount,
        characterCount: entry.characterCount,
        writingDuration: entry.writingDuration,
        mood: entry.mood,
        tags: entry.tags,
        entryDate: entry.entryDate,
        dateString: entry.dateString,
        estimatedReadingTime: entry.estimatedReadingTime,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }
    });

  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      error: 'Failed to fetch entry',
      message: 'An error occurred while fetching the journal entry'
    });
  }
};

/**
 * Get journal statistics for the user
 */
const getStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get basic statistics
    const totalEntries = await JournalEntry.countDocuments({ userId });
    
    // Get current streak
    let currentStreak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateString = formatDateString(checkDate);
      const hasEntry = await JournalEntry.findOne({ userId, dateString });
      
      if (!hasEntry) {
        // If today has no entry, don't break the streak yet
        if (isToday(checkDate)) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
      
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Prevent infinite loop - max 365 days
      if (currentStreak >= 365) break;
    }

    // Get monthly statistics for current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await JournalEntry.aggregate([
      {
        $match: {
          userId: userId,
          entryDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$entryDate' },
          count: { $sum: 1 },
          totalWords: { $sum: '$wordCount' },
          totalCharacters: { $sum: '$characterCount' },
          avgWritingDuration: { $avg: '$writingDuration' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get mood distribution
    const moodStats = await JournalEntry.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total words and average writing time
    const aggregateStats = await JournalEntry.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: '$wordCount' },
          totalCharacters: { $sum: '$characterCount' },
          avgWritingDuration: { $avg: '$writingDuration' },
          avgWordsPerEntry: { $avg: '$wordCount' }
        }
      }
    ]);

    const stats = aggregateStats[0] || {
      totalWords: 0,
      totalCharacters: 0,
      avgWritingDuration: 0,
      avgWordsPerEntry: 0
    };

    // Check if user has written today
    const hasWrittenToday = await JournalEntry.hasEntryForToday(userId);

    res.json({
      summary: {
        totalEntries,
        currentStreak,
        hasWrittenToday,
        totalWords: stats.totalWords,
        totalCharacters: stats.totalCharacters,
        averageWritingDuration: Math.round(stats.avgWritingDuration * 100) / 100,
        averageWordsPerEntry: Math.round(stats.avgWordsPerEntry * 100) / 100
      },
      monthlyStats: monthlyStats.map(month => ({
        month: month._id,
        entries: month.count,
        totalWords: month.totalWords,
        totalCharacters: month.totalCharacters,
        avgWritingDuration: Math.round(month.avgWritingDuration * 100) / 100
      })),
      moodDistribution: moodStats.reduce((acc, mood) => {
        acc[mood._id] = mood.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'An error occurred while fetching journal statistics'
    });
  }
};

/**
 * Check if user can write today
 */
const canWriteToday = async (req, res) => {
  try {
    const userId = req.userId;
    const hasWrittenToday = await JournalEntry.hasEntryForToday(userId);

    res.json({
      canWrite: !hasWrittenToday,
      hasWrittenToday
    });

  } catch (error) {
    console.error('Can write today error:', error);
    res.status(500).json({
      error: 'Failed to check writing status',
      message: 'An error occurred while checking if you can write today'
    });
  }
};

/**
 * Get calendar data showing which days user wrote entries
 */
const getCalendarData = async (req, res) => {
  try {
    const userId = req.userId;
    const { year, month } = req.query;

    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({
        error: 'Invalid month',
        message: 'Month must be between 1 and 12'
      });
    }

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const entries = await JournalEntry.find({
      userId,
      entryDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('entryDate dateString mood wordCount');

    // Create calendar data
    const calendarData = entries.map(entry => ({
      date: entry.dateString,
      mood: entry.mood,
      wordCount: entry.wordCount,
      hasEntry: true
    }));

    res.json({
      year: targetYear,
      month: targetMonth,
      entries: calendarData
    });

  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar data',
      message: 'An error occurred while fetching calendar data'
    });
  }
};

module.exports = {
  createEntry,
  getEntries,
  getEntry,
  getStats,
  canWriteToday,
  getCalendarData
};
