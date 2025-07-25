// src/context/SessionContext.jsx - Fixed Session Management Context (No Auto Reset)
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

const SessionContext = createContext();

// Action types
const SESSION_ACTIONS = {
  UPDATE_SESSION_STATUS: 'UPDATE_SESSION_STATUS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_TIMEOUT_WARNING: 'SET_TIMEOUT_WARNING',
  INCREMENT_ACTIVITY: 'INCREMENT_ACTIVITY',
  CLEAR_SESSION: 'CLEAR_SESSION'
};

// Timeout options
const TIMEOUT_OPTIONS = [
  { value: 15 * 60 * 1000, label: '15 minutes', description: 'Short session' },
  { value: 30 * 60 * 1000, label: '30 minutes', description: 'Default session' },
  { value: 60 * 60 * 1000, label: '1 hour', description: 'Medium session' },
  { value: 2 * 60 * 60 * 1000, label: '2 hours', description: 'Long session' },
  { value: 4 * 60 * 60 * 1000, label: '4 hours', description: 'Extended session' },
  { value: -1, label: 'Never', description: 'No timeout' }
];

// Initial state
const initialState = {
  isActive: false,
  sessionId: null,
  startTime: null,
  lastActivity: null,
  timeRemaining: 0,
  timeoutDuration: 30 * 60 * 1000, // 30 minutes default
  activityCount: 0,
  showTimeoutWarning: false,
  settings: {
    showWarnings: true,
    trackActivity: true,
    timeoutDuration: 30 * 60 * 1000
  }
};

// Helper functions
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const formatDuration = (milliseconds) => {
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
};

// Reducer
const sessionReducer = (state, action) => {
  switch (action.type) {
    case SESSION_ACTIONS.UPDATE_SESSION_STATUS:
      return {
        ...state,
        ...action.payload
      };
    
    case SESSION_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    
    case SESSION_ACTIONS.SET_TIMEOUT_WARNING:
      return {
        ...state,
        showTimeoutWarning: action.payload
      };
    
    case SESSION_ACTIONS.INCREMENT_ACTIVITY:
      return {
        ...state,
        activityCount: state.activityCount + 1,
        lastActivity: Date.now()
      };
    
    case SESSION_ACTIONS.CLEAR_SESSION:
      return {
        ...initialState,
        settings: state.settings // Preserve settings
      };
    
    default:
      return state;
  }
};

