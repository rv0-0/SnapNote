import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import apiService from '../services/api';
import { CreateEntryData } from '../types';
import { countWords } from '../utils/helpers';
import toast from 'react-hot-toast';

const WritePage: React.FC = () => {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad'>('neutral');
  const [hasStartedWriting, setHasStartedWriting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canWrite, setCanWrite] = useState(true);

  const timer = useTimer({
    initialTime: 60,
    onComplete: handleTimerComplete
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkCanWrite();
  }, []);

  useEffect(() => {
    // Focus textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const checkCanWrite = async () => {
    try {
      const response = await apiService.canWriteToday();
      if (!response.canWrite) {
        toast.error('You have already written your entry for today!');
        navigate('/dashboard');
      }
      setCanWrite(response.canWrite);
    } catch (error) {
      console.error('Failed to check write status:', error);
      navigate('/dashboard');
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Start timer when user begins typing
    if (!hasStartedWriting && newContent.trim().length > 0) {
      setHasStartedWriting(true);
      timer.start();
    }
  };

  async function handleTimerComplete() {
    if (content.trim().length === 0) {
      toast.error('Please write something before submitting!');
      return;
    }

    await submitEntry();
  }

  const submitEntry = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const entryData: CreateEntryData = {
        content: content.trim(),
        writingDuration: timer.elapsed,
        mood,
      };

      await apiService.createEntry(entryData);
      
      toast.success('Entry saved successfully! 🎉');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to save entry:', error);
      toast.error(error.message || 'Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasStartedWriting && !timer.isCompleted) {
      const confirmed = window.confirm(
        'Are you sure you want to leave? Your progress will be lost.'
      );
      if (!confirmed) return;
    }
    navigate('/dashboard');
  };

  const handleManualSubmit = () => {
    if (content.trim().length === 0) {
      toast.error('Please write something before submitting!');
      return;
    }
    
    if (!hasStartedWriting) {
      toast.error('Please start writing first!');
      return;
    }

    submitEntry();
  };

  const wordCount = countWords(content);
  const characterCount = content.length;
  const isTimerActive = timer.isActive;
  const timeLeft = timer.timeLeft;
  const isCompleted = timer.isCompleted;

  if (!canWrite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Today's Entry
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Timer Display */}
              <div className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-lg
                ${isTimerActive ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 animate-timer-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
              `}>
                <span className="text-2xl">⏱️</span>
                <span>{timer.formatTime}</span>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Progress Bar */}
          {hasStartedWriting && (
            <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-1000 ease-out"
                style={{ width: `${timer.progress}%` }}
              />
            </div>
          )}

          <div className="p-6">
            {/* Instructions */}
            {!hasStartedWriting && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Ready to write? ✍️
                </h2>
                <p className="text-blue-800">
                  You have 60 seconds to capture your thoughts. The timer will start automatically 
                  when you begin typing. Write about anything - your day, feelings, experiences, or dreams.
                </p>
              </div>
            )}

            {/* Writing Area */}
            <div className="space-y-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing here... The timer will begin automatically."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg leading-relaxed"
                disabled={isCompleted || isSubmitting}
              />

              {/* Mood Selector */}
              {hasStartedWriting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How are you feeling today?
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { value: 'very-happy', emoji: '😄', label: 'Very Happy' },
                      { value: 'happy', emoji: '😊', label: 'Happy' },
                      { value: 'neutral', emoji: '😐', label: 'Neutral' },
                      { value: 'sad', emoji: '😔', label: 'Sad' },
                      { value: 'very-sad', emoji: '😢', label: 'Very Sad' }
                    ].map((moodOption) => (
                      <button
                        key={moodOption.value}
                        type="button"
                        onClick={() => setMood(moodOption.value as any)}
                        className={`
                          p-3 rounded-lg border-2 transition-colors
                          ${mood === moodOption.value 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        title={moodOption.label}
                      >
                        <span className="text-2xl">{moodOption.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span>{wordCount} words</span>
                  <span>{characterCount} characters</span>
                  {hasStartedWriting && (
                    <span>{timer.elapsed}s elapsed</span>
                  )}
                </div>
                
                {hasStartedWriting && !isCompleted && (
                  <span className="text-primary-600 font-medium">
                    Writing in progress...
                  </span>
                )}
                
                {isCompleted && (
                  <span className="text-green-600 font-medium">
                    Time's up! Ready to save.
                  </span>
                )}
              </div>

              {/* Submit Button */}
              {(isCompleted || (hasStartedWriting && timeLeft <= 10)) && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleManualSubmit}
                    loading={isSubmitting}
                    disabled={content.trim().length === 0}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritePage;
