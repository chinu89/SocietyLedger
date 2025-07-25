// src/components/settings/SessionSettings.jsx - Fixed Version
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  Activity, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';

const SessionSettings = () => {
  const {
    isActive,
    sessionId,
    startTime,
    lastActivity,
    timeRemaining,
    timeoutDuration,
    activityCount,
    settings,
    showTimeoutWarning,
    updateSettings,
    clearSession,
    getSessionStatistics,
    formatTimeRemaining,
    getTimeoutOptions,
    extendSession
  } = useSession();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [securityRecommendations, setSecurityRecommendations] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);

  // Function to generate security recommendations
  const getSecurityRecommendations = () => {
    const recommendations = [];
    
    if (!settings.showWarnings) {
      recommendations.push({
        type: 'warning',
        title: 'Timeout warnings disabled',
        description: 'Enable timeout warnings to prevent unexpected session expiry.'
      });
    }
    
    if (!settings.trackActivity) {
      recommendations.push({
        type: 'info',
        title: 'Activity tracking disabled',
        description: 'Activity tracking helps maintain accurate session timing.'
      });
    }
    
    if (timeoutDuration === -1) {
      recommendations.push({
        type: 'error',
        title: 'No session timeout',
        description: 'Consider setting a timeout for better security.'
      });
    }
    
    if (timeoutDuration > 2 * 60 * 60 * 1000) { // > 2 hours
      recommendations.push({
        type: 'warning',
        title: 'Long session timeout',
        description: 'Consider a shorter timeout for better security.'
      });
    }
    
    if (activityCount > 100) {
      recommendations.push({
        type: 'info',
        title: 'High activity session',
        description: 'You have been very active this session. Consider taking breaks.'
      });
    }
    
    return recommendations;
  };

  // Load security recommendations and session stats
  useEffect(() => {
    setSecurityRecommendations(getSecurityRecommendations());
    setSessionStats(getSessionStatistics());
  }, [getSessionStatistics, settings, timeoutDuration, activityCount]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStats(getSessionStatistics());
      setSecurityRecommendations(getSecurityRecommendations());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [getSessionStatistics, settings, timeoutDuration, activityCount]);

  const handleClearSession = () => {
    setConfirmAction('clearSession');
    setShowConfirmDialog(true);
  };

  const handleClearAllData = () => {
    setConfirmAction('clearAllData');
    setShowConfirmDialog(true);
  };

  const executeConfirmAction = () => {
    if (confirmAction === 'clearSession' || confirmAction === 'clearAllData') {
      const success = clearSession();
      if (success) {
        alert('All application data has been cleared successfully.');
        window.location.reload();
      } else {
        alert('Error clearing data. Please try again.');
      }
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleTimeoutChange = (newTimeout) => {
    updateSettings({ timeoutDuration: newTimeout });
  };

  const handleSettingChange = (setting, value) => {
    updateSettings({ [setting]: value });
  };

  const exportSessionData = () => {
    const exportData = {
      sessionInfo: {
        sessionId,
        startTime,
        lastActivity,
        activityCount,
        sessionDuration: sessionStats?.sessionDuration
      },
      settings,
      timestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gawde_session_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (isActive) => {
    return isActive ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-red-600" />
    );
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session & Security Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(isActive)}
            <span className={`text-sm font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isActive ? 'Active Session' : 'Session Inactive'}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400">
          Manage your session timeout, security preferences, and application data.
        </p>
      </div>

      {/* Current Session Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Current Session Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Session ID</p>
                <p className="text-xs text-blue-500 dark:text-blue-300 font-mono break-all">
                  {sessionId ? sessionId.substring(0, 20) + '...' : 'Not available'}
                </p>
              </div>
              <Shield className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Time Remaining</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {isActive ? formatTimeRemaining(timeRemaining) : 'Expired'}
                </p>
              </div>
              <Clock className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Activity Count</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{activityCount}</p>
              </div>
              <Activity className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Session Duration</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {sessionStats ? formatTimeRemaining(sessionStats.sessionDuration) : '0s'}
                </p>
              </div>
              <Clock className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Session Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={extendSession}
            disabled={!isActive}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Extend Session
          </button>
          
          <button
            onClick={exportSessionData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Session Data
          </button>
        </div>
      </div>

      {/* Timeout Warning */}
      {showTimeoutWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Session Timeout Warning</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your session will expire soon due to inactivity. Click "Extend Session" to continue.
              </p>
            </div>
            <button
              onClick={extendSession}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Extend
            </button>
          </div>
        </div>
      )}

      {/* Session Timeout Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Session Timeout
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Automatic timeout duration
            </label>
            <select
              value={timeoutDuration}
              onChange={(e) => handleTimeoutChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {getTimeoutOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Show timeout warnings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Display warning before session expires</p>
            </div>
            <button
              onClick={() => handleSettingChange('showWarnings', !settings.showWarnings)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showWarnings ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showWarnings ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Track user activity</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitor user interactions for session management</p>
            </div>
            <button
              onClick={() => handleSettingChange('trackActivity', !settings.trackActivity)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.trackActivity ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.trackActivity ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            {/* Session Statistics */}
            {sessionStats && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Session Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Time since last activity:</span>
                    <div className="font-mono text-gray-900 dark:text-white">
                      {formatTimeRemaining(sessionStats.timeSinceLastActivity)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Average activity interval:</span>
                    <div className="font-mono text-gray-900 dark:text-white">
                      {formatTimeRemaining(sessionStats.averageActivityInterval)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Session active:</span>
                    <div className={`font-medium ${sessionStats.isActiveSession ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {sessionStats.isActiveSession ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total activities:</span>
                    <div className="font-mono text-gray-900 dark:text-white">{activityCount}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Recommendations */}
            {securityRecommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Security Recommendations</h3>
                <div className="space-y-2">
                  {securityRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Data Management
        </h2>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Clear Session Data</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  This will clear your current session but preserve your society data and imported files.
                </p>
                <button
                  onClick={handleClearSession}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Session Only
                </button>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">Clear All Application Data</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  <strong>Warning:</strong> This will permanently delete all your societies, imported data, 
                  processed results, and settings. This action cannot be undone.
                </p>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Action</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmAction === 'clearSession' 
                ? 'Are you sure you want to clear your current session? This will log you out but preserve your data.'
                : 'Are you sure you want to clear ALL application data? This action cannot be undone and will delete all your societies, imported data, and settings.'
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={executeConfirmAction}
                className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSettings;