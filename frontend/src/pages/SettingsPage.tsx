import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'export'>('account');
  const [loading, setLoading] = useState(false);
  
  // Account settings state
  const [preferences, setPreferences] = useState({
    emailReminders: user?.preferences?.emailReminders || false,
    theme: user?.preferences?.theme || theme
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true);
      await apiService.updatePreferences(preferences);
      await refreshUser();
      toast.success('Preferences updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const data = await apiService.exportData('json');
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'snapnote-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;

    try {
      setLoading(true);
      await apiService.deleteAccount(password);
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'export', label: 'Data', icon: '📁' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">SnapNote</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Dashboard
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {user?.email}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Reminders</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get daily reminders to write your journal entry</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailReminders}
                        onChange={(e) => setPreferences(prev => ({ ...prev, emailReminders: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => {
                          const newTheme = e.target.value as 'light' | 'dark';
                          setPreferences(prev => ({ ...prev, theme: newTheme }));
                          setTheme(newTheme); // Apply theme immediately
                        }}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      variant="primary" 
                      onClick={handlePreferencesUpdate}
                      loading={loading}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button 
                      variant="primary" 
                      onClick={handlePasswordChange}
                      loading={loading}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {user?.mfaEnabled ? 'Two-factor authentication is enabled.' : 'Two-factor authentication is not enabled.'}
                  </p>
                  <Button variant="outline" disabled>
                    {user?.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">MFA management coming soon.</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-4">Delete Account</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Input
                    label="Type 'DELETE MY ACCOUNT' to confirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="max-w-md mb-4"
                  />
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteAccount}
                    loading={loading}
                    disabled={deleteConfirm !== 'DELETE MY ACCOUNT'}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Export Your Data</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Download all your journal entries and account data. This includes your entries, 
                    writing statistics, and account information.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">JSON Export</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Download your data in JSON format, suitable for developers or data analysis.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        onClick={handleExportData}
                        loading={loading}
                      >
                        Download JSON
                      </Button>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 opacity-50">
                      <h4 className="font-medium text-gray-900 dark:text-white">PDF Export</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Download a formatted PDF of your journal entries.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        disabled
                      >
                        Download PDF (Coming Soon)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
