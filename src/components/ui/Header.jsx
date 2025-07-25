// src/components/ui/Header.jsx - UPDATED VERSION (Toggle Removed)
import React from 'react';
import { 
  Clock, 
  Shield, 
  Activity, 
  AlertTriangle, 
  Building2, 
  Database, 
  TrendingUp, 
  CheckCircle2,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../theme/ThemeContext';

const Header = ({ 
  selectedSociety, 
  importedData, 
  processedData, 
  currentStep
}) => {
  const { 
    isActive, 
    timeRemaining, 
    activityCount, 
    showTimeoutWarning, 
    formatTimeRemaining, 
    extendSession 
  } = useSession();

  const { 
    currentTheme,
    toggleMode,
    isDarkMode
  } = useTheme();

  const getSessionStatusGradient = () => {
    if (!isActive) return 'from-red-500 to-red-600';
    if (showTimeoutWarning) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getSessionStatusIcon = () => {
    if (!isActive) return <Shield className="w-5 h-5 text-red-100" />;
    if (showTimeoutWarning) return <AlertTriangle className="w-5 h-5 text-yellow-100" />;
    return <CheckCircle2 className="w-5 h-5 text-green-100" />;
  };

  const getSessionProgress = () => {
    if (!isActive) return 0;
    return Math.max(0, Math.min(100, ((30 * 60 * 1000 - timeRemaining) / (30 * 60 * 1000)) * 100));
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Section - SIMPLIFIED (No Toggle) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gawde & Gawde Account Service
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Society Management System</p>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                    4-Step Workflow
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Dashboard */}
          <div className="flex items-center gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 group"
              title={`Switch to ${isDarkMode() ? 'light' : 'dark'} mode`}
            >
              {isDarkMode() ? (
                <Sun className="w-4 h-4 text-yellow-500 group-hover:rotate-180 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600 group-hover:-rotate-12 transition-transform duration-300" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDarkMode() ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Session Status Cards */}
            <div className="flex items-center gap-4">
              {/* Session Timer Card */}
              <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${getSessionStatusGradient()} rounded-xl shadow-lg text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {isActive ? formatTimeRemaining(timeRemaining) : 'Expired'}
                    </div>
                    <div className="text-xs opacity-90">
                      Session {isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                    <div 
                      className="h-full bg-white/70 transition-all duration-1000 ease-out"
                      style={{ width: `${getSessionProgress()}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Activity Counter */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-lg">{activityCount}</div>
                  <div className="text-xs opacity-90">Activities</div>
                </div>
              </div>

              {/* Session Status Badge */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-sm">
                {getSessionStatusIcon()}
                <div>
                  <div className={`text-sm font-semibold ${
                    isActive 
                      ? showTimeoutWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isActive ? (showTimeoutWarning ? 'Warning' : 'Secure') : 'Expired'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isActive ? 'Protected Session' : 'Access Denied'}
                  </div>
                </div>
              </div>
            </div>

            {/* Society Information Panel */}
            {selectedSociety && (
              <div className="border-l border-gray-200 dark:border-gray-600 pl-6">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Current Society</p>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300 max-w-xs truncate">
                      {selectedSociety}
                    </p>
                    
                    {/* Data Status Indicators */}
                    {(importedData.length > 0 || processedData.length > 0) && (
                      <div className="flex items-center gap-3 mt-2">
                        {importedData.length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Database className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                              {importedData.length} imported
                            </span>
                          </div>
                        )}
                        
                        {processedData.length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                              {processedData.length} processed
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                          <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            Step {currentStep}/4
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Session Warning Banner */}
        {showTimeoutWarning && (
          <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Session Timeout Warning
                  </h3>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Your session will expire soon due to inactivity. Click "Extend Session" to continue working safely.
                  </p>
                </div>
              </div>
              <button
                onClick={extendSession}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <Clock className="w-4 h-4" />
                Extend Session
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;