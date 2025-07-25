// src/components/ui/Sidebar.jsx - UPDATED VERSION (With View Data Option)
import React from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Home, 
  Settings, 
  RefreshCw, 
  Code, 
  Clock, 
  Shield,
  Sun,
  Moon,
  Activity,
  Zap,
  X,
  ChevronLeft,
  BarChart3
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../theme/ThemeContext';

const NAV_ITEMS = [
  { id: 'import', label: 'Import Data', icon: Upload, gradient: 'from-blue-500 to-blue-600' },
  { id: 'process', label: 'Process Data', icon: RefreshCw, gradient: 'from-green-500 to-green-600' },
  { id: 'view', label: 'View Data', icon: BarChart3, gradient: 'from-purple-500 to-purple-600' }, // NEW
  { id: 'converter', label: 'Rule Converter', icon: Code, gradient: 'from-orange-500 to-orange-600' },
  { id: 'settings', label: 'Settings', icon: Settings, gradient: 'from-gray-500 to-gray-600' }
];

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  selectedSociety, 
  hasData, 
  onExport, 
  onClearData,
  isCollapsed,
  toggleSidebar
}) => {
  // Return null if collapsed
  if (isCollapsed) return null;

  const { 
    isActive, 
    timeRemaining, 
    formatTimeRemaining, 
    extendSession, 
    showTimeoutWarning,
    activityCount 
  } = useSession();

  const { 
    currentTheme, 
    toggleMode, 
    isDarkMode 
  } = useTheme();

  const getSessionStatusColor = () => {
    if (!isActive) return 'text-red-500';
    if (showTimeoutWarning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSessionStatusBg = () => {
    if (!isActive) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (showTimeoutWarning) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  return (
    <nav className="w-72 bg-white dark:bg-gray-800 shadow-lg min-h-screen border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="p-6">
        {/* Logo/Brand Section with Toggle Button */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gawde Service</p>
              </div>
            </div>
            
            {/* Hide Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group"
              title="Hide sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
            </button>
          </div>
          
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {isDarkMode() ? (
                <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDarkMode() ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${
              isDarkMode() ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                isDarkMode() ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="space-y-2 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActiveTab = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                  isActiveTab
                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg transform scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:transform hover:translate-x-1'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActiveTab 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.id === 'import' && (
                    <div className="text-xs opacity-75">Society Data Import</div>
                  )}
                  {item.id === 'process' && (
                    <div className="text-xs opacity-75">Apply Rules</div>
                  )}
                  {item.id === 'converter' && (
                    <div className="text-xs opacity-75">Json Rule Builder</div>
                  )}
                  {item.id === 'view' && (
                    <div className="text-xs opacity-75">View, Analyze & Reports</div>
                  )}
                </div>
                
                {/* Status indicators */}
                {item.id === 'settings' && showTimeoutWarning && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                )}
                {item.id === 'view' && hasData && (
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                )}
                {isActiveTab && (
                  <div className="w-1 h-6 bg-white/50 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Session Status Panel */}
        <div className={`p-4 rounded-xl border ${getSessionStatusBg()} mb-6`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'}`}>
              <Shield className={`w-4 h-4 ${getSessionStatusColor()}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Session Status</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isActive ? 'Active Session' : 'Session Expired'}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Time Remaining */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Time Left</span>
              </div>
              <div className={`text-xs font-mono font-medium ${getSessionStatusColor()}`}>
                {isActive ? formatTimeRemaining(timeRemaining) : 'Expired'}
              </div>
            </div>

            {/* Activity Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Activities</span>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {activityCount}
              </div>
            </div>

            {/* Session Progress Bar */}
            {isActive && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Session Progress</span>
                  <span>{Math.round((1 - timeRemaining / (30 * 60 * 1000)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                    style={{ width: `${Math.round((1 - timeRemaining / (30 * 60 * 1000)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Extend Session Button */}
            <button
              onClick={extendSession}
              disabled={!isActive}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              Extend Session
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {selectedSociety && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Quick Actions</h3>
            </div>
            
            <div className="space-y-2">
              {hasData && (
                <>
                  <button
                    onClick={() => setActiveTab('view')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Data
                  </button>
                  
                  <button
                    onClick={() => onExport('excel')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                </>
              )}
              
              <button
                onClick={() => setActiveTab('import')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Import New Data
              </button>
              
              {hasData && (
                <button
                  onClick={onClearData}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Clear Data
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Society Info */}
        {selectedSociety && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-lg">
                <Home className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">Active Society</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium break-words leading-tight">
              {selectedSociety}
            </p>
            {hasData && (
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-xs text-green-600 dark:text-green-400">
                  Data loaded and ready
                </p>
              </div>
            )}
          </div>
        )}

        {/* Session Warning */}
        {showTimeoutWarning && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Session Warning</h3>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              Your session will expire soon due to inactivity. Extend now to continue working.
            </p>
            <button
              onClick={extendSession}
              className="w-full px-3 py-2 text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              Extend Session Now
            </button>
          </div>
        )}

        {/* Theme Preview Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <Settings className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Current Theme</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-700 dark:text-purple-300">Mode</span>
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200 capitalize">
                {currentTheme}
              </span>
            </div>
            
            {/* Theme color preview */}
            <div className="flex gap-1 justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium"
            >
              Customize Theme →
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Gawde Account Service
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              v2.1 - Enhanced with View Data
            </p>
            <div className="flex justify-center gap-1 mt-2">
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              <div className="w-1 h-1 bg-green-400 rounded-full" />
              <div className="w-1 h-1 bg-purple-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;