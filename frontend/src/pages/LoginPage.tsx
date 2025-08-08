import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoginCredentials } from '../types';

const LoginPage: React.FC = () => {
  const [showMFA, setShowMFA] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      clearErrors();
      const success = await login(data);
      
      if (success) {
        navigate('/dashboard');
      } else if (!data.mfaCode) {
        // MFA required
        setShowMFA(true);
      }
    } catch (error: any) {
      if (error.message?.includes('MFA')) {
        setShowMFA(true);
      } else {
        setError('root', {
          type: 'manual',
          message: error.message || 'Login failed. Please try again.'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">SnapNote</span>
        </Link>
        
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            {showMFA && (
              <Input
                label="Two-Factor Authentication Code"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                {...register('mfaCode')}
                error={errors.mfaCode?.message}
                helperText="Enter the 6-digit code from your authenticator app"
              />
            )}

            {errors.root && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading === 'loading'}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  New to SnapNote?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/register">
                <Button variant="outline" fullWidth>
                  Create your account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
