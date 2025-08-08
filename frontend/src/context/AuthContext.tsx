import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoadingState, LoginCredentials, RegisterCredentials } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: LoadingState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<LoadingState>('loading');

  const isAuthenticated = !!user && apiService.isAuthenticated();

  const initializeAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        await refreshUser();
      } else {
        setLoading('idle');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setLoading('idle');
    }
  };

  const refreshUser = async () => {
    try {
      setLoading('loading');
      const response = await apiService.getProfile();
      setUser(response.user);
      setLoading('idle');
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setLoading('idle');
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      console.log('🔐 AUTHCONTEXT LOGIN START:', {
        timestamp: new Date().toISOString(),
        email: credentials.email,
        hasPassword: !!credentials.password,
        hasMfaCode: !!credentials.mfaCode
      });

      setLoading('loading');
      console.log('📡 CALLING API SERVICE LOGIN...');
      const response = await apiService.login(credentials);
      
      console.log('✅ API SERVICE RESPONSE:', {
        hasUser: !!response.user,
        requiresMFA: response.requiresMFA,
        message: response.message,
        userEmail: response.user?.email
      });

      if (response.requiresMFA) {
        console.log('⚠️ MFA REQUIRED - RETURNING FALSE');
        setLoading('idle');
        return false; // Indicates MFA is required
      }
      
      console.log('✅ SETTING USER AND SUCCESS STATE');
      setUser(response.user);
      setLoading('success');
      toast.success('Welcome back!');
      setTimeout(() => setLoading('idle'), 100);
      return true;
      
    } catch (error: any) {
      console.error('❌ AUTHCONTEXT LOGIN ERROR:', {
        error: error,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      setLoading('error');
      
      const errorMessage = error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      
      setTimeout(() => setLoading('idle'), 100);
      return false;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      setLoading('loading');
      const response = await apiService.register(credentials);
      
      setUser(response.user);
      setLoading('success');
      toast.success('Account created successfully!');
      setTimeout(() => setLoading('idle'), 100);
      return true;
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setLoading('error');
      
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      
      setTimeout(() => setLoading('idle'), 100);
      return false;
    }
  };

  const logout = async () => {
    try {
      setLoading('loading');
      await apiService.logout();
      setUser(null);
      setLoading('idle');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setLoading('idle');
    }
  };

  // Initialize user on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
