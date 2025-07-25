// src/hooks/useSession.js - Simple Session Management Hook
import { useState, useEffect, useCallback } from 'react';

export const useSessionManagement = () => {
  const [sessionData, setSessionData] = useState({
    isActive: false,
    sessionId: null,
    startTime: null,
    lastActivity: null,
    timeRemaining: 0,
    timeoutDuration: 30 * 60 * 1000,
    activityCount: 0,
    showWarning: false
  });

  const [settings, setSettings] = useState({
    showWarnings: true,
    trackActivity: true,
    timeoutDuration: 30 * 60 * 1000
  });

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }, []);

  // Format time for display
  const formatTime = useCallback((milliseconds) => {
    if (milliseconds <= 0) return '0s';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Get timeout options
  const getTimeoutOptions = useCallback(() => {
    return [
      { value: 15 * 60 * 1000, label: '15 minutes', description: 'Short session' },
      { value: 30 * 60 * 1000, label: '30 minutes', description: 'Default session' },
      { value: 60 * 60 * 1000, label: '1 hour', description: 'Medium session' },
      { value: 2 * 60 * 60 * 1000, label: '2 hours', description: 'Long session' },
      { value: 4 * 60 * 60 * 1000, label: '4 hours', description: 'Extended session' },
      { value: -1, label: 'Never', description: 'No timeout' }
    ];
  }, []);

  // Start session
  const startSession = useCallback(() => {
    const now = Date.now();
    const sessionId = generateSessionId();
    
    setSessionData(prev => ({
      ...prev,
      isActive: true,
      sessionId,
      startTime: now,
      lastActivity: now,
      timeRemaining: settings.timeoutDuration
    }));
    
    console.log('Session started:', sessionId);
  }, [generateSessionId, settings.timeoutDuration]);

  // Track activity
  const trackActivity = useCallback(() => {
    if (!settings.trackActivity) return;
    
    const now = Date.now();
    
    setSessionData(prev => ({
      ...prev,
      lastActivity: now,
      activityCount: prev.activityCount + 1,
      showWarning: false
    }));
  }, [settings.trackActivity]);

  // Extend session
  const extendSession = useCallback(() => {
    trackActivity();
    setSessionData(prev => ({
      ...prev,
      showWarning: false
    }));
  }, [trackActivity]);

  // Set timeout duration
  const setTimeoutDuration = useCallback((duration) => {
    setSettings(prev => ({
      ...prev,
      timeoutDuration: duration
    }));
    
    setSessionData(prev => ({
      ...prev,
      timeoutDuration: duration
    }));
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    // Save to localStorage
    try {
      localStorage.setItem('gawde_session_settings', JSON.stringify({
        ...settings,
        ...newSettings
      }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Clear session
  const clearSession = useCallback(() => {
    try {
      setSessionData({
        isActive: false,
        sessionId: null,
        startTime: null,
        lastActivity: null,
        timeRemaining: 0,
        timeoutDuration: settings.timeoutDuration,
        activityCount: 0,
        showWarning: false
      });
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }, [settings.timeoutDuration]);

  // Get session statistics
  const getSessionStatistics = useCallback(() => {
    if (!sessionData.isActive || !sessionData.startTime) {
      return null;
    }

    const now = Date.now();
    const sessionDuration = now - sessionData.startTime;
    const timeSinceLastActivity = sessionData.lastActivity ? now - sessionData.lastActivity : 0;
    const averageActivityInterval = sessionData.activityCount > 0 ? 
      sessionDuration / sessionData.activityCount : 0;

    return {
      sessionDuration,
      timeSinceLastActivity,
      averageActivityInterval,
      isActiveSession: sessionData.isActive,
      totalActivities: sessionData.activityCount
    };
  }, [sessionData]);

  // Initialize session management
  useEffect(() => {
    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('gawde_session_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    startSession();
  }, [startSession]);

  // Set up activity tracking
  useEffect(() => {
    if (!settings.trackActivity) return;

    const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
    let activityTimeout;
    
    const handleActivity = () => {
      // Throttle activity tracking
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(trackActivity, 1000);
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimeout(activityTimeout);
    };
  }, [settings.trackActivity, trackActivity]);

  // Session timeout management
  useEffect(() => {
    if (!sessionData.isActive || settings.timeoutDuration === -1) return;

    let timeoutId, warningTimeoutId;
    
    const warningTime = Math.max(0, settings.timeoutDuration - (5 * 60 * 1000)); // 5 minutes before timeout
    
    // Set warning timeout
    if (warningTime > 0 && settings.showWarnings) {
      warningTimeoutId = setTimeout(() => {
        setSessionData(prev => ({
          ...prev,
          showWarning: true
        }));
      }, warningTime);
    }
    
    // Set session timeout
    timeoutId = setTimeout(() => {
      clearSession();
      alert('Your session has expired due to inactivity. The page will reload.');
      window.location.reload();
    }, settings.timeoutDuration);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
    };
  }, [sessionData.isActive, sessionData.lastActivity, settings.timeoutDuration, settings.showWarnings, clearSession]);

  // Update time remaining
  useEffect(() => {
    if (!sessionData.isActive || settings.timeoutDuration === -1) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (sessionData.lastActivity || now);
      const remaining = Math.max(0, settings.timeoutDuration - elapsed);
      
      setSessionData(prev => ({
        ...prev,
        timeRemaining: remaining
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData.isActive, sessionData.lastActivity, settings.timeoutDuration]);

  return {
    // Session data
    sessionData,
    settings,
    
    // Actions
    extendSession,
    clearSession,
    trackActivity,
    setTimeoutDuration,
    updateSettings,
    
    // Utilities
    formatTime,
    getTimeoutOptions,
    getSessionStatistics,
    
    // Computed values
    isSessionValid: sessionData.isActive && sessionData.timeRemaining > 0,
    timeUntilWarning: Math.max(0, sessionData.timeRemaining - (5 * 60 * 1000))
  };
};

export default useSessionManagement;