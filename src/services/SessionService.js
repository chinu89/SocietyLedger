// src/services/sessionService.js - Complete Session Management Service
class SessionService {
  constructor() {
    this.sessionKey = 'gawde_session_v1';
    this.activityKey = 'gawde_last_activity';
    this.timeoutDuration = 30 * 60 * 1000; // 30 minutes default
    this.warningDuration = 5 * 60 * 1000; // 5 minutes warning
    this.activityListeners = [];
    this.timeoutTimer = null;
    this.warningTimer = null;
    this.isActive = false;
    this.callbacks = {
      onTimeout: null,
      onWarning: null,
      onActivity: null
    };
    
    this.initializeSession();
    this.setupActivityListeners();
  }

  /**
   * Initialize session with current timestamp
   */
  initializeSession() {
    const now = Date.now();
    const sessionData = {
      startTime: now,
      lastActivity: now,
      isActive: true,
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      timeoutDuration: this.timeoutDuration
    };
    
    this.saveSession(sessionData);
    this.updateLastActivity();
    this.isActive = true;
    
    console.log('Session initialized:', sessionData.sessionId);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up activity monitoring
   */
  setupActivityListeners() {
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];

    const throttledActivity = this.throttle(() => {
      this.updateActivity();
    }, 1000); // Throttle to once per second

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
      this.activityListeners.push({ event, handler: throttledActivity });
    });

    // Also monitor navigation
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });

    // Check for existing session on load
    this.validateExistingSession();
  }

  /**
   * Update user activity timestamp
   */
  updateActivity() {
    if (!this.isActive) return;

    const now = Date.now();
    this.updateLastActivity(now);
    
    // Reset timeout timers
    this.resetTimeoutTimers();
    
    // Notify callbacks
    if (this.callbacks.onActivity) {
      this.callbacks.onActivity(now);
    }
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(timestamp = Date.now()) {
    localStorage.setItem(this.activityKey, timestamp.toString());
    
    // Update session data
    const sessionData = this.getSession();
    if (sessionData) {
      sessionData.lastActivity = timestamp;
      this.saveSession(sessionData);
    }
  }

  /**
   * Reset timeout timers
   */
  resetTimeoutTimers() {
    // Clear existing timers
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showTimeoutWarning();
    }, this.timeoutDuration - this.warningDuration);

    // Set timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.timeoutDuration);
  }

  /**
   * Show timeout warning
   */
  showTimeoutWarning() {
    console.log('Session timeout warning');
    if (this.callbacks.onWarning) {
      this.callbacks.onWarning(this.warningDuration);
    }
  }

  /**
   * Handle session timeout
   */
  handleSessionTimeout() {
    console.log('Session timed out');
    this.isActive = false;
    
    if (this.callbacks.onTimeout) {
      this.callbacks.onTimeout();
    }
    
    this.clearSession();
  }

  /**
   * Validate existing session on page load
   */
  validateExistingSession() {
    const sessionData = this.getSession();
    const lastActivity = this.getLastActivity();
    
    if (!sessionData || !lastActivity) {
      // No existing session, create new one
      this.initializeSession();
      return;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    
    if (timeSinceLastActivity > this.timeoutDuration) {
      // Session expired
      console.log('Existing session expired');
      this.clearSession();
      this.initializeSession();
    } else {
      // Session valid, continue with remaining time
      console.log('Resuming existing session');
      this.isActive = true;
      const remainingTime = this.timeoutDuration - timeSinceLastActivity;
      
      if (remainingTime <= this.warningDuration) {
        this.showTimeoutWarning();
      }
      
      // Set timeout for remaining time
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, remainingTime);
    }
  }

  /**
   * Get session data from localStorage
   */
  getSession() {
    try {
      const sessionStr = localStorage.getItem(this.sessionKey);
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  /**
   * Save session data to localStorage
   */
  saveSession(sessionData) {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  /**
   * Get last activity timestamp
   */
  getLastActivity() {
    const timestamp = localStorage.getItem(this.activityKey);
    return timestamp ? parseInt(timestamp, 10) : null;
  }

  /**
   * Clear all session data
   */
  clearSession() {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.activityKey);
    this.isActive = false;
    
    // Clear timers
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    console.log('Session cleared');
  }

  /**
   * Clear all application data (for settings)
   */
  clearAllApplicationData() {
    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      
      // Remove all Gawde-related data
      keys.forEach(key => {
        if (key.startsWith('gawde_') || key.startsWith('gawde-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear session
      this.clearSession();
      
      // Reinitialize session
      this.initializeSession();
      
      console.log('All application data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing application data:', error);
      return false;
    }
  }

  /**
   * Set timeout duration
   */
  setTimeoutDuration(duration) {
    this.timeoutDuration = duration;
    
    // Update session data
    const sessionData = this.getSession();
    if (sessionData) {
      sessionData.timeoutDuration = duration;
      this.saveSession(sessionData);
    }
    
    // Reset timers with new duration
    this.resetTimeoutTimers();
    
    console.log('Timeout duration updated:', duration);
  }

  /**
   * Get session status
   */
  getSessionStatus() {
    const sessionData = this.getSession();
    const lastActivity = this.getLastActivity();
    
    if (!sessionData || !lastActivity) {
      return {
        isActive: false,
        sessionId: null,
        startTime: null,
        lastActivity: null,
        timeRemaining: 0
      };
    }

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    const timeRemaining = Math.max(0, this.timeoutDuration - timeSinceLastActivity);
    
    return {
      isActive: this.isActive && timeRemaining > 0,
      sessionId: sessionData.sessionId,
      startTime: sessionData.startTime,
      lastActivity: lastActivity,
      timeRemaining: timeRemaining,
      timeoutDuration: this.timeoutDuration,
      warningThreshold: this.warningDuration
    };
  }

  /**
   * Extend session (reset activity)
   */
  extendSession() {
    if (this.isActive) {
      this.updateActivity();
      console.log('Session extended');
    }
  }

  /**
   * Register callbacks for session events
   */
  onTimeout(callback) {
    this.callbacks.onTimeout = callback;
  }

  onWarning(callback) {
    this.callbacks.onWarning = callback;
  }

  onActivity(callback) {
    this.callbacks.onActivity = callback;
  }

  /**
   * Handle page unload
   */
  handlePageUnload() {
    if (this.isActive) {
      this.updateLastActivity();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove activity listeners
    this.activityListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler, true);
    });
    this.activityListeners = [];
    
    // Clear timers
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    
    // Clear callbacks
    this.callbacks = {
      onTimeout: null,
      onWarning: null,
      onActivity: null
    };
    
    console.log('Session service destroyed');
  }

  /**
   * Utility: Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Get timeout duration options
   */
  static getTimeoutOptions() {
    return [
      { label: '15 minutes', value: 15 * 60 * 1000, description: 'Short session for quick tasks' },
      { label: '30 minutes', value: 30 * 60 * 1000, description: 'Default timeout duration' },
      { label: '1 hour', value: 60 * 60 * 1000, description: 'Extended session for longer work' },
      { label: '2 hours', value: 2 * 60 * 60 * 1000, description: 'Long session for complex tasks' },
      { label: '4 hours', value: 4 * 60 * 60 * 1000, description: 'Very long session' },
      { label: 'Never', value: 24 * 60 * 60 * 1000, description: 'Disable automatic timeout' }
    ];
  }

  /**
   * Format time duration for display
   */
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Create singleton instance
export const sessionService = new SessionService();
export default sessionService;