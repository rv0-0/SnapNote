import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import apiService from '../services/api';
import { JournalEntry, JournalStats } from '../types';
import { formatDate, getMoodEmoji, truncateText } from '../utils/helpers';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [canWrite, setCanWrite] = useState(false);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load multiple data sources in parallel
      const [canWriteResponse, entriesResponse, statsResponse] = await Promise.all([
        apiService.canWriteToday(),
        apiService.getEntries({ limit: 5 }),
        apiService.getStats()
      ]);

      setCanWrite(canWriteResponse.canWrite);
      setRecentEntries(entriesResponse.entries);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteClick = () => {
    if (canWrite) {
      navigate('/write');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
              <Link to="/settings" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Settings
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {canWrite ? 'Ready to write your daily entry?' : 'You\'ve already written today. Come back tomorrow!'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Write Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center">
                {canWrite ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Today's Entry
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Take a moment to reflect on your day. You have 60 seconds to capture your thoughts.
                    </p>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleWriteClick}
                    >
                      Start Writing ✍️
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Entry Complete! 🎉
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      You've already written your entry for today. Great job keeping up with your daily habit!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Come back tomorrow to continue your streak.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Entries</h2>
              </div>
              
              {recentEntries.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(entry.entryDate)}
                            </span>
                            <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {truncateText(entry.content, 150)}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{entry.wordCount} words</span>
                            <span>{entry.writingDuration}s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No entries yet. Start writing to see them here!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            {stats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Streak</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {stats.summary.currentStreak} days
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Entries</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stats.summary.totalEntries}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Words</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stats.summary.totalWords.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Duration</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.round(stats.summary.averageWritingDuration)}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Button variant="outline" fullWidth>
                  View All Entries
                </Button>
                <Button variant="outline" fullWidth>
                  Export Data
                </Button>
                <Link to="/settings">
                  <Button variant="outline" fullWidth>
                    Account Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
