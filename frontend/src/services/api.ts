import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  User,
  JournalEntry,
  EntriesResponse,
  JournalStats,
  CalendarData,
  CreateEntryData,
  MFASetup,
  ChangePasswordData,
  UpdatePreferencesData,
  ApiError
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const original = error.config as any;
        
        if (error.response?.status === 401 && original && !original._isRetry) {
          original._isRetry = true;
          
          try {
            await this.refreshToken();
            const newToken = this.getAccessToken();
            if (newToken) {
              original.headers.Authorization = `Bearer ${newToken}`;
              return this.api(original);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return Cookies.get('accessToken') || null;
  }

  private getRefreshToken(): string | null {
    return Cookies.get('refreshToken') || null;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    // Set access token with shorter expiry (15 minutes)
    Cookies.set('accessToken', accessToken, { 
      expires: 1/96, // 15 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Set refresh token with longer expiry (7 days)
    Cookies.set('refreshToken', refreshToken, { 
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }

  private clearTokens(): void {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  }

  // Auth methods
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', credentials);
      
      if (response.data.tokens) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 FRONTEND LOGIN ATTEMPT:', {
        timestamp: new Date().toISOString(),
        email: credentials.email,
        hasPassword: !!credentials.password,
        hasMfaCode: !!credentials.mfaCode,
        apiUrl: `${this.baseURL}/auth/login`
      });

      console.log('📡 SENDING LOGIN REQUEST...');
      const response = await this.api.post<AuthResponse>('/auth/login', credentials);
      
      console.log('✅ LOGIN RESPONSE RECEIVED:', {
        status: response.status,
        hasTokens: !!response.data.tokens,
        requiresMFA: response.data.requiresMFA,
        hasUser: !!response.data.user,
        message: response.data.message
      });

      if (response.data.tokens) {
        console.log('🎫 STORING TOKENS...');
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        console.log('✅ TOKENS STORED SUCCESSFULLY');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ FRONTEND LOGIN ERROR:', {
        error: error,
        message: (error as any)?.message,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        timestamp: new Date().toISOString()
      });
      throw this.handleError(error);
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post('/auth/refresh-token', { refreshToken });
      
      if (response.data.accessToken) {
        Cookies.set('accessToken', response.data.accessToken, { 
          expires: 1/96, // 15 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
    } catch (error) {
      this.clearTokens();
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // MFA methods
  async setupMFA(): Promise<MFASetup> {
    try {
      const response = await this.api.post<MFASetup>('/auth/mfa/setup');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyMFA(code: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/mfa/verify', { code });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async disableMFA(password: string, mfaCode: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/mfa/disable', { password, mfaCode });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User methods
  async getProfile(): Promise<{ user: User }> {
    try {
      const response = await this.api.get<{ user: User }>('/user/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePreferences(preferences: UpdatePreferencesData): Promise<{ message: string; preferences: any }> {
    try {
      const response = await this.api.put('/user/preferences', preferences);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    try {
      const response = await this.api.put('/user/password', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exportData(format: 'json' | 'pdf' = 'json'): Promise<any> {
    try {
      const response = await this.api.get(`/user/export?format=${format}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAccount(password: string): Promise<{ message: string }> {
    try {
      const response = await this.api.delete('/user/account', {
        data: { 
          password, 
          confirmationText: 'DELETE MY ACCOUNT' 
        }
      });
      this.clearTokens();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Journal methods
  async createEntry(data: CreateEntryData): Promise<{ message: string; entry: JournalEntry }> {
    try {
      const response = await this.api.post('/journal/entries', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEntries(params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    search?: string;
  }): Promise<EntriesResponse> {
    try {
      const response = await this.api.get<EntriesResponse>('/journal/entries', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEntry(entryId: string): Promise<{ entry: JournalEntry }> {
    try {
      const response = await this.api.get<{ entry: JournalEntry }>(`/journal/entries/${entryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStats(): Promise<JournalStats> {
    try {
      const response = await this.api.get<JournalStats>('/journal/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async canWriteToday(): Promise<{ canWrite: boolean; hasWrittenToday: boolean }> {
    try {
      const response = await this.api.get('/journal/can-write-today');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCalendarData(year?: number, month?: number): Promise<CalendarData> {
    try {
      const params = { year, month };
      const response = await this.api.get<CalendarData>('/journal/calendar', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      
      return {
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.'
      };
    }
    
    return {
      error: 'Unknown Error',
      message: error.message || 'An unexpected error occurred.'
    };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
