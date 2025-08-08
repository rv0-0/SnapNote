export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  preferences: {
    emailReminders: boolean;
    theme: 'light' | 'dark';
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  content: string;
  wordCount: number;
  characterCount: number;
  writingDuration: number;
  mood: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
  tags: string[];
  entryDate: Date;
  dateString: string;
  estimatedReadingTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  requiresMFA?: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any[];
}

export interface JournalStats {
  summary: {
    totalEntries: number;
    currentStreak: number;
    hasWrittenToday: boolean;
    totalWords: number;
    totalCharacters: number;
    averageWritingDuration: number;
    averageWordsPerEntry: number;
  };
  monthlyStats: Array<{
    month: number;
    entries: number;
    totalWords: number;
    totalCharacters: number;
    avgWritingDuration: number;
  }>;
  moodDistribution: Record<string, number>;
}

export interface CalendarEntry {
  date: string;
  mood: string;
  wordCount: number;
  hasEntry: boolean;
}

export interface CalendarData {
  year: number;
  month: number;
  entries: CalendarEntry[];
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface CreateEntryData {
  content: string;
  writingDuration: number;
  mood?: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
  tags?: string[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EntriesResponse {
  entries: JournalEntry[];
  pagination: PaginationInfo;
  hasWrittenToday: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePreferencesData {
  emailReminders?: boolean;
  theme?: 'light' | 'dark';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface TimerState {
  timeLeft: number;
  isActive: boolean;
  hasStarted: boolean;
  isCompleted: boolean;
}