// Context Provider
export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  
  // Use refs to store session timing data
  const sessionExpiryTime = useRef(null);
  const timeoutId = useRef(null);
  const warningTimeoutId = useRef(null);
  const activityThrottle = useRef(null);

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('gawde_session_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        dispatch({
          type: SESSION_ACTIONS.UPDATE_SETTINGS,
          payload: settings
        });
      }
    } catch (error) {
      console.error('Error loading session settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((settings) => {
    try {
      localStorage.setItem('gawde_session_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving session settings:', error);
    }
  }, []);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    if (warningTimeoutId.current) {
      clearTimeout(warningTimeoutId.current);
      warningTimeoutId.current = null;
    }
  }, []);

  // Set up session timeout
  const setupTimeout = useCallback((duration) => {
    clearTimeouts();
    
    // Don't set timeout if "Never" is selected
    if (duration === -1) {
      return;
    }
    
    const now = Date.now();
    sessionExpiryTime.current = now + duration;
    
    console.log('Setting up timeout for', duration / 1000, 'seconds. Expires at:', new Date(sessionExpiryTime.current));
    
    const warningTime = Math.max(0, duration - (5 * 60 * 1000)); // 5 minutes before timeout
    
    // Set warning timeout
    if (warningTime > 0 && state.settings.showWarnings) {
      warningTimeoutId.current = setTimeout(() => {
        dispatch({
          type: SESSION_ACTIONS.SET_TIMEOUT_WARNING,
          payload: true
        });
      }, warningTime);
    }
    
    // Set session timeout
    timeoutId.current = setTimeout(() => {
      dispatch({ type: SESSION_ACTIONS.CLEAR_SESSION });
      alert('Your session has expired due to inactivity. The page will reload.');
      window.location.reload();
    }, duration);
    
  }, [clearTimeouts, state.settings.showWarnings]);

  // Initialize session
  const startSession = useCallback(() => {
    const now = Date.now();
    const sessionId = generateSessionId();
    
    dispatch({
      type: SESSION_ACTIONS.UPDATE_SESSION_STATUS,
      payload: {
        isActive: true,
        sessionId,
        startTime: now,
        lastActivity: now,
        timeRemaining: state.settings.timeoutDuration
      }
    });
    
    setupTimeout(state.settings.timeoutDuration);
    console.log('Session started:', sessionId);
  }, [state.settings.timeoutDuration, setupTimeout]);

  // Track activity - THROTTLED and NO session extension
  const trackActivity = useCallback(() => {
    if (!state.settings.trackActivity || !state.isActive) return;
    
    // Throttle activity tracking to max once every 5 seconds
    if (activityThrottle.current) return;
    
    activityThrottle.current = setTimeout(() => {
      activityThrottle.current = null;
    }, 5000);
    
    dispatch({
      type: SESSION_ACTIONS.INCREMENT_ACTIVITY
    });
    
    // Only clear timeout warning, DO NOT extend session
    if (state.showTimeoutWarning) {
      dispatch({
        type: SESSION_ACTIONS.SET_TIMEOUT_WARNING,
        payload: false
      });
    }
  }, [state.settings.trackActivity, state.isActive, state.showTimeoutWarning]);

  // Update time remaining based on fixed expiry time
  const updateTimeRemaining = useCallback(() => {
    if (!state.isActive || state.settings.timeoutDuration === -1 || !sessionExpiryTime.current) {
      return;
    }
    
    const now = Date.now();
    const remaining = Math.max(0, sessionExpiryTime.current - now);
    
    dispatch({
      type: SESSION_ACTIONS.UPDATE_SESSION_STATUS,
      payload: {
        timeRemaining: remaining
      }
    });
    
    // Auto-expire if time runs out
    if (remaining <= 0 && state.isActive) {
      dispatch({ type: SESSION_ACTIONS.CLEAR_SESSION });
    }
  }, [state.isActive, state.settings.timeoutDuration]);

  // Extend session (ONLY called explicitly by user)
  const extendSession = useCallback(() => {
    if (!state.isActive) return;
    
    const now = Date.now();
    
    dispatch({
      type: SESSION_ACTIONS.UPDATE_SESSION_STATUS,
      payload: {
        lastActivity: now,
        timeRemaining: state.settings.timeoutDuration
      }
    });
    
    dispatch({
      type: SESSION_ACTIONS.SET_TIMEOUT_WARNING,
      payload: false
    });
    
    // Setup new timeout
    setupTimeout(state.settings.timeoutDuration);
    
    console.log('Session extended by user. New expiry:', new Date(sessionExpiryTime.current));
  }, [state.isActive, state.settings.timeoutDuration, setupTimeout]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    const updatedSettings = {
      ...state.settings,
      ...newSettings
    };
    
    dispatch({
      type: SESSION_ACTIONS.UPDATE_SETTINGS,
      payload: updatedSettings
    });
    
    saveSettings(updatedSettings);
    
    // If timeout duration changed and session is active, restart with new duration
    if (newSettings.timeoutDuration && state.isActive) {
      setupTimeout(newSettings.timeoutDuration);
    }
  }, [state.settings, state.isActive, saveSettings, setupTimeout]);

  // Clear session
  const clearSession = useCallback(() => {
    clearTimeouts();
    sessionExpiryTime.current = null;
    
    if (activityThrottle.current) {
      clearTimeout(activityThrottle.current);
      activityThrottle.current = null;
    }
    
    dispatch({ type: SESSION_ACTIONS.CLEAR_SESSION });
    return true;
  }, [clearTimeouts]);

  // Get session statistics
  const getSessionStatistics = useCallback(() => {
    if (!state.isActive || !state.startTime) {
      return null;
    }
    
    const now = Date.now();
    const sessionDuration = now - state.startTime;
    const timeSinceLastActivity = state.lastActivity ? now - state.lastActivity : 0;
    const averageActivityInterval = state.activityCount > 0 ? sessionDuration / state.activityCount : 0;
    
    return {
      sessionDuration,
      timeSinceLastActivity,
      averageActivityInterval,
      isActiveSession: state.isActive
    };
  }, [state.isActive, state.startTime, state.lastActivity, state.activityCount]);

  // Initialize session management - ONLY ONCE
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Start session after settings are loaded
  useEffect(() => {
    if (state.settings.timeoutDuration && !state.isActive) {
      startSession();
    }
  }, [state.settings.timeoutDuration, state.isActive, startSession]);

  // Set up activity listeners - ONLY ONCE
  useEffect(() => {
    const activityEvents = ['click', 'keydown', 'scroll'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });
    
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      clearTimeouts();
      if (activityThrottle.current) {
        clearTimeout(activityThrottle.current);
      }
    };
  }, [trackActivity, clearTimeouts]);

  // Update time remaining periodically
  useEffect(() => {
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [updateTimeRemaining]);

  const value = {
    // State
    isActive: state.isActive,
    sessionId: state.sessionId,
    startTime: state.startTime,
    lastActivity: state.lastActivity,
    timeRemaining: state.timeRemaining,
    timeoutDuration: state.timeoutDuration,
    activityCount: state.activityCount,
    settings: state.settings,
    showTimeoutWarning: state.showTimeoutWarning,
    
    // Actions
    updateSettings,
    extendSession,
    clearSession,
    trackActivity,
    getSessionStatistics,
    
    // Utilities
    formatTimeRemaining: formatDuration,
    getTimeoutOptions: () => TIMEOUT_OPTIONS
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;