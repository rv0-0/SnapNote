import { format, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

/**
 * Format a date for display in the journal
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE'); // Monday, Tuesday, etc.
  }
  
  if (isThisMonth(dateObj)) {
    return format(dateObj, 'EEEE, MMM d'); // Monday, Jan 15
  }
  
  if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM d'); // Jan 15
  }
  
  return format(dateObj, 'MMM d, yyyy'); // Jan 15, 2023
};

/**
 * Format a date for display in full format
 */
export const formatFullDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE, MMMM d, yyyy'); // Monday, January 15, 2023
};

/**
 * Format time duration in seconds to readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Format a timer display (MM:SS)
 */
export const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get mood emoji
 */
export const getMoodEmoji = (mood: string): string => {
  const moodMap: Record<string, string> = {
    'very-happy': '😄',
    'happy': '😊',
    'neutral': '😐',
    'sad': '😔',
    'very-sad': '😢',
  };
  
  return moodMap[mood] || '😐';
};

/**
 * Get mood color
 */
export const getMoodColor = (mood: string): string => {
  const colorMap: Record<string, string> = {
    'very-happy': 'text-green-600',
    'happy': 'text-green-500',
    'neutral': 'text-gray-500',
    'sad': 'text-orange-500',
    'very-sad': 'text-red-500',
  };
  
  return colorMap[mood] || 'text-gray-500';
};

/**
 * Get mood background color
 */
export const getMoodBgColor = (mood: string): string => {
  const colorMap: Record<string, string> = {
    'very-happy': 'bg-green-100',
    'happy': 'bg-green-50',
    'neutral': 'bg-gray-50',
    'sad': 'bg-orange-50',
    'very-sad': 'bg-red-50',
  };
  
  return colorMap[mood] || 'bg-gray-50';
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Count words in text
 */
export const countWords = (text: string): number => {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

/**
 * Estimate reading time based on word count
 */
export const estimateReadingTime = (wordCount: number): number => {
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Calculate streak from journal entries
 */
export const calculateStreak = (entries: Array<{ dateString: string }>): number => {
  if (entries.length === 0) return 0;
  
  // Sort entries by date (most recent first)
  const sortedEntries = entries
    .map(entry => entry.dateString)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 0;
  let currentDate = new Date();
  
  // Start from today and work backwards
  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i]);
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    // Check if entry exists for expected date
    if (entryDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * Get progress percentage for a value
 */
export const getProgressPercentage = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
