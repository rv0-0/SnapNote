const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000, // Reasonable limit for 60-second entries
    trim: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  writingDuration: {
    type: Number, // Duration in seconds
    required: true,
    max: 60 // Maximum 60 seconds
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Date in YYYY-MM-DD format for daily uniqueness
  dateString: {
    type: String,
    required: true
  },
  mood: {
    type: String,
    enum: ['very-happy', 'happy', 'neutral', 'sad', 'very-sad'],
    default: 'neutral'
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  isCompleted: {
    type: Boolean,
    default: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    timezone: String
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate word and character counts
journalEntrySchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.characterCount = this.content.length;
    // Simple word count - split by whitespace and filter empty strings
    this.wordCount = this.content.trim() ? this.content.trim().split(/\s+/).length : 0;
  }
  
  // Set dateString for daily uniqueness
  if (this.isModified('entryDate') || this.isNew) {
    const date = new Date(this.entryDate);
    this.dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  
  next();
});

// Compound index to ensure one entry per user per day
journalEntrySchema.index({ userId: 1, dateString: 1 }, { unique: true });

// Index for efficient queries
journalEntrySchema.index({ userId: 1, entryDate: -1 });
journalEntrySchema.index({ userId: 1, createdAt: -1 });

// Static method to check if user has entry for today
journalEntrySchema.statics.hasEntryForToday = async function(userId, timezone = 'UTC') {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  const entry = await this.findOne({ 
    userId, 
    dateString 
  });
  
  return !!entry;
};

// Static method to get entries for a specific month
journalEntrySchema.statics.getEntriesForMonth = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.find({
    userId,
    entryDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ entryDate: -1 });
};

// Static method to search entries
journalEntrySchema.statics.searchEntries = async function(userId, searchTerm, limit = 20) {
  return this.find({
    userId,
    content: { $regex: searchTerm, $options: 'i' }
  })
  .sort({ entryDate: -1 })
  .limit(limit);
};

// Virtual for reading time estimation (average reading speed: 200 wpm)
journalEntrySchema.virtual('estimatedReadingTime').get(function() {
  const wordsPerMinute = 200;
  const readingTimeMinutes = this.wordCount / wordsPerMinute;
  return Math.max(1, Math.ceil(readingTimeMinutes));
});

// Transform output to include virtuals
journalEntrySchema.set('toJSON', { virtuals: true });
journalEntrySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
