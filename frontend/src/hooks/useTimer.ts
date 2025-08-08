import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerState } from '../types';

interface UseTimerProps {
  initialTime?: number; // in seconds
  onComplete?: () => void;
  onTick?: (timeLeft: number) => void;
}

export const useTimer = ({ 
  initialTime = 60, 
  onComplete, 
  onTick 
}: UseTimerProps = {}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: initialTime,
    isActive: false,
    hasStarted: false,
    isCompleted: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Update refs when props change
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Timer logic
  useEffect(() => {
    if (timerState.isActive && timerState.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          // Call onTick callback
          if (onTickRef.current) {
            onTickRef.current(newTimeLeft);
          }
          
          // Check if timer completed
          if (newTimeLeft <= 0) {
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
            
            return {
              ...prev,
              timeLeft: 0,
              isActive: false,
              isCompleted: true,
            };
          }
          
          return {
            ...prev,
            timeLeft: newTimeLeft,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isActive, timerState.timeLeft]);

  const start = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: true,
      hasStarted: true,
    }));
  }, []);

  const pause = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const resume = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setTimerState({
      timeLeft: initialTime,
      isActive: false,
      hasStarted: false,
      isCompleted: false,
    });
  }, [initialTime]);

  const stop = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true,
    }));
  }, []);

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get progress percentage
  const getProgress = useCallback(() => {
    return ((initialTime - timerState.timeLeft) / initialTime) * 100;
  }, [initialTime, timerState.timeLeft]);

  // Get time elapsed
  const getElapsed = useCallback(() => {
    return initialTime - timerState.timeLeft;
  }, [initialTime, timerState.timeLeft]);

  return {
    ...timerState,
    start,
    pause,
    resume,
    reset,
    stop,
    formatTime: formatTime(timerState.timeLeft),
    progress: getProgress(),
    elapsed: getElapsed(),
  };
};
